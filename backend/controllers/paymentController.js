const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');

const PAYSTACK_BASE = 'https://api.paystack.co';
const PLATFORM_COMMISSION = 0.10;

const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

// ─── INITIATE PAYMENT ────────────────────────────────────────────────────────
const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('toolId', 'name');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.renterId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'approved')
      return res.status(400).json({ success: false, message: 'Booking must be approved before payment.' });
    if (booking.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'Already paid.' });

    const reference = `TSA-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
    const amountInKobo = booking.totalAmount * 100;
    const platformFeeKobo = Math.round(amountInKobo * PLATFORM_COMMISSION);
    const ownerAmountKobo = amountInKobo - platformFeeKobo;

    await Payment.create({
      bookingId: booking._id,
      userId: req.user._id,
      ownerId: booking.ownerId,
      amount: amountInKobo,
      platformFee: platformFeeKobo,
      ownerAmount: ownerAmountKobo,
      reference,
      status: 'pending',
    });

    const paystackRes = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email: req.user.email,
        amount: amountInKobo,
        reference,
        metadata: {
          bookingId: booking._id.toString(),
          toolName: booking.toolId?.name,
          userId: req.user._id.toString(),
          ownerId: booking.ownerId.toString(),
        },
        callback_url: `${process.env.CLIENT_URL}/bookings?payment=success&ref=${reference}`,
      },
      { headers: paystackHeaders() }
    );

    const { authorization_url, access_code } = paystackRes.data.data;

    res.status(200).json({
      success: true,
      message: 'Payment initialized.',
      data: {
        authorizationUrl: authorization_url,
        accessCode: access_code,
        reference,
        amount: booking.totalAmount,
        platformFee: platformFeeKobo / 100,
        ownerAmount: ownerAmountKobo / 100,
      },
    });
  } catch (error) {
    console.error('initiatePayment error:', error.response?.data || error.message);
    if (error.response) return res.status(400).json({ success: false, message: error.response.data.message });
    next(error);
  }
};

// ─── VERIFY PAYMENT ──────────────────────────────────────────────────────────
const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ success: false, message: 'Reference required.' });

    const paystackRes = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${reference}`,
      { headers: paystackHeaders() }
    );

    const { status, data } = paystackRes.data;

    if (!status || data.status !== 'success') {
      await Payment.findOneAndUpdate({ reference }, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment not successful.' });
    }

    const payment = await Payment.findOneAndUpdate(
      { reference },
      { status: 'success', paystackData: data },
      { new: true }
    );

    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

    await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'paid' });

    const owner = await User.findById(payment.ownerId);
    let payoutInitiated = false;

    if (owner?.bankDetails?.recipientCode) {
      const result = await triggerOwnerPayout(payment, owner);
      payoutInitiated = !!result;
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully!',
      payment,
      payoutInitiated,
      payoutMessage: payoutInitiated
        ? 'Owner payout has been initiated.'
        : 'Owner has not set up bank details yet. Payout pending.',
    });
  } catch (error) {
    console.error('verifyPayment error:', error.response?.data || error.message);
    if (error.response) return res.status(400).json({ success: false, message: error.response.data.message });
    next(error);
  }
};

// ─── TRIGGER OWNER PAYOUT ────────────────────────────────────────────────────
const triggerOwnerPayout = async (payment, owner) => {
  try {
    const transferRef = `TSA-PAYOUT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;

    const transferRes = await axios.post(
      `${PAYSTACK_BASE}/transfer`,
      {
        source: 'balance',
        amount: payment.ownerAmount,
        recipient: owner.bankDetails.recipientCode,
        reason: `ToolShare Africa payout - Booking #${payment.bookingId}`,
        reference: transferRef,
      },
      { headers: paystackHeaders() }
    );

    await Payment.findByIdAndUpdate(payment._id, {
      transferStatus: 'pending',
      transferReference: transferRef,
      transferData: transferRes.data.data,
    });

    return transferRes.data;
  } catch (err) {
    console.error('Payout error:', err.response?.data || err.message);
    await Payment.findByIdAndUpdate(payment._id, { transferStatus: 'failed' });
    return null;
  }
};

