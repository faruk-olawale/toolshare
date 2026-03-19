import { Link } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Shield, Zap, Users, MapPin } from 'lucide-react';
import api from '../services/api';
import ToolCard from '../components/tools/ToolCard';

// ── Data ──────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Construction', emoji: '🏗️' },
  { name: 'Agriculture',  emoji: '🌾' },
  { name: 'Electrical',   emoji: '⚡' },
  { name: 'Plumbing',     emoji: '🔧' },
  { name: 'Woodworking',  emoji: '🪵' },
  { name: 'Gardening',    emoji: '🌿' },
  { name: 'Transportation', emoji: '🚛' },
  { name: 'Cleaning',     emoji: '🧹' },
];

const STEPS = [
  {
    num: '1',
    title: 'Browse nearby tools',
    desc: 'Search by category, location, or price. Filter by availability and find exactly what you need for your project.',
  },
  {
    num: '2',
    title: 'Book and pay securely',
    desc: 'Send a request and pay via Paystack once approved. Your payment is held safely in escrow until the job is done.',
  },
  {
    num: '3',
    title: 'Pick up and get to work',
    desc: 'Coordinate pickup with the owner, complete your project, and return the tool. Both sides rate the experience.',
  },
];

const FEATURES = [
  {
    icon: '🔒',
    iconBg: 'bg-[#eef6f1]',
    title: 'Escrow protection',
    desc: 'Payments are held in escrow and only released once both parties confirm the rental is complete.',
  },
  {
    icon: '📍',
    iconBg: 'bg-amber-50',
    title: 'Location-based search',
    desc: 'Find tools within walking distance using our map search. Browse by neighborhood and see exactly where tools are.',
  },
  {
    icon: '✅',
    iconBg: 'bg-blue-50',
    title: 'Verified identities',
    desc: 'Every user completes KYC verification before listing or renting. A trusted community you can confidently use.',
  },
  {
    icon: '🌿',
    iconBg: 'bg-purple-50',
    title: 'Reduce waste, build community',
    desc: 'Every shared tool is one less purchase. ToolShare Africa helps neighborhoods share resources and cut waste.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'I listed three tools I barely use and earned ₦42,000 last month. The escrow system gave me peace of mind from day one.',
    name: 'Kofi Acheampong',
    role: 'Carpenter · Accra',
    initials: 'KA',
    avatarBg: 'bg-[#1a5c3a]',
  },
  {
    quote: 'Found a drill two streets away in under five minutes. Much cheaper than buying one for a single project. This is the future.',
    name: 'Amaka Nwachukwu',
    role: 'Homeowner · Lagos',
    initials: 'AN',
    avatarBg: 'bg-amber-500',
  },
  {
    quote: 'The verification process made me feel secure renting to strangers. Every transaction has been smooth and professional.',
    name: 'Babatunde Okonkwo',
    role: 'Plumber · Abuja',
    initials: 'BO',
    avatarBg: 'bg-blue-600',
  },
];

// ── Floating bubble component ─────────────────────────────────────────────────
function Bubble({ children, className = '' }) {
  return (
    <div className={`absolute bg-white border border-gray-100 rounded-2xl px-3 py-2.5 flex items-center gap-2.5 shadow-sm text-sm whitespace-nowrap ${className}`}>
      {children}
    </div>
  );
}

