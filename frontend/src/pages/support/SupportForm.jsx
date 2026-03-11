import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Send, CheckCircle } from 'lucide-react';

const CATEGORIES = {
  contact:  { label: 'What can we help you with?', options: ['general','booking','payment','kyc','dispute','other'] },
  help:     { label: 'Topic', options: ['general','booking','payment','kyc','other'] },
  safety:   { label: 'Safety Topic', options: ['safety','dispute','general'] },
  privacy:  { label: 'Privacy Topic', options: ['privacy','general'] },
  terms:    { label: 'Terms Topic', options: ['terms','general'] },
};

export default function SupportForm({ source = 'contact', defaultSubject = '', prefillCategory = '' }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: defaultSubject,
    category: prefillCategory || Object.values(CATEGORIES[source]?.options || ['general'])[0],
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const config = CATEGORIES[source] || CATEGORIES.contact;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return toast.error('Please write your message.');
    setLoading(true);
    try {
      const { data } = await api.post('/support/tickets', { ...form, source });
      setSubmitted(data.ticketNumber);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally { setLoading(false); }
  };

  if (submitted) return (
    <div className="card p-8 text-center">
      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={28} className="text-green-500" />
      </div>
      <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Message Received!</h3>
      <p className="text-gray-500 text-sm mb-3">Your ticket number is:</p>
      <div className="bg-brand-50 border border-brand-100 rounded-xl py-3 px-6 inline-block mb-4">
        <span className="text-brand-600 font-bold text-2xl font-mono">{submitted}</span>
      </div>
      <p className="text-gray-400 text-sm mb-6">We'll reply to <strong>{form.email}</strong> within 24 hours.</p>
      <button onClick={() => { setSubmitted(null); setForm({ ...form, message: '', subject: defaultSubject }); }}
        className="text-sm text-brand-600 hover:underline">Submit another message</button>
    </div>
  );

  return (
    <div className="card p-6">
      <h3 className="font-display font-bold text-lg text-gray-900 mb-5">Send Us a Message</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
            <input type="text" className="input-field" placeholder="Full name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" className="input-field" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{config.label}</label>
          <select className="input-field" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {config.options.map(o => (
              <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace('_', ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
          <input type="text" className="input-field" placeholder="Brief summary of your issue"
            value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
          <textarea className="input-field resize-none" rows={5}
            placeholder="Describe your issue in detail..."
            value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
        </div>

        <button type="submit" disabled={loading}
          className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
          <Send size={16} />
          {loading ? 'Sending...' : 'Send Message →'}
        </button>
        <p className="text-xs text-gray-400 text-center">We typically reply within 24 hours on business days.</p>
      </form>
    </div>
  );
}

// cache-bust: v2