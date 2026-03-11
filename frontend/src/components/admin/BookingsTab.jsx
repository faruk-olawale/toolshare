export default function BookingsTab({ allBookings, bookings: bookingsProp }) {
  const bookings = allBookings ?? bookingsProp ?? [];
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Tool', 'Renter', 'Amount', 'Status', 'Payment', 'Date'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map(b => (
              <tr key={b._id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{b.toolId?.name}</td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{b.renterId?.name}</td>
                <td className="px-4 py-3 font-semibold text-brand-600 whitespace-nowrap">₦{b.totalAmount?.toLocaleString()}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`badge text-xs ${b.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : b.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : b.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`badge text-xs ${b.paymentStatus === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {b.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}