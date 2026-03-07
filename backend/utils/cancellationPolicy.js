/**
 * Cancellation Policy Rules:
 * - 7+ days before start  → 100% refund
 * - 3–6 days before start → 50% refund
 * - 1–2 days before start → 25% refund  
 * - Same day or after     → 0% refund (deposit forfeited)
 * - Owner cancels anytime → 100% refund to renter
 */

const getCancellationPolicy = (startDate, cancelledByRole) => {
  if (cancelledByRole === 'owner' || cancelledByRole === 'admin') {
    return { percent: 100, policy: 'full', label: 'Full refund — owner/admin cancelled' };
  }

  const now = new Date();
  const start = new Date(startDate);
  const daysUntilStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

  if (daysUntilStart >= 7)  return { percent: 100, policy: 'full',    label: 'Full refund (7+ days notice)' };
  if (daysUntilStart >= 3)  return { percent: 50,  policy: 'partial',  label: '50% refund (3–6 days notice)' };
  if (daysUntilStart >= 1)  return { percent: 25,  policy: 'partial',  label: '25% refund (1–2 days notice)' };
  return                           { percent: 0,   policy: 'none',     label: 'No refund (same day or started)' };
};

const calculateDepositAmount = (totalAmount) => {
  // 20% of total as security deposit, min ₦1000, max ₦50000
  const deposit = Math.round(totalAmount * 0.2);
  return Math.min(Math.max(deposit, 1000), 50000);
};

module.exports = { getCancellationPolicy, calculateDepositAmount };