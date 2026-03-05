export default function Terms() {
  return (
    <div className="py-12 animate-fade-in">
      <div className="page-container max-w-3xl">
        <h1 className="section-title mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: January 2025</p>
        <div className="prose max-w-none space-y-8 text-gray-600 leading-relaxed">
          {[
            { title: '1. Acceptance of Terms', body: 'By accessing or using ToolShare Africa ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. ToolShare Africa is operated in Nigeria and governed by Nigerian law.' },
            { title: '2. User Accounts', body: 'You must register with accurate information. You are responsible for all activity under your account. You must be at least 18 years old to use ToolShare Africa. One person may not maintain multiple accounts.' },
            { title: '3. Tool Owners', body: 'Owners must accurately describe their tools, including condition, functionality, and any limitations. Owners must ensure tools are safe and in working condition. Owners are responsible for any injuries or damages resulting from defective tools. All listings are subject to admin verification before going live.' },
            { title: '4. Renters', body: 'Renters must use rented tools responsibly and only for their intended purpose. Renters are responsible for any damage to tools during the rental period. Renters must return tools in the same condition they were received. Renters must be present at agreed pickup and return times.' },
            { title: '5. Payments & Fees', body: 'ToolShare Africa charges a 10% platform fee on all transactions. Payments are processed securely via Paystack. Owner payouts are sent via NIP bank transfer within minutes of payment confirmation. All prices are in Nigerian Naira (₦).' },
            { title: '6. Cancellations & Refunds', body: 'Pending bookings can be cancelled before owner approval with no charge. Once approved and paid, bookings are non-refundable unless the owner cancels. ToolShare Africa reserves the right to mediate disputes between owners and renters.' },
            { title: '7. Prohibited Conduct', body: 'You may not use the Platform to list stolen, illegal, or dangerous equipment. You may not circumvent the Platform to conduct transactions outside it. You may not harass, threaten, or deceive other users. Violation may result in immediate account termination.' },
            { title: '8. Limitation of Liability', body: 'ToolShare Africa is a marketplace and is not responsible for the condition of tools listed. We are not liable for any damages, injuries, or losses arising from tool rentals. Our maximum liability to any user shall not exceed the transaction amount involved.' },
            { title: '9. Changes to Terms', body: 'We may update these terms at any time. Continued use of the Platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.' },
          ].map(({ title, body }) => (
            <div key={title}>
              <h2 className="font-display font-semibold text-xl text-gray-900 mb-3">{title}</h2>
              <p>{body}</p>
            </div>
          ))}
          <div className="bg-earth-50 border border-earth-100 rounded-xl p-5">
            <p className="text-sm text-gray-600"><strong>Contact:</strong> For questions about these terms, email <a href="mailto:legal@toolshare.africa" className="text-brand-600 hover:underline">legal@toolshare.africa</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}