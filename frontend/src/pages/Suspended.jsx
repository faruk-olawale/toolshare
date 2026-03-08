import { useSearchParams, Link } from 'react-router-dom';

export default function Suspended() {
  const [params] = useSearchParams();
  const reason = params.get('reason') || 'Policy violation';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-3xl">🚫</span>
        </div>
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Account Suspended</h1>
        <p className="text-gray-500 text-sm mb-4">Your ToolShare Africa account has been suspended by our admin team.</p>
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
          <p className="text-xs font-semibold text-red-700 mb-1">Reason:</p>
          <p className="text-sm text-red-800">{decodeURIComponent(reason)}</p>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          If you believe this is a mistake, please contact our support team to appeal the decision.
        </p>
        <Link to="/contact" className="btn-primary w-full py-3 block text-center">
          Contact Support →
        </Link>
        <Link to="/" className="block mt-3 text-sm text-gray-400 hover:text-gray-600">
          Back to Home
        </Link>
      </div>
    </div>
  );
}