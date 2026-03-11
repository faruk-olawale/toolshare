import SupportForm from './SupportForm';
import { Link } from 'react-router-dom';

const SECTIONS = [
  {
    icon: '🪪', title: 'Identity Verification',
    points: [
      'All users must complete KYC (Know Your Customer) verification before transacting.',
      'We accept NIN, International Passport, Driver\'s License, and Voter\'s Card.',
      'Documents are reviewed manually by our admin team within 24 hours.',
      'Your documents are stored securely and never shared with third parties.',
    ],
  },
  {
    icon: '🔒', title: 'Secure Payments',
    points: [
      'All payments are processed through Paystack — Nigeria\'s most trusted payment gateway.',
      'Funds are held in escrow and only released when you confirm receipt of the tool.',
      'Remaining 50% is released only after the tool is confirmed returned safely.',
      'We never ask for bank details outside the official platform.',
    ],
  },
  {
    icon: '🤝', title: 'Meeting Safely',
    points: [
      'Always meet in a public place for tool handover where possible.',
      'Verify the tool matches its listing photos before confirming receipt.',
      'Take photos of the tool\'s condition before and after rental.',
      'Never pay outside the platform — all transactions must go through ToolShare.',
    ],
  },
  {
    icon: '🚨', title: 'Reporting Issues',
    points: [
      'Use the "Report a Problem" button on any booking to raise a dispute.',
      'Our admin team reviews all disputes within 24 hours.',
      'Funds are frozen immediately when a dispute is raised.',
      'For emergencies, contact us directly using the form below.',
    ],
  },
  {
    icon: '🚫', title: 'Prohibited Activities',
    points: [
      'Transacting outside the platform to avoid fees.',
      'Creating fake accounts or submitting fraudulent ID documents.',
      'Listing tools you do not own or have permission to rent.',
      'Threatening, harassing, or intimidating other users.',
    ],
  },
];

export default function Safety() {
  return (
    <div className="py-10 animate-fade-in">
      <div className="page-container max-w-4xl">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🛡️</div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Safety Guidelines</h1>
          <p className="text-gray-500 max-w-xl mx-auto">Your safety is our top priority. Follow these guidelines for a secure rental experience on ToolShare Africa.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {SECTIONS.map(({ icon, title, points }) => (
            <div key={title} className="card p-5">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{icon}</span>
                <h3 className="font-display font-bold text-gray-900">{title}</h3>
              </div>
              <ul className="space-y-2">
                {points.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-green-500 flex-shrink-0 mt-0.5">✓</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Emergency Banner */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-10 text-center">
          <p className="font-bold text-red-800 mb-1">🚨 Experiencing a Safety Emergency?</p>
          <p className="text-sm text-red-600 mb-3">If you feel unsafe or are being threatened, contact Nigerian emergency services first at <strong>112</strong>.</p>
          <p className="text-sm text-red-500">Then report the incident to us using the form below.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Report a Safety Concern</h2>
            <SupportForm source="safety" defaultSubject="Safety Concern" prefillCategory="safety" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Quick Links</h2>
            <div className="space-y-3">
              {[
                { to: '/help', icon: '❓', label: 'Help Center', desc: 'Browse FAQs and guides' },
                { to: '/privacy', icon: '🔒', label: 'Privacy Policy', desc: 'How we protect your data' },
                { to: '/terms', icon: '📄', label: 'Terms of Service', desc: 'Rules for using the platform' },
                { to: '/contact', icon: '💬', label: 'Contact Support', desc: 'Get direct help from our team' },
              ].map(({ to, icon, label, desc }) => (
                <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:border-brand-200 transition-colors">
                  <span className="text-xl">{icon}</span>
                  <div><p className="font-medium text-gray-800 text-sm">{label}</p><p className="text-xs text-gray-400">{desc}</p></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}