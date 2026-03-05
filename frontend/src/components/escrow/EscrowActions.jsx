import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, Package, RotateCcw } from 'lucide-react';

export default function EscrowActions({ booking, onUpdate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(null);
  const [disputeModal, setDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');

  const isRenter = user?._id === booking.renterId?._id || user?._id === booking.renterId;
  const isOwner = user?._id === booking.ownerId?._id || user?._id === booking.ownerId;
  const { escrow, paymentStatus, dispute, status } = booking;

  const confirmReceipt = async () => {
    setLoading('receipt');
    try {
      const { data } = await api.post(`/escrow/${booking._id}/confirm-receipt`);
      toast.success('Receipt confirmed! 50% released to owner ✅');
      onUpdate(data.booking);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm receipt.');
    } finally { setLoading(null); }
  };

  const confirmReturn = async () => {
    setLoading('return');
    try {
      const { data } = await api.post(`/escrow/${booking._id}/confirm-return`);
      toast.success('Return confirmed! Final payout sent to owner 🎉');
      onUpdate(data.booking);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm return.');
    } finally { setLoading(null); }
  };

  const raiseDispute = async () => {
    if (!disputeReason.trim()) return toast.error('Please describe the issue.');
    setLoading('dispute');
    try {
      const { data } = await api.post(`/escrow/${booking._id}/dispute`, { reason: disputeReason });
      toast.success('Dispute raised. Admin will review within 24 hours.');
      setDisputeModal(false);
      setDisputeReason('');
      onUpdate(data.booking);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to raise dispute.');
    } finally { setLoading(null); }
  };

  // Don't show if not paid or already completed
  if (!['paid', 'partially_released'].includes(paymentStatus)) return null;
  if (status === 'completed' || status === 'cancelled') return null;
  if (dispute?.active) return null;

  return (
    <>
      <div className="space-y-3">
        {/* Renter: Confirm Receipt */}
        {isRenter && !escrow?.renterConfirmedReceipt && paymentStatus === 'paid' && (
          <div className="card p-4 border-green-100 bg-green-50">
            <div className="flex items-start gap-3 mb-3">
              <Package size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-800 text-sm">Received the tool?</p>
                <p className="text-xs text-green-600 mt-0.5">Confirming releases 50% payment to owner. Only confirm if you actually have the tool.</p>
              </div>
            </div>
            <button onClick={confirmReceipt} disabled={loading === 'receipt'}
              className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2">
              <CheckCircle size={15} />
              {loading === 'receipt' ? 'Confirming...' : 'Yes, I Received the Tool ✅'}
            </button>
          </div>
        )}

        {/* Owner: Confirm Return */}
        {isOwner && escrow?.renterConfirmedReceipt && !escrow?.ownerConfirmedReturn && (
          <div className="card p-4 border-blue-100 bg-blue-50">
            <div className="flex items-start gap-3 mb-3">
              <RotateCcw size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-800 text-sm">Tool returned safely?</p>
                <p className="text-xs text-blue-600 mt-0.5">Confirming releases your remaining 50% payment. Only confirm if the tool is back and in good condition.</p>
              </div>
            </div>
            <button onClick={confirmReturn} disabled={loading === 'return'}
              className="btn-primary w-full py-2.5 text-sm flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700">
              <CheckCircle size={15} />
              {loading === 'return' ? 'Confirming...' : 'Yes, Tool Returned Successfully ✅'}
            </button>
          </div>
        )}

        {/* Raise Dispute — available to both parties */}
        {(isRenter || isOwner) && !dispute?.active && (
          <button onClick={() => setDisputeModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors">
            <AlertTriangle size={14} /> Report a Problem
          </button>
        )}
      </div>

      {/* Dispute Modal */}
      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Report a Problem</h3>
                <p className="text-xs text-gray-400">Admin will review and resolve within 24 hours</p>
              </div>
            </div>
            <textarea
              className="input-field resize-none mb-4" rows={4}
              placeholder="Describe the issue clearly e.g. Tool was not delivered, tool is damaged, renter is not returning tool..."
              value={disputeReason}
              onChange={e => setDisputeReason(e.target.value)}
            />
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 mb-4">
              <p className="text-xs text-yellow-700">⚠️ All payments are frozen while a dispute is active. Only raise a dispute if there is a genuine problem.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDisputeModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={raiseDispute} disabled={!disputeReason || loading === 'dispute'}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-3 rounded-xl transition-colors disabled:opacity-50">
                {loading === 'dispute' ? 'Submitting...' : 'Raise Dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}