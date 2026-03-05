import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, wire this to an email API
    toast.success('Message sent! We\'ll reply within 2 hours. 📧');
    setSent(true);
  };

  return (
    <div className="py-12 animate-fade-in">
      <div className="page-container max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="section-title mb-3">Contact Us</h1>
          <p className="text-gray-500 text-lg">We're here to help. Reach out anytime.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {[
              { icon: <Mail size={20} />, title: 'Email Support', detail: 'support@toolshare.africa', sub: 'Replies within 2 hours', color: 'bg-blue-50 text-blue-600' },
              { icon: <Phone size={20} />, title: 'Phone Support', detail: '+234 800 TOOLSHARE', sub: 'Mon–Sat, 8am–8pm WAT', color: 'bg-green-50 text-green-600' },
              { icon: <MapPin size={20} />, title: 'Headquarters', detail: 'Lagos, Nigeria', sub: 'Serving all Nigerian cities', color: 'bg-brand-50 text-brand-600' },
              { icon: <Clock size={20} />, title: 'Support Hours', detail: 'Mon–Sat: 8am – 8pm', sub: 'Sunday: 10am – 4pm (WAT)', color: 'bg-purple-50 text-purple-600' },
            ].map(({ icon, title, detail, sub, color }) => (
              <div key={title} className="flex items-start gap-4">
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0`}>{icon}</div>
                <div>
                  <p className="font-semibold text-gray-800">{title}</p>
                  <p className="text-gray-700">{detail}</p>
                  <p className="text-sm text-gray-400">{sub}</p>
                </div>
              </div>
            ))}

            <div className="card p-5 bg-earth-50 border-earth-100">
              <p className="font-semibold text-gray-800 mb-2">Quick Links</p>
              <div className="space-y-1 text-sm">
                {[['Help Center', '/help'], ['Safety Guidelines', '/safety'], ['Terms of Service', '/terms'], ['Privacy Policy', '/privacy']].map(([label, href]) => (
                  <a key={label} href={href} className="block text-brand-600 hover:underline">{label} →</a>
                ))}
              </div>
            </div>
          </div>

          <div className="card p-6">
            {sent ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-display font-bold text-xl text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500">We'll get back to you within 2 hours.</p>
                <button onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setSent(false); }} className="btn-outline mt-4">Send Another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-display font-bold text-lg text-gray-900 mb-2">Send a Message</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input type="text" className="input-field" placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input type="email" className="input-field" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                  <select className="input-field" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required>
                    <option value="">Select a topic</option>
                    <option>Booking Issue</option>
                    <option>Payment Problem</option>
                    <option>Tool Listing</option>
                    <option>Account Issue</option>
                    <option>Safety Concern</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea className="input-field resize-none" rows={5} placeholder="Describe your issue in detail..." value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                </div>
                <button type="submit" className="btn-primary w-full">Send Message →</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}