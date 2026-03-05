const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Tool = require('../models/Tool');
const { sendEmail } = require('../utils/sendEmail');

const PAYSTACK_BASE = 'https://api.paystack.co';
const PLATFORM_COMMISSION = 0.10;
const fmt = (date) => new Date(date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

const paystackHeaders = () => ({
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

const initiatePayment = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('toolId', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
    if (booking.renterId.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized.' });
    if (booking.status !== 'approved') return res.status(400).json({ success: false, message: 'Booking must be approved before payment.' });
    if (booking.paymentStatus === 'paid') return res.status(400).json({ success: false, message: 'Already paid.' });

    const reference = `TSA-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
    const amountInKobo = booking.totalAmount * 100;
    const platformFeeKobo = Math.round(amountInKobo * PLATFORM_COMMISSION);
    const ownerAmountKobo = amountInKobo - platformFeeKobo;

    await Payment.create({
      bookingId: booking._id, userId: req.user._id, ownerId: booking.ownerId,
      amount: amountInKobo, platformFee: platformFeeKobo, ownerAmount: ownerAmountKobo,
      reference, status: 'pending',
    });

    const paystackRes = await axios.post(`${PAYSTACK_BASE}/transaction/initialize`, {
      email: req.user.email,
      amount: amountInKobo,
      reference,
      metadata: { bookingId: booking._id.toString(), toolName: booking.toolId?.name, userId: req.user._id.toString() },
      callback_url: `${process.env.CLIENT_URL}/bookings?payment=success&ref=${reference}`,
    }, { headers: paystackHeaders() });

    const { authorization_url, access_code } = paystackRes.data.data;
    res.status(200).json({
      success: true,
      data: { authorizationUrl: authorization_url, accessCode: access_code, reference, amount: booking.totalAmount },
    });
  } catch (error) {
    console.error('initiatePayment:', error.response?.data || error.message);
    if (error.response) return res.status(400).json({ success: false, message: error.response.data.message });
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { reference } = req.body;
    if (!reference) return res.status(400).json({ success: false, message: 'Reference required.' });

    const paystackRes = await axios.get(`${PAYSTACK_BASE}/transaction/verify/${reference}`, { headers: paystackHeaders() });
    const { status, data } = paystackRes.data;

    if (!status || data.status !== 'success') {
      await Payment.findOneAndUpdate({ reference }, { status: 'failed' });
      return res.status(400).json({ success: false, message: 'Payment not successful.' });
    }

    const payment = await Payment.findOneAndUpdate({ reference }, { status: 'success', paystackData: data }, { new: true });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

    const booking = await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'paid' }, { new: true })
      .populate('toolId', 'name').populate('renterId', 'name email').populate('ownerId', 'name email phone');

    // Email renter receipt
    sendEmail({
      to: booking.renterId.email,
      subject: `🎉 Payment confirmed for ${booking.toolId.name}`,
      template: 'paymentConfirmed',
      data: {
        renterName: booking.renterId.name,
        toolName: booking.toolId.name,
        startDate: fmt(booking.startDate),
        endDate: fmt(booking.endDate),
        totalAmount: booking.totalAmount,
        reference,
        ownerName: booking.ownerId.name,
        ownerPhone: booking.ownerId.phone,
      },
    });

    // Auto payout to owner
    const owner = await User.findById(payment.ownerId);
    let payoutInitiated = false;
    if (owner?.bankDetails?.recipientCode) {
      const result = await triggerOwnerPayout(payment, owner, booking.toolId.name);
      payoutInitiated = !!result;
    }

    res.status(200).json({ success: true, message: 'Payment verified!', payment, payoutInitiated });
  } catch (error) {
    console.error('verifyPayment:', error.response?.data || error.message);
    if (error.response) return res.status(400).json({ success: false, message: error.response.data.message });
    next(error);
  }
};

// Paystack Webhook
const paystackWebhook = async (req, res) => {
  try {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');
    if (hash !== req.headers['x-paystack-signature']) return res.status(401).send('Invalid signature');

    const { event, data } = req.body;
    if (event === 'charge.success') {
      const payment = await Payment.findOne({ reference: data.reference });
      if (payment && payment.status !== 'success') {
        await Payment.findOneAndUpdate({ reference: data.reference }, { status: 'success', paystackData: data });
        await Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: 'paid' });
        console.log('✅ Webhook: payment confirmed', data.reference);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook error:', err.message);
    res.sendStatus(200);
  }
};

const triggerOwnerPayout = async (payment, owner, toolName) => {
  try {
    const transferRef = `TSA-PAYOUT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now()}`;
    const transferRes = await axios.post(`${PAYSTACK_BASE}/transfer`, {
      source: 'balance',
      amount: payment.ownerAmount,
      recipient: owner.bankDetails.recipientCode,
      reason: `ToolShare Africa payout`,
      reference: transferRef,
    }, { headers: paystackHeaders() });

    await Payment.findByIdAndUpdate(payment._id, {
      transferStatus: 'pending', transferReference: transferRef, transferData: transferRes.data.data,
    });

    // Email owner
    sendEmail({
      to: owner.email,
      subject: '💰 Your ToolShare payout has been sent!',
      template: 'payoutSent',
      data: {
        ownerName: owner.name,
        toolName: toolName || 'Tool rental',
        amount: payment.ownerAmount / 100,
        platformFee: payment.platformFee / 100,
        reference: transferRef,
      },
    });

    return transferRes.data;
  } catch (err) {
    console.error('Payout error:', err.response?.data || err.message);
    await Payment.findByIdAndUpdate(payment._id, { transferStatus: 'failed' });
    return null;
  }
};

const saveBankDetails = async (req, res, next) => {
  try {
    const { bankName, accountNumber, bankCode } = req.body;
    if (!bankName || !accountNumber || !bankCode)
      return res.status(400).json({ success: false, message: 'All fields required.' });
    if (accountNumber.length !== 10)
      return res.status(400).json({ success: false, message: 'Account number must be 10 digits.' });

    let accountName = req.user.name;
    let recipientCode = null;

    try {
      const verifyRes = await axios.get(`${PAYSTACK_BASE}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`, { headers: paystackHeaders() });
      accountName = verifyRes.data.data.account_name;
    } catch (e) { console.log('Account verify skipped:', e.response?.data?.message); }

    try {
      const recipientRes = await axios.post(`${PAYSTACK_BASE}/transferrecipient`, {
        type: 'nuban', name: accountName, account_number: accountNumber, bank_code: bankCode, currency: 'NGN',
      }, { headers: paystackHeaders() });
      recipientCode = recipientRes.data.data.recipient_code;
    } catch (e) { console.log('Recipient create skipped:', e.response?.data?.message); }

    await User.findByIdAndUpdate(req.user._id, { bankDetails: { bankName, accountNumber, accountName, bankCode, recipientCode } });
    res.status(200).json({ success: true, message: 'Bank details saved!', accountName, recipientCode });
  } catch (error) { next(error); }
};

const getBanks = async (req, res, next) => {
  try {
    const { data } = await axios.get(`${PAYSTACK_BASE}/bank?country=nigeria&perPage=100`, { headers: paystackHeaders() });
    res.status(200).json({ success: true, banks: data.data });
  } catch (error) { next(error); }
};

const getPaymentByBooking = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ bookingId: req.params.bookingId });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
    res.status(200).json({ success: true, payment });
  } catch (error) { next(error); }
};

module.exports = { initiatePayment, verifyPayment, paystackWebhook, saveBankDetails, getBanks, getPaymentByBooking };