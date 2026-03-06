import SupportForm from '../../components/support/SupportForm';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: 'We collect information you provide during registration (name, email, phone number, location), identity verification documents (government ID, selfie), tool listings and photos, booking and payment information, and messages sent through our platform.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'Your information is used to verify your identity, process bookings and payments, communicate with you about your account, resolve disputes, improve our platform, and comply with Nigerian law.',
  },
  {
    title: '3. Document Storage',
    content: 'KYC documents (ID and selfie) are stored securely on Cloudinary with encrypted access. Only our admin team can view your documents for verification purposes. We do not share documents with third parties except as required by law.',
  },
  {
    title: '4. Payment Information',
    content: 'Payment processing is handled by Paystack. We do not store your card details. Bank account details for payouts are stored securely and used only for transferring your earnings.',
  },
  {
    title: '5. Data Sharing',
    content: 'We share your name and phone number with the other party in a confirmed booking so they can coordinate tool handover. We do not sell your data to advertisers or third parties.',
  },
  {
    title: '6. Your Rights',
    content: 'You can request to view, update, or delete your personal data at any time by contacting our support team. Account deletion removes all your personal data from our system within 30 days.',
  },
  {
    title: '7. Cookies',
    content: 'We use essential cookies to keep you logged in and remember your preferences. We do not use advertising or tracking cookies.',
  },
  {
    title: '8. Changes to This Policy',
    content: 'We will notify you by email if we make significant changes to this privacy policy. Continued use of the platform after changes means you accept the updated policy.',
  },
];

export default function Privacy() {
  return (
    <div className="py-10 animate-fade-in">
      <div className="page-container max-w-4xl">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: January 2025 · ToolShare Africa</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 mb-6">
              <p className="text-sm text-brand-800 font-medium">🇳🇬 ToolShare Africa is committed to protecting your privacy and complying with the Nigeria Data Protection Regulation (NDPR).</p>
            </div>

            <div className="space-y-6">
              {SECTIONS.map(({ title, content }) => (
                <div key={title} className="card p-5">
                  <h3 className="font-display font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Privacy Questions?</h2>
            <SupportForm source="privacy" defaultSubject="Privacy Inquiry" prefillCategory="privacy" />
          </div>
        </div>
      </div>
    </div>
  );
}