// ─── SAVE BANK DETAILS ───────────────────────────────────────────────────────
const saveBankDetails = async (req, res, next) => {
  try {
    const { bankName, accountNumber, bankCode } = req.body;

    if (!bankName || !accountNumber || !bankCode) {
      return res.status(400).json({ success: false, message: 'Bank name, account number, and bank code are required.' });
    }
    if (accountNumber.length !== 10) {
      return res.status(400).json({ success: false, message: 'Account number must be 10 digits.' });
    }

    let accountName = req.user.name; // fallback to user's name
    let recipientCode = null;

    // Step 1: Try to verify account with Paystack
    try {
      const verifyRes = await axios.get(
        `${PAYSTACK_BASE}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: paystackHeaders() }
      );
      accountName = verifyRes.data.data.account_name;
      console.log('Account verified:', accountName);
    } catch (verifyErr) {
      console.error('Account verification failed:', verifyErr.response?.data || verifyErr.message);
      // Don't block - continue without verification in test mode
      console.log('Continuing without account verification (test mode limitation)');
    }

    // Step 2: Try to create Paystack Transfer Recipient
    try {
      const recipientRes = await axios.post(
        `${PAYSTACK_BASE}/transferrecipient`,
        {
          type: 'nuban',
          name: accountName,
          account_number: accountNumber,
          bank_code: bankCode,
          currency: 'NGN',
        },
        { headers: paystackHeaders() }
      );
      recipientCode = recipientRes.data.data.recipient_code;
      console.log('Recipient created:', recipientCode);
    } catch (recipientErr) {
      console.error('Recipient creation failed:', recipientErr.response?.data || recipientErr.message);
      // Save details without recipient code - payout won't auto-trigger but details are stored
    }

    // Step 3: Save to user regardless
    await User.findByIdAndUpdate(req.user._id, {
      bankDetails: {
        bankName,
        accountNumber,
        accountName,
        bankCode,
        recipientCode,
      },
    });

    res.status(200).json({
      success: true,
      message: recipientCode
        ? 'Bank details saved! You will receive automatic payouts.'
        : 'Bank details saved. Note: automatic transfers require Paystack account activation.',
      accountName,
      recipientCode,
    });
  } catch (error) {
    console.error('saveBankDetails error:', error.response?.data || error.message);
    next(error);
  }
};

// ─── GET NIGERIAN BANKS ──────────────────────────────────────────────────────
const getBanks = async (req, res, next) => {
  try {
    const { data } = await axios.get(
      `${PAYSTACK_BASE}/bank?country=nigeria&perPage=100`,
      { headers: paystackHeaders() }
    );
    res.status(200).json({ success: true, banks: data.data });
  } catch (error) {
    console.error('getBanks error:', error.response?.data || error.message);
    next(error);
  }
};

// ─── MANUAL PAYOUT ───────────────────────────────────────────────────────────
const triggerManualPayout = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    if (payment.status !== 'success') return res.status(400).json({ success: false, message: 'Payment not verified yet.' });
    if (payment.transferStatus === 'success') return res.status(400).json({ success: false, message: 'Payout already sent.' });

    const owner = await User.findById(payment.ownerId);
    if (!owner?.bankDetails?.recipientCode) {
      return res.status(400).json({ success: false, message: 'Owner has not set up bank details yet.' });
    }

    const result = await triggerOwnerPayout(payment, owner);
    if (!result) return res.status(500).json({ success: false, message: 'Payout failed. Check Paystack balance.' });

    res.status(200).json({ success: true, message: 'Payout initiated!', data: result });
  } catch (error) {
    next(error);
  }
};

// ─── GET PAYMENT BY BOOKING ──────────────────────────────────────────────────
const getPaymentByBooking = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.status(200).json({ success: true, payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  verifyPayment,
  saveBankDetails,
  getBanks,
  triggerManualPayout,
  getPaymentByBooking,
};