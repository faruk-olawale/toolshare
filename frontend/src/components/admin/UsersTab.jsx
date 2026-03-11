import api from '../../services/api';
import toast from 'react-hot-toast';

export default function UsersTab({ allUsers, users: usersProp, setAllUsers, setUsers: setUsersProp, onSuspend, onSuspendClick, onDelete, onDeleteClick, processing }) {
  const users = allUsers ?? usersProp ?? [];
  const setUsers = setAllUsers ?? setUsersProp ?? (() => {});
  const handleSuspend = onSuspend ?? onSuspendClick;
  const handleDelete = onDelete ?? onDeleteClick;
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Name', 'Email', 'Role', 'KYC', 'Status', 'Joined', 'Actions'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u._id} className={`hover:bg-gray-50 ${u.suspended ? 'bg-red-50/30' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{u.name}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${u.role === 'owner' ? 'bg-brand-50 text-brand-700 border-brand-100' : u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{u.role}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge text-xs ${u.kyc?.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : u.kyc?.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : u.kyc?.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                    {u.kyc?.status || 'not submitted'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {u.suspended
                    ? <span className="badge text-xs bg-red-50 text-red-700 border-red-200">🚫 Suspended</span>
                    : <span className="badge text-xs bg-green-50 text-green-700 border-green-100">✅ Active</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {u.role !== 'admin' && (
                    <div className="flex items-center gap-1">
                      {u.suspended ? (
                        <button onClick={async () => {
                          if (!confirm(`Reinstate ${u.name}'s account?`)) return;
                          try {
                            const { data } = await api.put(`/admin/users/${u._id}/unsuspend`);
                            setUsers(prev => prev.map(x => x._id === u._id ? data.user : x));
                            toast.success(`${u.name} reinstated`);
                          } catch { toast.error('Failed to reinstate'); }
                        }} className="flex items-center gap-1 text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          ✅ Reinstate
                        </button>
                      ) : (
                        <button onClick={() => handleSuspend(u)}
                          className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                          🚫 Suspend
                        </button>
                      )}
                      <button onClick={() => handleDelete(u)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors">
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}