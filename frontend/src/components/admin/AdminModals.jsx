import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { getImgUrl, PLACEHOLDER } from '../../utils/imgUrl';

// ── Reject Modal (tool or KYC) ────────────────────────────────────────────────
export function RejectModal({ modal, onConfirm, onClose, processing }) {
  const [reason, setReason] = useState('');
  if (!modal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
        <h3 className="font-display font-bold text-lg text-gray-900 mb-2">
          {modal.type === 'rejectTool' ? 'Reject Tool Listing' : 'Reject KYC Submission'}
        </h3>
        <p className="text-sm text-gray-500 mb-4">Provide a reason so the user knows what to fix:</p>
        <textarea className="input-field resize-none mb-4" rows={4}
          placeholder={modal.type === 'rejectTool'
            ? 'e.g. No proof of ownership provided, images unclear...'
            : 'e.g. ID document is blurry, selfie does not match ID...'}
          value={reason} onChange={e => setReason(e.target.value)} />
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={!reason || processing}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
            {processing ? 'Processing...' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete User Modal ─────────────────────────────────────────────────────────
export function DeleteUserModal({ user, onConfirm, onClose, processing }) {
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🗑️</span>
        </div>
        <h3 className="font-display font-bold text-lg text-gray-900 mb-2 text-center">Delete Account</h3>
        <p className="text-sm text-gray-500 text-center mb-1">You are about to permanently delete:</p>
        <p className="text-center font-semibold text-gray-800 mb-1">{user.name}</p>
        <p className="text-center text-sm text-gray-400 mb-4">{user.email} · {user.role}</p>
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-5">
          <p className="text-xs text-red-600 text-center">⚠️ This cannot be undone. All their tools, bookings and data will be permanently deleted.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={onConfirm} disabled={processing === user._id}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
            {processing === user._id ? 'Deleting...' : '🗑️ Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Suspend User Modal ────────────────────────────────────────────────────────
export function SuspendUserModal({ user, onConfirm, onClose, processing }) {
  const [reason, setReason] = useState('');
  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🚫</span>
        </div>
        <h3 className="font-display font-bold text-lg text-gray-900 mb-1 text-center">Suspend Account</h3>
        <p className="text-center font-semibold text-gray-800 mb-0.5">{user.name}</p>
        <p className="text-center text-sm text-gray-400 mb-4">{user.email} · {user.role}</p>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Reason for suspension <span className="text-red-500">*</span>
          </label>
          <textarea rows={3} className="input-field resize-none"
            placeholder="e.g. Tool not returned after multiple reminders, fraudulent activity..."
            value={reason} onChange={e => setReason(e.target.value)} />
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 mb-5">
          <p className="text-xs text-orange-700">The user will be notified by email and will not be able to log in until reinstated.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button disabled={!reason.trim() || processing === user._id}
            onClick={() => onConfirm(reason)}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-3 rounded-xl transition-colors disabled:opacity-50">
            {processing === user._id ? 'Suspending...' : '🚫 Suspend Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tool Preview Modal ────────────────────────────────────────────────────────
export function ToolPreviewModal({ tool, onApprove, onReject, onClose }) {
  const [imgIdx, setImgIdx] = useState(0);
  if (!tool) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Images */}
        <div className="relative bg-gray-100 rounded-t-2xl overflow-hidden" style={{ height: '260px' }}>
          <img
            src={tool.images?.length ? getImgUrl(tool.images[imgIdx]) : PLACEHOLDER}
            className="w-full h-full object-cover"
            onError={e => { e.target.src = PLACEHOLDER; }}
          />
          {tool.images?.length > 1 && (
            <>
              <button onClick={() => setImgIdx(i => (i - 1 + tool.images.length) % tool.images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">‹</button>
              <button onClick={() => setImgIdx(i => (i + 1) % tool.images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">›</button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {tool.images.map((_, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">✕</button>
          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">Pending Review</span>
        </div>

        {/* Details */}
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-display font-bold text-gray-900 text-lg">{tool.name}</h2>
            <span className="text-brand-600 font-bold text-lg whitespace-nowrap">₦{tool.pricePerDay?.toLocaleString()}/day</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="badge bg-purple-50 text-purple-700 border-purple-100 text-xs">{tool.category}</span>
            <span className="badge bg-gray-50 text-gray-600 border-gray-100 text-xs">📍 {tool.location}</span>
            <span className="badge bg-blue-50 text-blue-600 border-blue-100 text-xs">{tool.condition}</span>
          </div>
          <p className="text-sm text-gray-600">{tool.description}</p>

          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-gray-500 mb-1">Listed by</p>
            <p className="text-sm font-medium text-gray-800">{tool.ownerId?.name}</p>
            <p className="text-xs text-gray-400">{tool.ownerId?.email}</p>
          </div>

          {tool.ownershipDocs?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Proof of Ownership ({tool.ownershipDocs.length} file{tool.ownershipDocs.length > 1 ? 's' : ''})
              </p>
              <div className="flex flex-wrap gap-2">
                {tool.ownershipDocs.map((doc, i) => (
                  <a key={i} href={getImgUrl(doc)} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100">
                    📄 Document {i + 1} ↗
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onReject}
              className="btn-secondary flex-1 py-2.5 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-1">
              <XCircle size={14} /> Reject
            </button>
            <button onClick={onApprove}
              className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-1">
              <CheckCircle size={14} /> Approve & Go Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}