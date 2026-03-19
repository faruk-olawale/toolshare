// components/HeroIllustration.jsx
export default function HeroIllustration() {
  return (
    <div className="relative w-[520px] h-[340px] mx-auto select-none">

      {/* ── Bubble 1 — top left ── */}
      <div className="absolute top-5 left-0 flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-3 py-2.5 shadow-sm animate-float-a whitespace-nowrap">
        <div className="w-8 h-8 rounded-lg bg-[#eef6f1] flex items-center justify-center text-sm flex-shrink-0">🔨</div>
        <div>
          <span className="block text-xs font-medium text-gray-800">Claw Hammer</span>
          <span className="block text-[11px] text-gray-400">Available now</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#1a5c3a] flex-shrink-0" />
      </div>

      {/* ── Bubble 2 — top right ── */}
      <div className="absolute top-5 right-0 flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-3 py-2.5 shadow-sm animate-float-b whitespace-nowrap">
        <div className="w-8 h-8 rounded-lg bg-[#fef6e7] flex items-center justify-center text-sm flex-shrink-0">🔩</div>
        <div>
          <span className="block text-xs font-medium text-gray-800">Power Drill</span>
          <span className="block text-[11px] text-gray-400">Reserve · ₦800/day</span>
        </div>
        <div className="w-2 h-2 rounded-full bg-[#1a5c3a] flex-shrink-0" />
      </div>

      {/* ── Toolbox — center ── */}
      <div
        className="absolute flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 rounded-[20px] animate-float-center"
        style={{ width: 160, height: 120, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* handle */}
        <div style={{ width: 40, height: 6, border: '2px solid #c8a84b', borderRadius: 3, borderBottom: 'none' }} />
        {/* lid */}
        <div style={{ width: 100, height: 18, background: '#1a5c3a', borderRadius: 6 }} />
        {/* body */}
        <div style={{ width: 120, height: 56, background: '#1a5c3a', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 28, height: 12, background: '#c8a84b', borderRadius: 4, border: '2px solid #a38538' }} />
        </div>
      </div>

      {/* ── Bubble 3 — bottom left ── */}
      <div className="absolute bottom-8 left-5 flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-3 py-2.5 shadow-sm animate-float-c whitespace-nowrap">
        <div className="w-8 h-8 rounded-lg bg-[#e8f0fb] flex items-center justify-center text-sm flex-shrink-0">🪚</div>
        <div>
          <span className="block text-xs font-medium text-gray-800">Hand Saw</span>
          <span className="block text-[11px] text-gray-400">2 km away</span>
        </div>
      </div>

      {/* ── Bubble 4 — bottom right ── */}
      <div className="absolute bottom-8 right-5 flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-3 py-2.5 shadow-sm animate-float-d whitespace-nowrap">
        <div className="w-8 h-8 rounded-lg bg-[#eef6f1] flex items-center justify-center text-sm flex-shrink-0">✓</div>
        <div>
          <span className="block text-xs font-medium text-gray-800">Returned safely</span>
          <span className="block text-[11px] text-gray-400">Adaeze · just now</span>
        </div>
      </div>

      {/* ── Bubble 5 — mid left (rating) ── */}
      <div className="absolute flex items-center gap-2 bg-white border border-gray-100 rounded-2xl px-3 py-2.5 shadow-sm animate-float-a whitespace-nowrap"
        style={{ top: 130, left: -20 }}>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <svg key={i} width="11" height="11" viewBox="0 0 10 10">
              <polygon points="5,0 6.1,3.5 9.8,3.5 6.8,5.7 7.9,9.1 5,7 2.1,9.1 3.2,5.7 0.2,3.5 3.9,3.5" fill="#c8a84b" />
            </svg>
          ))}
        </div>
        <span className="text-xs font-medium text-gray-800">5.0 · Tunde O.</span>
      </div>

    </div>
  );
}