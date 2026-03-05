export default function Safety() {
  return (
    <div className="py-12 animate-fade-in">
      <div className="page-container max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="section-title mb-3">Safety Guidelines</h1>
          <p className="text-gray-500 text-lg">Keeping every rental safe for everyone on ToolShare Africa</p>
        </div>
        <div className="space-y-6">
          {[
            { emoji: '🤝', title: 'Meet Safely', color: 'bg-blue-50 border-blue-100', tips: ['Always meet in a public, well-lit location', 'Bring a friend or family member if possible', 'Share your meeting location with someone you trust', 'Meet during daylight hours when possible'] },
            { emoji: '🔍', title: 'Verify Before You Rent', color: 'bg-green-50 border-green-100', tips: ['Check the tool\'s condition thoroughly before taking it', 'Take photos/videos documenting the tool\'s state', 'Test the tool works properly before leaving', 'Read the owner\'s profile and any reviews'] },
            { emoji: '💳', title: 'Always Pay Through ToolShare', color: 'bg-brand-50 border-brand-100', tips: ['Never pay cash outside the platform', 'All payments are protected when made through Paystack', 'Never share your banking details with other users', 'Report any requests for off-platform payment immediately'] },
            { emoji: '🛠️', title: 'Using Equipment Safely', color: 'bg-yellow-50 border-yellow-100', tips: ['Read the tool\'s manual before use', 'Wear appropriate protective equipment (gloves, goggles, etc.)', 'Never use a tool for purposes it wasn\'t designed for', 'Keep tools away from children'] },
            { emoji: '📞', title: 'Communication', color: 'bg-purple-50 border-purple-100', tips: ['Use ToolShare\'s contact system to communicate', 'Be clear about pickup and return times', 'Respond promptly to messages', 'Be honest if there\'s a problem — contact us immediately'] },
            { emoji: '🚨', title: 'Reporting Issues', color: 'bg-red-50 border-red-100', tips: ['Report damaged or faulty tools immediately', 'Report suspicious users to our team', 'In case of emergency, contact Nigerian emergency services (199)', 'Email safety@toolshare.africa for platform safety issues'] },
          ].map(({ emoji, title, color, tips }) => (
            <div key={title} className={`card p-6 border ${color}`}>
              <h3 className="font-display font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">{emoji}</span> {title}
              </h3>
              <ul className="space-y-2">
                {tips.map(tip => (
                  <li key={tip} className="flex items-start gap-2 text-gray-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 card p-6 text-center">
          <p className="text-gray-600 mb-3">See something suspicious or need help?</p>
          <a href="mailto:safety@toolshare.africa" className="btn-primary inline-flex">Report a Safety Issue</a>
        </div>
      </div>
    </div>
  );
}