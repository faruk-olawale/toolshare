import { CheckCircle, Clock, AlertTriangle, Shield } from 'lucide-react';

export default function EscrowStatus({ booking }) {
  const { escrow, paymentStatus, dispute, status } = booking;

  const steps = [
    {
      key: 'paid',
      label: 'Payment Secured',
      desc: 'Full payment held safely in escrow',
      done: ['paid', 'partially_released', 'fully_released'].includes(paymentStatus),
    },
    {
      key: 'receipt',
      label: 'Tool Received',
      desc: 'Renter confirms receiving the tool → 50% released to owner',
      done: escrow?.renterConfirmedReceipt,
    },
    {
      key: 'return',
      label: 'Tool Returned',
      desc: 'Owner confirms tool returned → remaining 50% released',
      done: escrow?.ownerConfirmedReturn,
    },
    {
      key: 'complete',
      label: 'Rental Complete',
      desc: 'All funds released. Rental finished!',
      done: status === 'completed',
    },
  ];

  if (dispute?.active) return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-red-800">Dispute Active</p>
          <p className="text-sm text-red-600 mt-0.5">{dispute.reason}</p>
          <p className="text-xs text-red-400 mt-1">Admin is reviewing — resolution within 24 hours</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gradient-to-br from-brand-50 to-earth-50 border border-brand-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Shield size={16} className="text-brand-500" />
        <p className="font-semibold text-gray-800 text-sm">Escrow Protection</p>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.key} className="flex items-start gap-3">
            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${step.done ? 'bg-green-500' : 'bg-gray-200'}`}>
              {step.done ? <CheckCircle size={14} className="text-white" /> : <Clock size={12} className="text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${step.done ? 'text-green-700' : 'text-gray-500'}`}>{step.label}</p>
              <p className="text-xs text-gray-400">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}