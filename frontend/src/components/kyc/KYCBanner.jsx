import { Link } from 'react-router-dom';
import { Shield, Clock, XCircle } from 'lucide-react';

export default function KYCBanner({ kyc }) {
  const status = kyc?.status || 'not_submitted';
  if (status === 'approved') return null;

  const config = {
    not_submitted: {
      bg: 'bg-orange-50 border-orange-200',
      icon: <Shield size={20} className="text-orange-500 flex-shrink-0 mt-0.5" />,
      title: '⚠️ Verify Your Identity to Unlock Full Access',
      message: 'You need to complete identity verification (KYC) before you can list tools or make bookings. It takes less than 2 minutes.',
      btn: 'Complete Verification Now →',
      btnStyle: 'bg-orange-500 hover:bg-orange-600 text-white',
    },
    pending: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <Clock size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />,
      title: '🕐 Identity Verification Under Review',
      message: 'Your documents are being reviewed. This usually takes less than 24 hours. You will receive an email once approved.',
      btn: 'View KYC Status →',
      btnStyle: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    },
    rejected: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />,
      title: '❌ Verification Failed — Action Required',
      message: kyc?.rejectionReason || 'Your documents could not be verified. Please resubmit with clearer documents.',
      btn: 'Resubmit Documents →',
      btnStyle: 'bg-red-500 hover:bg-red-600 text-white',
    },
  };

  const c = config[status];

  return (
    <div className={`border rounded-2xl p-4 mb-6 ${c.bg}`}>
      <div className="flex items-start gap-3">
        {c.icon}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm mb-0.5">{c.title}</p>
          <p className="text-xs text-gray-600 mb-3">{c.message}</p>
          <Link to="/kyc" className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-colors ${c.btnStyle}`}>
            {c.btn}
          </Link>
        </div>
      </div>
    </div>
  );
}