import { Link } from 'react-router-dom';
import { Shield, Clock, XCircle } from 'lucide-react';

export default function KYCBanner({ kyc }) {
  const status = kyc?.status || 'not_submitted';
  if (status === 'approved') return null;

  const config = {
    not_submitted: {
      bg: 'bg-[#eef6f1] border-[#a8d4bb]',
      icon: <Shield size={20} className="text-[#1a5c3a] flex-shrink-0 mt-0.5" />,
      title: '🪪 One quick step before you book',
      message: 'Verify your identity to book or list tools. Takes under 2 minutes — just your ID and a selfie.',
      btn: 'Verify now — it\'s quick →',
      btnStyle: 'bg-[#1a5c3a] hover:bg-[#154d30] text-white',
    },
    pending: {

      bg: 'bg-yellow-50 border-yellow-200',
      icon: <Clock size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />,
      title: '🕐 We\'re reviewing your documents',
      message: 'Usually done within a few hours. We\'ll email you the moment you\'re approved.',
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