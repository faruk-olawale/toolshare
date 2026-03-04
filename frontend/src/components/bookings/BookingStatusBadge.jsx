export default function BookingStatusBadge({ status, paymentStatus }) {
  const statusMap = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    completed: 'badge-completed',
  };

  const labels = {
    pending: '⏳ Pending',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
    completed: '🏁 Completed',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      <span className={statusMap[status] || 'badge bg-gray-100 text-gray-600'}>
        {labels[status] || status}
      </span>
      {paymentStatus && (
        <span className={paymentStatus === 'paid' ? 'badge-paid' : 'badge-unpaid'}>
          {paymentStatus === 'paid' ? '💳 Paid' : '💳 Unpaid'}
        </span>
      )}
    </div>
  );
}
