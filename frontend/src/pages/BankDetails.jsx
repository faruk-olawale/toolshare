import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Building2, CreditCard, CheckCircle, AlertCircle, Search } from 'lucide-react';

export default function BankDetails() {
  const { user, updateUser } = useAuth();
  const [banks, setBanks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [form, setForm] = useState({ bankName: '', bankCode: '', accountNumber: '' });
  const [loading, setLoading] = useState(false);
  const [accountName, setAccountName] = useState('');
  const hasBankDetails = user?.bankDetails?.recipientCode;

  useEffect(() => {
    api.get('/payments/banks')
      .then(({ data }) => { setBanks(data.banks); setFiltered(data.banks); })
      .catch(() => toast.error('Could not load banks list.'));
  }, []);

  useEffect(() => {
    if (!bankSearch) return setFiltered(banks);
    setFiltered(banks.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase())));
  }, [bankSearch, banks]);

  const selectBank = (bank) => {
    setForm({ ...form, bankName: bank.name, bankCode: bank.code });
    setBankSearch(bank.name);
    setFiltered([]);
    setAccountName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bankCode) return toast.error('Please select a bank from the list.');
    if (form.accountNumber.length !== 10) return toast.error('Account number must be 10 digits.');
    setLoading(true);
    try {
      const { data } = await api.post('/payments/bank-details', form);
      setAccountName(data.accountName);
      toast.success('Bank details saved! Account: ' + data.accountName + '✅');
      const profileRes = await api.get('/auth/profile');
      updateUser(profileRes.data.user);
    } catch (err) {
      setAccountName('');
      toast.error(err.response?.data?.message || 'Failed to save bank details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-8 animate-fade-in">
      <div className="page-container max-w-xl">
        <div className="mb-8">
          <h1 className="section-title mb-2">Payout Settings</h1>
          <p className="text-gray-500">Add your bank account to receive rental payments automatically</p>
        </div>

        <div className="card p-5 mb-6 bg-gradient-to-br from-brand-50 to-earth-50 border-brand-100">
          <h3 className="font-semibold text-gray-800 mb-3">💡 How Payouts Work</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-start gap-2"><span className="text-brand-500 font-bold">1.</span><span>Renter pays for approved booking via Paystack</span></div>
            <div className="flex items-start gap-2"><span className="text-brand-500 font-bold">2.</span><span>ToolShare deducts <strong>10% platform fee</strong></span></div>
            <div className="flex items-start gap-2"><span className="text-brand-500 font-bold">3.</span><span><strong>90% is transferred</strong> directly to your bank account</span></div>
            <div className="flex items-start gap-2"><span className="text-brand-500 font-bold">4.</span><span>Money arrives same day via NIP transfer</span></div>
          </div>
          <div className="mt-4 bg-white rounded-xl p-4 border border-brand-100">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Example Payout</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600"><span>Renter pays</span><span>₦20,000</span></div>
              <div className="flex justify-between text-red-500"><span>Platform fee (10%)</span><span>−₦2,000</span></div>
              <div className="flex justify-between font-bold text-green-700 pt-1 border-t border-gray-100"><span>You receive</span><span>₦18,000</span></div>
            </div>
          </div>
        </div>

        {hasBankDetails && (
          <div className="card p-5 mb-6 border-green-200 bg-green-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-800">Bank Account Connected</p>
                <p className="text-sm text-green-600">{user.bankDetails.bankName} · {user.bankDetails.accountNumber}</p>
                <p className="text-sm text-green-700 font-medium">{user.bankDetails.accountName}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-green-600 bg-green-100 rounded-lg p-2">
              ✅ You will automatically receive payouts after each successful rental payment.
            </p>
          </div>
        )}

        <div className="card p-6">
          <h3 className="font-display font-semibold text-lg text-gray-900 mb-5">
            {hasBankDetails ? 'Update Bank Account' : 'Add Bank Account'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bank Name</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  className="input-field pl-9"
                  placeholder="Search for your bank..."
                  value={bankSearch}
                  onChange={(e) => { setBankSearch(e.target.value); setForm({ ...form, bankName: '', bankCode: '' }); }}
                  required
                />
              </div>
              {filtered.length > 0 && bankSearch && !form.bankCode && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filtered.slice(0, 20).map((bank) => (
                    <button
                      key={bank.code}
                      type="button"
                      onClick={() => selectBank(bank)}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-brand-50 hover:text-brand-700 transition-colors border-b border-gray-50 last:border-0"
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Account Number (10 digits)</label>
              <input
                type="text"
                className="input-field"
                placeholder="0123456789"
                maxLength={10}
                value={form.accountNumber}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, '') })}
                required
              />
              {accountName && (
                <p className="mt-1.5 text-sm text-green-600 font-medium flex items-center gap-1">
                  <CheckCircle size={13} /> {accountName}
                </p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle size={15} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700">
                Make sure your account number and bank are correct. Transfers cannot be reversed once sent.
              </p>
            </div>

            <button type="submit" disabled={loading || !form.bankCode} className="btn-primary w-full">
              {loading ? 'Saving & Verifying...' : 'Save Bank Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}