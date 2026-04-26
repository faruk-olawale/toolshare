import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wrench, ArrowRight, CheckCircle, Loader } from 'lucide-react';

export default function Welcome() {
  const { user, completeOnboarding } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(null); // 'rent' | 'list'
  const [error,   setError]   = useState(null);

  const firstName = user?.name?.split(' ')[0] || 'there';

  const handleChoice = async (intent) => {
    setLoading(intent);
    setError(null);
    try {
      const data = await completeOnboarding(intent);
      // Backend tells us where to go
      navigate(data.redirect || (intent === 'list' ? '/kyc' : '/tools'));
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#eef6f1] to-white px-4 py-12">

      {/* Logo */}
      <div className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 bg-[#1a5c3a] rounded-xl flex items-center justify-center shadow-md">
          <Wrench size={17} className="text-white" />
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">ToolShare Africa</span>
      </div>

      {/* Header */}
      <div className="text-center mb-10 max-w-sm">
        <div className="w-14 h-14 bg-[#eef6f1] border-2 border-[#3d9166] rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={26} className="text-[#1a5c3a]" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          You're in, {firstName}! 🎉
        </h1>
        <p className="text-gray-500 text-[15px] leading-relaxed">
          One quick question — what would you like to do first?
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-lg mb-5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
          {error}
        </div>
      )}

      {/* Choice cards */}
      <div className="w-full max-w-lg grid sm:grid-cols-2 gap-4 mb-8">

        {/* Option A: Rent */}
        <button
          onClick={() => handleChoice('rent')}
          disabled={loading !== null}
          className="group relative bg-white border-2 border-gray-100 hover:border-[#1a5c3a] rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1a5c3a] focus:ring-offset-2"
        >
          <div aria-hidden className="absolute inset-0 rounded-2xl bg-[#1a5c3a] opacity-0 group-hover:opacity-[0.03] transition-opacity" />

          <div className="text-3xl mb-4">🔍</div>
          <h2 className="font-bold text-gray-900 text-[17px] mb-2 group-hover:text-[#1a5c3a] transition-colors">
            I need to rent tools
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-5">
            Browse tools near KWASU campus. Book in minutes, pick up from a verified student nearby.
          </p>
          <ul className="space-y-1.5 mb-5">
            {['Tools from ₦500/day', 'Pay only for days you use', 'All owners are KYC verified'].map(i => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 bg-[#1a5c3a] rounded-full flex-shrink-0" />{i}
              </li>
            ))}
          </ul>
          <div className="inline-flex items-center gap-2 text-[#1a5c3a] text-sm font-semibold">
            {loading === 'rent'
              ? <><Loader size={14} className="animate-spin" /> Taking you to browse...</>
              : <>Browse tools now <ArrowRight size={14} /></>}
          </div>
        </button>

        {/* Option B: List & Earn */}
        <button
          onClick={() => handleChoice('list')}
          disabled={loading !== null}
          className="group relative bg-gray-900 border-2 border-gray-900 hover:border-[#3d9166] rounded-2xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#3d9166] focus:ring-offset-2"
        >
          <div aria-hidden className="absolute -top-12 -right-12 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />

          <div className="text-3xl mb-4 relative">💰</div>
          <h2 className="font-bold text-white text-[17px] mb-2 relative">
            I own tools and want to earn
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed mb-5 relative">
            List your tools in 5 minutes and start earning from students who need them.
          </p>
          <ul className="space-y-1.5 mb-5 relative">
            {['Set your own price', 'Get paid via Paystack', "Protected if tool isn't returned"].map(i => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-1.5 h-1.5 bg-[#6db591] rounded-full flex-shrink-0" />{i}
              </li>
            ))}
          </ul>
          <div className="inline-flex items-center gap-2 text-white text-sm font-semibold relative">
            {loading === 'list'
              ? <><Loader size={14} className="animate-spin" /> Setting up your account...</>
              : <>Start listing tools <ArrowRight size={14} /></>}
          </div>
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 max-w-xs">
        You can switch between renting and listing at any time from your dashboard.
      </p>
    </div>
  );
}