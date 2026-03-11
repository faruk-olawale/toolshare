import { useState } from 'react';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { getImgUrl, PLACEHOLDER } from '../../utils/imgUrl';

function ToolPreviewModal({ tool, onClose, onApprove, onReject }) {
  const [imgIdx, setImgIdx] = useState(0);
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="relative bg-gray-100 rounded-t-2xl overflow-hidden" style={{ height: '260px' }}>
          <img src={tool.images?.length ? getImgUrl(tool.images[imgIdx]) : PLACEHOLDER}
            className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
          {tool.images?.length > 1 && (<>
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
          </>)}
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg">✕</button>
          <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">Pending Review</span>
        </div>
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
              <p className="text-xs font-semibold text-gray-500 mb-2">Proof of Ownership ({tool.ownershipDocs.length} file{tool.ownershipDocs.length > 1 ? 's' : ''})</p>
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
            <button onClick={onReject} className="btn-secondary flex-1 py-2.5 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-1">
              <XCircle size={14} /> Reject
            </button>
            <button onClick={onApprove} className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-1">
              <CheckCircle size={14} /> Approve & Go Live
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ToolsTab({ pendingTools, tools: toolsProp, onVerify, onRejectClick, processing }) {
  const [previewTool, setPreviewTool] = useState(null);
  const tools = pendingTools ?? toolsProp ?? [];

  if (tools.length === 0) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-3">✅</div>
      <p className="text-gray-500">No tools pending review</p>
    </div>
  );

  return (
    <>
      <div className="space-y-4">
        {tools.map(tool => (
          <div key={tool._id} className="card p-4">
            <div className="flex gap-3 mb-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-earth-100">
                <img src={getImgUrl(tool.images?.[0])} className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER; }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{tool.name}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="badge bg-purple-50 text-purple-700 border-purple-100 text-xs">{tool.category}</span>
                  <span className="badge bg-gray-50 text-gray-600 border-gray-100 text-xs">{tool.location}</span>
                </div>
                <div className="text-brand-600 font-bold text-sm mt-1">₦{tool.pricePerDay?.toLocaleString()}/day</div>
                <p className="text-xs text-gray-400 truncate">{tool.ownerId?.name} · {tool.ownerId?.email}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${tool.ownerId?.kyc?.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                  Owner KYC: {tool.ownerId?.kyc?.status || 'not submitted'}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{tool.description}</p>
            {tool.ownershipNote && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-3">
                <p className="text-xs font-medium text-blue-700 mb-1">Owner's note about ownership:</p>
                <p className="text-sm text-blue-800">{tool.ownershipNote}</p>
              </div>
            )}
            {tool.ownershipDocs?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-2">Proof of Ownership Documents:</p>
                <div className="flex flex-wrap gap-2">
                  {tool.ownershipDocs.map((doc, i) => (
                    <a key={i} href={getImgUrl(doc)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100">
                      📄 Document {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <button onClick={() => setPreviewTool(tool)} className="btn-secondary py-2 px-3 text-sm flex items-center justify-center gap-1">
                <Eye size={13} /> Preview
              </button>
              <button onClick={() => onRejectClick(tool._id)} disabled={processing === tool._id}
                className="btn-secondary py-2 px-4 text-sm text-red-500 border-red-100 hover:bg-red-50 flex items-center justify-center gap-1">
                <XCircle size={14} /> Reject
              </button>
              <button onClick={() => onVerify(tool._id)} disabled={processing === tool._id}
                className="btn-primary py-2 px-4 text-sm flex items-center justify-center gap-1 flex-1">
                <CheckCircle size={14} /> {processing === tool._id ? 'Processing...' : 'Approve & Go Live'}
              </button>
            </div>
          </div>
        ))}
      </div>
      {previewTool && (
        <ToolPreviewModal tool={previewTool} onClose={() => setPreviewTool(null)}
          onApprove={() => { onVerify(previewTool._id); setPreviewTool(null); }}
          onReject={() => { onRejectClick(previewTool._id); setPreviewTool(null); }} />
      )}
    </>
  );
}