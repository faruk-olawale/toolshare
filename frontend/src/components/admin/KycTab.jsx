import { CheckCircle, XCircle } from 'lucide-react';
import { getImgUrl } from '../../utils/imgUrl';

export default function KycTab({ users, onApprove, onRejectClick, processing }) {
  if (users.length === 0) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-3">✅</div>
      <p className="text-gray-500">No KYC submissions pending</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {users.map(user => (
        <div key={user._id} className="card p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-gray-900">{user.name}</h3>
              <p className="text-sm text-gray-500">{user.email} · {user.phone}</p>
              <div className="flex gap-2 mt-1">
                <span className={`badge text-xs ${user.role === 'owner' ? 'bg-brand-50 text-brand-700 border-brand-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{user.role}</span>
                <span className="badge text-xs bg-yellow-50 text-yellow-700 border-yellow-100">KYC Pending</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">{new Date(user.kyc?.submittedAt).toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">ID Type</p>
              <p className="text-sm font-medium text-gray-800 capitalize">{user.kyc?.idType?.replace('_', ' ')}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-1">ID Number</p>
              <p className="text-sm font-medium text-gray-800">{user.kyc?.idNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {user.kyc?.idDocument && (
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">ID Document</p>
                <a href={getImgUrl(user.kyc.idDocument)} target="_blank" rel="noreferrer">
                  <img src={getImgUrl(user.kyc.idDocument)} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
                </a>
              </div>
            )}
            {user.kyc?.selfie && (
              <div>
                <p className="text-xs text-gray-500 mb-1 font-medium">Selfie with ID</p>
                <a href={getImgUrl(user.kyc.selfie)} target="_blank" rel="noreferrer">
                  <img src={getImgUrl(user.kyc.selfie)} className="w-full h-32 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition" />
                </a>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={() => onRejectClick(user._id)} disabled={processing === user._id}
              className="btn-secondary py-2 px-4 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-1">
              <XCircle size={14} /> Reject
            </button>
            <button onClick={() => onApprove(user._id)} disabled={processing === user._id}
              className="btn-primary py-2 px-4 text-sm flex items-center justify-center gap-1 flex-1">
              <CheckCircle size={14} /> {processing === user._id ? 'Processing...' : 'Approve Identity'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}