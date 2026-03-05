export default function Privacy() {
  return (
    <div className="py-12 animate-fade-in">
      <div className="page-container max-w-3xl">
        <h1 className="section-title mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: January 2025</p>
        <div className="space-y-8 text-gray-600 leading-relaxed">
          {[
            { title: '1. Information We Collect', body: 'We collect information you provide when registering (name, email, phone, location), tool listings (descriptions, photos), booking and payment data, and usage data (pages visited, actions taken). We do not collect or store payment card details — this is handled by Paystack.' },
            { title: '2. How We Use Your Information', body: 'We use your information to operate the Platform and process bookings, send transactional emails (booking confirmations, payment receipts), verify tool listings and user identities, improve our services and user experience, and comply with legal obligations.' },
            { title: '3. Information Sharing', body: 'We share your name, phone, and location with the other party in a confirmed booking (owner/renter) to facilitate the rental. We do not sell your personal data to third parties. We share data with Paystack for payment processing. We may share data with law enforcement when required by Nigerian law.' },
            { title: '4. Data Security', body: 'Passwords are hashed using bcrypt and never stored in plain text. All API communications use HTTPS encryption. Payment data is handled by Paystack\'s PCI-DSS certified infrastructure. We regularly review our security practices.' },
            { title: '5. Your Rights', body: 'You may request a copy of your personal data at any time. You may request deletion of your account and associated data. You may update your profile information in your account settings. Contact privacy@toolshare.africa to exercise these rights.' },
            { title: '6. Cookies', body: 'We use minimal cookies for authentication (JWT tokens stored in localStorage) and analytics. We do not use advertising or tracking cookies.' },
            { title: '7. Data Retention', body: 'Account data is retained while your account is active. Transaction records are retained for 7 years as required by Nigerian financial regulations. Deleted accounts have their personal data anonymized within 30 days.' },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-display font-semibold text-xl text-gray-900 mb-3">{title}</h2>
              <p>{body}</p>
            </div>
          ))}
          <div className="bg-earth-50 border border-earth-100 rounded-xl p-5">
            <p className="text-sm text-gray-600"><strong>Questions?</strong> Email <a href="mailto:privacy@toolshare.africa" className="text-brand-600 hover:underline">privacy@toolshare.africa</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}