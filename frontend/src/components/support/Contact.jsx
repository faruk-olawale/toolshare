import SupportForm from '../../components/support/SupportForm';
import { Link } from 'react-router-dom';
import { Mail, Clock, Shield } from 'lucide-react';

export default function Contact() {
  return (
    <div className="py-10 animate-fade-in">
      <div className="page-container max-w-4xl">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">💬</div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Contact Support</h1>
          <p className="text-gray-500">Our team is here to help you Monday–Friday, 9am–6pm WAT</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <SupportForm source="contact" />
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center">
                  <Mail size={16} className="text-brand-500" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Email Support</p>
              </div>
              <p className="text-xs text-gray-500">All messages go to our support team and are tracked with a ticket number.</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                  <Clock size={16} className="text-green-500" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Response Time</p>
              </div>
              <p className="text-xs text-gray-500">We reply within <strong>24 hours</strong> on business days. Payment and dispute issues are treated as high priority.</p>
            </div>

            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Shield size={16} className="text-blue-500" />
                </div>
                <p className="font-semibold text-gray-900 text-sm">Your Ticket Number</p>
              </div>
              <p className="text-xs text-gray-500">After submitting you'll receive a ticket number. Use it to follow up on your issue.</p>
            </div>

            <div className="card p-4">
              <p className="text-xs font-semibold text-gray-600 mb-3">Other Resources</p>
              <div className="space-y-2">
                {[
                  { to: '/help', label: '❓ Help Center & FAQs' },
                  { to: '/safety', label: '🛡️ Safety Guidelines' },
                  { to: '/privacy', label: '🔒 Privacy Policy' },
                  { to: '/terms', label: '📄 Terms of Service' },
                ].map(({ to, label }) => (
                  <Link key={to} to={to} className="block text-sm text-brand-600 hover:underline">{label}</Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}