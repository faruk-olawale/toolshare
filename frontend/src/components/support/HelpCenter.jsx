import { useState } from 'react';
import { Link } from 'react-router-dom';
import SupportForm from '../../components/support/SupportForm';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const FAQS = [
  { q: 'How do I rent a tool?', a: 'Browse tools, pick your dates, and send a booking request. The owner approves and you pay securely through the platform.' },
  { q: 'How does payment work?', a: 'You pay upfront via Paystack. The money is held in escrow — 50% released to the owner when you confirm receiving the tool, and the remaining 50% when you return it.' },
  { q: 'What is KYC verification?', a: 'KYC (Know Your Customer) is identity verification. You upload a government-issued ID and a selfie. Our team reviews within 24 hours. It\'s required for all users.' },
  { q: 'What IDs are accepted?', a: 'We accept NIN, International Passport, Driver\'s License, and Voter\'s Card.' },
  { q: 'How do I list my tool for rent?', a: 'Complete KYC first, then go to Dashboard → List Tool. Upload photos, set your price, and provide proof of ownership. Admin reviews before it goes live.' },
  { q: 'What if the tool is damaged?', a: 'Raise a dispute from your bookings page. Our admin team will review within 24 hours and resolve it fairly. Payments are frozen during disputes.' },
  { q: 'How long does KYC approval take?', a: 'Usually within 24 hours on business days. You\'ll receive an email once approved or rejected.' },
  { q: 'Can I cancel a booking?', a: 'Contact the tool owner directly using their phone number (shown after booking approval). For disputes contact our support team.' },
  { q: 'How do owners receive payment?', a: 'Owners must add their bank details in Dashboard → Bank Details. Payouts happen automatically via bank transfer when the renter confirms receipt.' },
  { q: 'Is ToolShare Africa available across Nigeria?', a: 'Yes! We cover all states. Filter by your city when browsing tools.' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left gap-4">
        <span className="font-medium text-gray-800 text-sm">{q}</span>
        {open ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>
      {open && <p className="text-sm text-gray-500 pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = useState('');
  const filtered = FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="py-10 animate-fade-in">
      <div className="page-container max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-500">Find answers or contact our support team</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {[
            { icon: '🛡️', label: 'Safety Guidelines', to: '/safety' },
            { icon: '🔒', label: 'Privacy Policy', to: '/privacy' },
            { icon: '📄', label: 'Terms of Service', to: '/terms' },
            { icon: '💬', label: 'Contact Us', to: '/contact' },
          ].map(({ icon, label, to }) => (
            <Link key={to} to={to} className="card p-4 text-center hover:border-brand-200 hover:-translate-y-0.5 transition-all">
              <div className="text-2xl mb-1">{icon}</div>
              <p className="text-xs font-medium text-gray-700">{label}</p>
            </Link>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* FAQ */}
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="relative mb-4">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search FAQs..." className="input-field pl-9 text-sm"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="card p-4">
              {filtered.length > 0 ? filtered.map((f, i) => <FAQItem key={i} {...f} />) : (
                <p className="text-center text-gray-400 py-8 text-sm">No results found. Try a different search or contact us below.</p>
              )}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Still Need Help?</h2>
            <SupportForm source="help" />
          </div>
        </div>
      </div>
    </div>
  );
}