import { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

function DisputeResolveForm({ booking, onResolved }) {
  const [outcome, setOutcome]       = useState('');
  const [resolution, setResolution] = useState('');
  const [reinstate, setReinstate]   = useState(false);
  const [loading, setLoading]       = useState(false);
  const [open, setOpen]             = useState(false);

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full py-2.5 text-sm font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl transition-colors">
      ⚖️ Resolve This Dispute
    </button>
  );

  return (
    <div className="border-t border-gray-100 pt-4 space-y-3">
      <p className="text-sm font-semibold text-gray-800">Resolve Dispute</p>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Outcome</label>
        <select className="input-field text-sm" value={outcome} onChange={e => setOutcome(e.target.value)}>
          <option value="">Select outcome...</option>
          <option value="tool_recovered">✅ Tool Recovered — renter returned it</option>
          <option value="written_off">📝 Written Off — tool not recovered</option>
          <option value="deceased">🕊️ Deceased — renter passed away</option>
          <option value="other">🔹 Other</option>
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 mb-1 block">Resolution note (sent to owner)</label>
        <textarea rows={2} className="input-field text-sm resize-none"
          placeholder="Describe what happened and what action was taken..."
          value={resolution} onChange={e => setResolution(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
        <input type="checkbox" checked={reinstate} onChange={e => setReinstate(e.target.checked)} className="rounded" />
        Reinstate renter's account after resolution
      </label>
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="btn-secondary flex-1 text-sm">Cancel</button>
        <button disabled={!outcome || !resolution || loading}
          onClick={async () => {
            setLoading(true);
            try {
              const { data } = await api.put(`/admin/bookings/${booking._id}/resolve-dispute`, {
                outcome, resolution, reinstateRenter: reinstate,
              });
              onResolved(data.booking);
            } catch (err) {
              toast.error(err.response?.data?.message || 'Failed to resolve');
            }
            setLoading(false);
          }}
          className="flex-1 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl disabled:opacity-50 transition-colors">
          {loading ? 'Resolving...' : '⚖️ Confirm Resolution'}
        </button>
      </div>
    </div>
  );
}

export default function DisputesTab({ disputes, onResolved }) {
  if (disputes.length === 0) return (
    <div className="card text-center py-16 text-gray-400">
      <p className="text-4xl mb-3">⚖️</p>
      <p className="font-medium">No active disputes</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {disputes.map(b => {
        const daysSince = Math.floor((new Date() - new Date(b.dispute?.raisedAt)) / (1000 * 60 * 60 * 24));
        const level = b.dispute?.escalationLevel || 0;
        return (
          <div key={b._id} className={`card border-l-4 ${level >= 1 ? 'border-l-red-500' : 'border-l-orange-400'}`}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`badge text-xs ${level >= 1 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                    {level === 0 ? '⚠️ Level 0 — Reported' : level === 1 ? '🚨 Level 1 — Final Warning Sent' : '💀 Level 2 — Written Off'}
                  </span>
                  <span className="text-xs text-gray-400">Day {daysSince} of dispute</span>
                  {daysSince < 3 && <span className="badge text-xs bg-yellow-50 text-yellow-700 border-yellow-200">Final warning in {3 - daysSince} day(s)</span>}
                  {daysSince >= 3 && daysSince < 7 && <span className="badge text-xs bg-red-50 text-red-700 border-red-200">Auto-suspend in {7 - daysSince} day(s)</span>}
                  {daysSince >= 7 && <span className="badge text-xs bg-red-100 text-red-800 border-red-300">⚠️ Should be written off</span>}
                </div>
                <p className="font-bold text-gray-900">🔧 {b.toolId?.name}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Owner: <strong>{b.ownerId?.name}</strong> · Renter: <strong className="text-red-600">{b.renterId?.name}</strong>
                </p>
                <p className="text-xs text-gray-400 mt-1">Reported: {new Date(b.dispute?.raisedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <a href={`mailto:${b.renterId?.email}`} className="btn-secondary text-xs px-3 py-1.5 text-center">📧 Email Renter</a>
                <a href={`mailto:${b.ownerId?.email}`} className="btn-secondary text-xs px-3 py-1.5 text-center">📧 Email Owner</a>
              </div>
            </div>

            {/* Escalation timeline */}
            <div className="flex items-center gap-0 mb-4">
              {[{ label: 'Reported', day: 0 }, { label: 'Warning', day: 3 }, { label: 'Suspend', day: 7 }].map((step, i) => (
                <div key={i} className="flex items-center flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${daysSince >= step.day ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    {daysSince >= step.day ? '✓' : step.day}
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <div className={`h-1 w-full ${i < 2 ? (daysSince >= [3, 7][i] ? 'bg-red-400' : 'bg-gray-200') : ''}`} />
                    <span className="text-xs text-gray-400 mt-1">{step.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <DisputeResolveForm booking={b} onResolved={onResolved} />
          </div>
        );
      })}
    </div>
  );
}