import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Search } from 'lucide-react';

const faqs = [
  { category: 'Getting Started', q: 'How do I create an account?', a: 'Click "Get Started" on the homepage. Choose your role — Renter if you want to borrow tools, or Owner if you want to earn by listing yours. Fill in your details and you\'re ready to go.' },
  { category: 'Getting Started', q: 'What is the difference between a Renter and an Owner?', a: 'Owners list their tools and earn money when others rent them. Renters browse, book, and pay for tools they need. You can only have one role per account.' },
  { category: 'Booking', q: 'How do I book a tool?', a: 'Browse tools, click on one you like, select your rental dates, and click "Send Booking Request". The owner will review and approve or decline within 24 hours.' },
  { category: 'Booking', q: 'Can I cancel a booking?', a: 'You can cancel a pending booking by contacting us at support@toolshare.africa. Approved bookings that have been paid cannot be cancelled — please contact the owner directly.' },
  { category: 'Booking', q: 'What happens if the owner rejects my request?', a: 'You\'ll receive an email notification. No payment is taken for rejected bookings. You\'re free to search for other tools.' },
  { category: 'Payments', q: 'How does payment work?', a: 'After your booking is approved, you\'ll see a "Pay Now" button. Payments are processed securely via Paystack using card, bank transfer, or USSD.' },
  { category: 'Payments', q: 'Is my payment information safe?', a: 'Yes. We use Paystack, a PCI-DSS compliant payment processor. ToolShare Africa never stores your card details.' },
  { category: 'Payments', q: 'When do owners receive their money?', a: 'Owners receive 90% of the rental amount within minutes of payment confirmation via NIP bank transfer. The remaining 10% is ToolShare Africa\'s platform fee.' },
  { category: 'Listings', q: 'How do I list my tool?', a: 'Register as an Owner, go to Dashboard → List a Tool. Add photos, set your daily price, and submit. Our admin team will verify and publish your listing within 24 hours.' },
  { category: 'Listings', q: 'Why hasn\'t my tool been published yet?', a: 'All listings go through admin verification to ensure quality and safety. This usually takes under 24 hours. You\'ll receive an email when your tool is live.' },
  { category: 'Safety', q: 'How do I know I can trust other users?', a: 'All users are registered with verified email addresses. We recommend checking the owner\'s profile and contacting them before pickup. Always meet in safe, public locations.' },
  { category: 'Safety', q: 'What if the tool is damaged during my rental?', a: 'You are responsible for the tool during your rental period. Report any pre-existing damage to the owner before taking the tool. We recommend documenting the tool\'s condition with photos.' },
];

const categories = [...new Set(faqs.map(f => f.category))];

export default function HelpCenter() {
  const [open, setOpen] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = faqs.filter(f => {
    const matchSearch = !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || f.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="py-12 animate-fade-in">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="section-title mb-3">Help Center</h1>
          <p className="text-gray-500 text-lg">Find answers to common questions about ToolShare Africa</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" className="input-field pl-11" placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {['All', ...categories].map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${category === cat ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors">
                <span className="font-medium text-gray-800 pr-4">{faq.q}</span>
                {open === i ? <ChevronUp size={18} className="text-brand-500 flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">No results found for "{search}"</div>
          )}
        </div>

        <div className="mt-12 card p-8 text-center bg-gradient-to-br from-brand-50 to-earth-50 border-brand-100">
          <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-500 mb-4">Our support team typically responds within 2 hours</p>
          <a href="mailto:support@toolshare.africa" className="btn-primary inline-flex">📧 Email Support</a>
        </div>
      </div>
    </div>
  );
}