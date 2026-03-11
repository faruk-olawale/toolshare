import SupportForm from './SupportForm';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: 'By creating an account on ToolShare Africa, you agree to these Terms of Service. If you do not agree, do not use the platform. These terms apply to all users — owners, renters, and visitors.',
  },
  {
    title: '2. Eligibility',
    content: 'You must be at least 18 years old and a resident of Nigeria to use ToolShare Africa. By registering, you confirm that all information you provide is accurate and up to date.',
  },
  {
    title: '3. Identity Verification (KYC)',
    content: 'All users must complete identity verification before transacting. You must provide a valid government-issued ID and a selfie. Providing false documents is a violation of Nigerian law and will result in immediate account termination and possible legal action.',
  },
  {
    title: '4. Tool Owners',
    content: 'You may only list tools you own or have legal permission to rent. You must provide proof of ownership (receipt or invoice). You are responsible for the accuracy of your listings, tool condition, and safe handover to renters. False listings will result in account suspension.',
  },
  {
    title: '5. Renters',
    content: 'You agree to use rented tools only for lawful purposes and return them in the same condition. You are liable for any damage caused during the rental period. Confirm receipt only when you actually have the tool in hand.',
  },
  {
    title: '6. Payments and Escrow',
    content: 'All payments must go through the ToolShare Africa platform. Transacting outside the platform is a violation of these terms. Payments are held in escrow and released in two stages: 50% on receipt confirmation, 50% on return confirmation.',
  },
  {
    title: '7. Platform Fee',
    content: 'ToolShare Africa charges a 10% commission on all transactions. This fee covers platform maintenance, payment processing, dispute resolution, and customer support.',
  },
  {
    title: '8. Disputes',
    content: 'Disputes must be raised through the platform within 7 days of the booking end date. Our admin team will review and resolve disputes within 24 hours. Our decision is final and binding.',
  },
  {
    title: '9. Prohibited Conduct',
    content: 'You must not: circumvent our payment system, create fake accounts, submit fraudulent documents, list stolen tools, harass other users, or use the platform for any illegal activity. Violations result in immediate account termination.',
  },
  {
    title: '10. Limitation of Liability',
    content: 'ToolShare Africa facilitates transactions between owners and renters. We are not responsible for tool condition, personal injury, or property damage arising from rentals. Users transact at their own risk and are encouraged to inspect tools before confirming receipt.',
  },
  {
    title: '11. Termination',
    content: 'We reserve the right to suspend or terminate any account that violates these terms, engages in fraudulent activity, or causes harm to other users, without prior notice.',
  },
  {
    title: '12. Governing Law',
    content: 'These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in Nigerian courts.',
  },
];

export default function Terms() {
  return (
    <div className="py-10 animate-fade-in">
      <div className="page-container max-w-4xl">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📄</div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500">Last updated: January 2025 · ToolShare Africa</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-2">
              <p className="text-sm text-yellow-800"><strong>⚠️ Please read carefully.</strong> By using ToolShare Africa you agree to all terms below. Violations may result in account suspension.</p>
            </div>
            {SECTIONS.map(({ title, content }) => (
              <div key={title} className="card p-5">
                <h3 className="font-display font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{content}</p>
              </div>
            ))}
          </div>

          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-4">Terms Questions?</h2>
            <SupportForm source="terms" defaultSubject="Terms of Service Inquiry" prefillCategory="terms" />
          </div>
        </div>
      </div>
    </div>
  );
}