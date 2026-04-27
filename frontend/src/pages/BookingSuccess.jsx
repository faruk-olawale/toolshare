import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, MessageSquare, ArrowRight, Phone } from 'lucide-react';
import { useEffect } from 'react';

// Shown immediately after a booking request is sent.
// Replaces the toast + redirect pattern with a proper confirmation moment.
// Receives booking data via router location state.

export default function BookingSuccess() {
  const location = useLocation();
  const navigate  = useNavigate();
  const booking   = location.state?.booking;
  const toolName  = location.state?.toolName  || 'your tool';
  const ownerName = location.state?.ownerName || 'the owner';

  // If accessed directly without state, redirect to bookings
  useEffect(() => {
    if (!location.state) navigate('/bookings', { replace: true });
  }, [location.state, navigate]);

  if (!location.state) return null;

  return (
    <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">

        {/* Success animation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#eef6f1] rounded-full flex items-center justify-center mx-auto mb-5 ring-8 ring-[#eef6f1]/50">
            <CheckCircle size={40} className="text-[#1a5c3a]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Request Sent! 🎉</h1>
          <p className="text-gray-500 text-[15px] leading-relaxed">
            Your booking request for <strong className="text-gray-700">{toolName}</strong> has been sent to {ownerName}.
          </p>
        </div>

        {/* What happens next */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-5 shadow-sm">
          <h2 className="text-[13px] font-bold text-gray-700 uppercase tracking-wider mb-4">What happens next</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Clock size={13} className="text-amber-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">Owner reviews your request</p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Most owners respond within a few hours. You'll get a notification and email when they do.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#eef6f1] border border-[#c0dece] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[#1a5c3a] text-xs font-bold">₦</span>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">You pay after approval</p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  No money leaves your account until the owner approves. Payment is processed securely via Paystack.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <CheckCircle size={13} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800">Pick up and get to work</p>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  Once paid, you'll get the owner's contact details to arrange pickup. Your money stays in escrow until you confirm receipt.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Trust reassurance */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-5">
          <p className="text-[12px] font-semibold text-gray-400 uppercase tracking-wider mb-3">You're protected</p>
          <div className="space-y-2">
            {[
              { icon: '🔐', text: 'Escrow holds your money until you confirm the tool is received' },
              { icon: '🛡️', text: 'All owners are identity-verified before listing' },
              { icon: '💬', text: 'Support team resolves disputes via WhatsApp' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-2.5">
                <span className="text-base flex-shrink-0">{icon}</span>
                <p className="text-[12px] text-gray-400">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link to="/bookings"
            className="flex items-center justify-center gap-2 w-full bg-[#1a5c3a] hover:bg-[#154d30]
                       text-white font-semibold text-sm py-3.5 rounded-xl transition-colors">
            Track My Booking <ArrowRight size={15} />
          </Link>
          <a href="https://wa.me/2348000000000?text=Hi, I just made a booking on ToolShare Africa and need help"
            target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-white border border-gray-200
                       hover:bg-gray-50 text-gray-700 font-medium text-sm py-3.5 rounded-xl transition-colors">
            <MessageSquare size={15} className="text-green-500" />
            Contact Support on WhatsApp
          </a>
          <Link to="/tools"
            className="flex items-center justify-center gap-2 w-full text-gray-400
                       hover:text-gray-600 text-sm py-2 transition-colors">
            Browse more tools
          </Link>
        </div>

      </div>
    </div>
  );
}