// ── Star rating ───────────────────────────────────────────────────────────────
function Stars({ count = 5 }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} className="w-3 h-3 fill-amber-400" viewBox="0 0 10 10">
          <polygon points="5,0 6.5,3.5 10,3.5 7,5.8 8,9 5,7 2,9 3,5.8 0,3.5 3.5,3.5" />
        </svg>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Landing() {
  const [featuredTools, setFeaturedTools] = useState([]);
  const [stats, setStats]                 = useState(null);

  useEffect(() => {
    api.get('/tools?limit=6')
      .then(({ data }) => setFeaturedTools(data.tools || []))
      .catch(() => {});
    api.get('/tools/public-stats')
      .then(({ data }) => setStats(data))
      .catch(() => {});
  }, []);

  const statItems = [
    [stats?.totalTools != null ? `${stats.totalTools}+` : '—', 'Tools listed'],
    [stats?.totalUsers != null ? `${stats.totalUsers}+` : '—', 'Members'],
    ['18', 'Cities'],
    [stats?.avgRating  != null ? `${stats.avgRating}★`  : '4.9★', 'Trust score'],
  ];

  return (
    <div className="animate-fade-in">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f7f3] via-white to-white pt-16 pb-0">

        {/* Subtle texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231a5c3a' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="page-container relative">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white border border-[#c0dece] text-[#1a5c3a] text-xs font-medium px-4 py-2 rounded-full shadow-sm">
              <span className="w-1.5 h-1.5 bg-[#1a5c3a] rounded-full animate-pulse" />
              Now live in Lagos, Abuja &amp; Accra
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-2xl mx-auto mb-6">
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-tight tracking-tight text-gray-900 mb-5">
              Share Tools.{' '}
              <em className="italic text-[#1a5c3a]">Empower</em>{' '}
              Communities.
            </h1>
            <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
              Easily rent and lend tools in your neighborhood — save time, save money, and reduce waste together.
            </p>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              to="/register?role=owner"
              className="inline-flex items-center gap-2 bg-[#1a5c3a] text-white font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-[#154d30] transition-all hover:-translate-y-0.5 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                <rect x="1" y="5" width="14" height="8" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="4" y="2.5" width="8" height="3.5" rx="1.2" stroke="currentColor" strokeWidth="1.3"/>
                <rect x="6.5" y="7.5" width="3" height="2" rx="0.5" fill="currentColor"/>
              </svg>
              List your tool
            </Link>
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-gray-50 hover:-translate-y-0.5 transition-all"
            >
              Browse tools <ArrowRight size={15} />
            </Link>
          </div>

          {/* Illustration stage */}
          <div className="relative w-full max-w-[540px] h-[320px] mx-auto select-none">

            {/* Floating toolbox */}
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-[116px] bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2"
              style={{ animation: 'tsFloat 4s ease-in-out infinite' }}
            >
              {/* Handle */}
              <div className="w-10 h-1.5 border-2 border-amber-400 border-b-0 rounded-t-md" />
              {/* Lid */}
              <div className="w-24 h-4 bg-[#1a5c3a] rounded-md" />
              {/* Body */}
              <div className="w-28 h-14 bg-[#1a5c3a] rounded-xl flex items-center justify-center">
                <div className="w-7 h-3 bg-amber-400 rounded border-2 border-amber-500" />
              </div>
            </div>

            {/* Bubble: Claw Hammer */}
            <Bubble
              className="top-4 left-0"
              style={{ animation: 'tsFloatA 3.8s ease-in-out infinite' }}
            >
              <span className="w-8 h-8 bg-[#eef6f1] rounded-lg flex items-center justify-center text-base flex-shrink-0">🔨</span>
              <div>
                <span className="block text-xs font-medium text-gray-800 leading-tight">Claw Hammer</span>
                <span className="block text-[11px] text-gray-400">Available now</span>
              </div>
              <span className="w-2 h-2 bg-[#1a5c3a] rounded-full flex-shrink-0" />
            </Bubble>

            {/* Bubble: Power Drill */}
            <Bubble
              className="top-4 right-0"
              style={{ animation: 'tsFloatB 4.2s ease-in-out infinite' }}
            >
              <span className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-base flex-shrink-0">🔩</span>
              <div>
                <span className="block text-xs font-medium text-gray-800 leading-tight">Power Drill</span>
                <span className="block text-[11px] text-gray-400">Reserve · ₦800/day</span>
              </div>
              <span className="w-2 h-2 bg-[#1a5c3a] rounded-full flex-shrink-0" />
            </Bubble>

            {/* Bubble: Hand Saw */}
            <Bubble
              className="bottom-8 left-4"
              style={{ animation: 'tsFloatC 3.5s ease-in-out infinite' }}
            >
              <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-base flex-shrink-0">🪚</span>
              <div>
                <span className="block text-xs font-medium text-gray-800 leading-tight">Hand Saw</span>
                <span className="block text-[11px] text-gray-400">2 km away</span>
              </div>
            </Bubble>

            {/* Bubble: Returned */}
            <Bubble
              className="bottom-8 right-4"
              style={{ animation: 'tsFloatD 4.5s ease-in-out infinite' }}
            >
              <span className="w-8 h-8 bg-[#eef6f1] rounded-lg flex items-center justify-center text-sm flex-shrink-0 text-[#1a5c3a] font-bold">✓</span>
              <div>
                <span className="block text-xs font-medium text-gray-800 leading-tight">Returned safely</span>
                <span className="block text-[11px] text-gray-400">Adaeze · just now</span>
              </div>
            </Bubble>

            {/* Bubble: Stars */}
            <Bubble
              className="top-[128px] -left-4"
              style={{ animation: 'tsFloatA 5s ease-in-out infinite' }}
            >
              <Stars />
              <span className="text-xs font-medium text-gray-700">5.0 · Tunde O.</span>
            </Bubble>
          </div>
        </div>

        {/* Keyframes injected inline — Tailwind has no animate-float built-in */}
        <style>{`
          @keyframes tsFloat  { 0%,100%{transform:translate(-50%,-50%) translateY(0)} 50%{transform:translate(-50%,-50%) translateY(-10px)} }
          @keyframes tsFloatA { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-7px)}  }
          @keyframes tsFloatB { 0%,100%{transform:translateY(-4px)} 50%{transform:translateY(5px)}   }
          @keyframes tsFloatC { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-6px)}  }
          @keyframes tsFloatD { 0%,100%{transform:translateY(-3px)} 50%{transform:translateY(6px)}   }
        `}</style>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────────────────── */}
      <div className="border-y border-gray-100">
        <div className="page-container py-6">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {statItems.map(([val, label]) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-gray-900 tracking-tight">{val}</div>
                <div className="text-xs text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="page-container">
          <div className="mb-12">
            <p className="text-xs font-medium tracking-widest uppercase text-[#1a5c3a] mb-3">How it works</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 tracking-tight max-w-sm">
              Three steps to your next rental
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map(({ num, title, desc }) => (
              <div key={num} className="bg-gray-50 border border-gray-100 rounded-2xl p-7">
                <div className="w-9 h-9 bg-[#1a5c3a] text-white text-sm font-bold rounded-xl flex items-center justify-center mb-5">
                  {num}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ──────────────────────────────────────────────────────── */}
      <section className="py-4 pb-20">
        <div className="page-container">
          <div className="mb-12">
            <p className="text-xs font-medium tracking-widest uppercase text-[#1a5c3a] mb-3">Browse by category</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 tracking-tight max-w-sm">
              Find exactly what you need
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(({ name, emoji }) => (
              <Link
                key={name}
                to={`/tools?category=${name}`}
                className="group p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#c0dece] hover:bg-[#f5fbf7] text-center transition-all duration-200 hover:shadow-sm"
              >
                <div className="text-2xl mb-2">{emoji}</div>
                <span className="text-sm font-medium text-gray-600 group-hover:text-[#1a5c3a] transition-colors">
                  {name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="mb-12">
            <p className="text-xs font-medium tracking-widest uppercase text-[#1a5c3a] mb-3">Features</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 tracking-tight max-w-sm">
              Everything you need, nothing you don't
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {FEATURES.map(({ icon, iconBg, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-gray-100 rounded-2xl p-7 hover:border-gray-200 transition-colors"
              >
                <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center text-xl mb-5`}>
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 tracking-tight">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED TOOLS ──────────────────────────────────────────────────── */}
      {featuredTools.length > 0 && (
        <section className="py-20">
          <div className="page-container">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-medium tracking-widest uppercase text-[#1a5c3a] mb-3">Recently listed</p>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Fresh tools from trusted owners
                </h2>
              </div>
              <Link
                to="/tools"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-[#1a5c3a] hover:underline"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <ToolCard key={tool._id} tool={tool} />
              ))}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <Link to="/tools" className="btn-secondary inline-flex items-center gap-1.5">
                View all tools <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      {/* <section className="py-20 bg-gray-50">
        <div className="page-container">
          <div className="mb-12">
            <p className="text-xs font-medium tracking-widest uppercase text-[#1a5c3a] mb-3">Community voices</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 tracking-tight max-w-sm">
              Trusted by tradespeople and homeowners
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map(({ quote, name, role, initials, avatarBg }) => (
              <div key={name} className="bg-white border border-gray-100 rounded-2xl p-6">
                <Stars />
                <p className="text-sm text-gray-500 leading-relaxed mt-4 mb-5 italic">"{quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{name}</div>
                    <div className="text-xs text-gray-400">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── TRUST SECTION ───────────────────────────────────────────────────── */}
      {/* <section className="py-16 bg-gray-900">
        <div className="page-container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Shield className="mx-auto mb-3 text-[#5dca9f]" size={30} />, title: 'Verified owners', desc: 'Every tool owner goes through KYC verification for your safety and peace of mind.' },
              { icon: <Zap    className="mx-auto mb-3 text-[#5dca9f]" size={30} />, title: 'Instant booking',  desc: 'Book within minutes. Owners typically respond within 2 hours.' },
              { icon: <Users  className="mx-auto mb-3 text-[#5dca9f]" size={30} />, title: 'Community first',  desc: 'Built on trust, powered by communities across Nigerian cities.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-6">
                {icon}
                <h3 className="font-display font-semibold text-lg text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20">
        <div className="page-container">
          <div className="bg-[#1a5c3a] rounded-3xl px-8 py-16 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div aria-hidden className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-white/5 pointer-events-none" />
            <div aria-hidden className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/4 pointer-events-none" />

            <p className="text-xs font-medium tracking-widest uppercase text-white/50 mb-4">Get started today</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight mb-4 relative">
              Your community's tools<br />are waiting for you
            </h2>
            <p className="text-white/60 text-base mb-8 max-w-sm mx-auto leading-relaxed relative">
              Join thousands of Nigerians and Africans renting, lending, and building together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <Link
                to="/register?role=renter"
                className="bg-white text-[#1a5c3a] font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-[#f0f9f4] transition-all hover:-translate-y-0.5 shadow-sm"
              >
                Start renting tools
              </Link>
              <Link
                to="/register?role=owner"
                className="bg-white/10 border border-white/25 text-white font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-white/20 transition-all hover:-translate-y-0.5"
              >
                List your tools →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}