import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowRight, ShieldCheck, Lock, MapPin, Clock } from 'lucide-react';
import api from '../services/api';
import ToolCard from '../components/tools/ToolCard';

// ── Tool category pills shown in hero ────────────────────────────────────────
const CATEGORIES = [
  { icon: '🔧', label: 'Power Tools' },
  { icon: '📐', label: 'Measuring' },
  { icon: '⚡', label: 'Electrical' },
  { icon: '🌱', label: 'Gardening' },
  { icon: '🏗️', label: 'Construction' },
  { icon: '🧹', label: 'Cleaning' },
];

// ── Trust badges ──────────────────────────────────────────────────────────────
const TRUST = [
  { icon: <Lock size={13} />,        label: 'Escrow payment protection' },
  { icon: <ShieldCheck size={13} />, label: 'KYC verified users only' },
  { icon: <MapPin size={13} />,      label: 'KWASU campus & Malete' },
  { icon: <Clock size={13} />,       label: 'Book in under 5 minutes' },
];

// ── Steps ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    num: '1',
    title: 'Find what you need',
    desc: 'Browse tools available right on campus. Filter by category or price.',
    icon: '🔍',
  },
  {
    num: '2',
    title: 'Book & pay securely',
    desc: 'Send a request. Pay via Paystack. Your money is held in escrow until you\'re satisfied.',
    icon: '🔐',
  },
  {
    num: '3',
    title: 'Pick up and get to work',
    desc: 'Collect from the owner nearby, finish your project, return it. Simple.',
    icon: '✅',
  },
];

export default function Landing() {
  const [featuredTools, setFeaturedTools] = useState([]);
  const [toolCount,     setToolCount]     = useState(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    api.get('/tools?limit=3')
      .then(({ data }) => {
        setFeaturedTools(data.tools || []);
        setToolCount(data.total || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-[#eef6f1] to-white">
        {/* Subtle background pattern */}
        <div aria-hidden className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#1a5c3a 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="page-container max-w-2xl text-center relative">

          {/* Launch badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-[#c0dece] text-[#1a5c3a] text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 bg-[#1a5c3a] rounded-full animate-pulse" />
            Now available around KWASU campus
          </div>

          {/* Headline — one sentence, one idea */}
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight tracking-tight text-gray-900 mb-4">
            Rent tools from students{' '}
            <span className="text-[#1a5c3a]">around KWASU</span>
            <br /> without the hassle.
          </h1>

          {/* Sub — answers "why should I care" immediately */}
          <p className="text-[15px] text-gray-500 max-w-md mx-auto leading-relaxed mb-3">
            Need a power drill, ladder or generator for your project?
            Find it nearby, book in minutes, pay securely. No middlemen.
          </p>

          {/* Price anchor — the most convincing thing for students */}
          <p className="text-sm font-semibold text-[#1a5c3a] mb-8">
            Tools from ₦500/day.{' '}
            <span className="font-normal text-gray-400">Cancel anytime before pickup.</span>
          </p>

          {/* Primary CTA — one action, not two */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 bg-[#1a5c3a] text-white font-semibold text-sm px-7 py-3.5 rounded-xl hover:bg-[#154d30] transition-all hover:-translate-y-0.5 shadow-md shadow-[#1a5c3a]/20 w-full sm:w-auto justify-center"
            >
              Browse tools near me <ArrowRight size={15} />
            </Link>
            <Link
              to="/register?role=owner"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-medium text-sm px-6 py-3.5 rounded-xl hover:bg-gray-50 transition-all w-full sm:w-auto justify-center"
            >
              List your tool and earn →
            </Link>
          </div>

          {/* Category pills — shows breadth at a glance */}
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(({ icon, label }) => (
              <Link
                key={label}
                to={`/tools?category=${encodeURIComponent(label.split(' ')[0])}`}
                className="inline-flex items-center gap-1.5 bg-white border border-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full hover:border-[#6db591] hover:text-[#1a5c3a] transition-colors shadow-sm"
              >
                <span>{icon}</span> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ───────────────────────────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-white py-4">
        <div className="page-container">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST.map(({ icon, label }) => (
              <div key={label} className="inline-flex items-center gap-2 text-gray-500 text-xs font-medium">
                <span className="text-[#1a5c3a]">{icon}</span>
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section className="py-16">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">
              How it works
            </h2>
            <p className="text-sm text-gray-400">From sign-up to tool in hand in under 10 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {STEPS.map(({ num, title, desc, icon }) => (
              <div key={num} className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-[#d4eadd] transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#eef6f1] text-[#1a5c3a] text-sm font-bold rounded-lg flex items-center justify-center">
                    {num}
                  </div>
                  <span className="text-2xl">{icon}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2 text-[15px]">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED TOOLS ──────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100 bg-[#fafaf9]">
        <div className="page-container">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-2xl font-bold text-gray-900">
                {toolCount != null && toolCount > 0
                  ? `${toolCount} tool${toolCount !== 1 ? 's' : ''} available now`
                  : 'Available on campus'}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">Updated in real time</p>
            </div>
            <Link to="/tools" className="text-sm font-semibold text-[#1a5c3a] hover:underline flex items-center gap-1 flex-shrink-0">
              See all <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredTools.map((tool) => (
                <ToolCard key={tool._id} tool={tool} />
              ))}
            </div>
          ) : (
            // Empty state — honest, not alarming
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">🔧</div>
              <p className="font-semibold text-gray-700 mb-1">Tools are being listed now</p>
              <p className="text-sm text-gray-400 mb-4">Be the first to list yours and start earning.</p>
              <Link to="/register?role=owner" className="btn-primary text-sm">
                List a tool →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── DUAL VALUE PROPS ────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="page-container">
          <div className="grid md:grid-cols-2 gap-4">

            {/* For renters */}
            <div className="bg-[#eef6f1] border border-[#c0dece] rounded-2xl p-8">
              <div className="text-3xl mb-4">📦</div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Need a tool?</h3>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Browse tools available around KWASU right now. Book in minutes,
                pay securely, and pick up from a verified student nearby.
                No deposits to worry about losing.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Pay only for the days you need',
                  'Money held in escrow until you\'re satisfied',
                  'All owners are KYC verified',
                ].map(l => (
                  <li key={l} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-[#1a5c3a] mt-0.5 flex-shrink-0">✓</span> {l}
                  </li>
                ))}
              </ul>
              <Link to="/tools" className="inline-flex items-center gap-2 bg-[#1a5c3a] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#154d30] transition-colors">
                Browse tools <ArrowRight size={14} />
              </Link>
            </div>

            {/* For owners */}
            <div className="bg-gray-900 rounded-2xl p-8">
              <div className="text-3xl mb-4">💰</div>
              <h3 className="font-bold text-white text-lg mb-2">Own a tool? Earn from it.</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">
                That power drill or generator sitting in your room can make you
                money while you study. List it in 5 minutes and start earning
                from day one.
              </p>
              <ul className="space-y-2 mb-6">
                {[
                  'Set your own price and availability',
                  'Get paid directly via Paystack',
                  'You\'re protected if a tool isn\'t returned',
                ].map(l => (
                  <li key={l} className="flex items-start gap-2 text-sm text-gray-300">
                    <span className="text-[#6db591] mt-0.5 flex-shrink-0">✓</span> {l}
                  </li>
                ))}
              </ul>
              <Link to="/register?role=owner" className="inline-flex items-center gap-2 bg-white text-gray-900 text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors">
                Start earning <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="py-16 border-t border-gray-100">
        <div className="page-container">
          <div className="bg-[#1a5c3a] rounded-2xl px-8 py-14 text-center relative overflow-hidden">
            <div aria-hidden className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            <div aria-hidden className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />

            <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 relative">
              Launching at KWASU
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight mb-3 relative">
              The smarter way to get tools<br className="hidden sm:block" /> on campus.
            </h2>
            <p className="text-white/60 text-sm mb-8 max-w-sm mx-auto relative">
              Join students who are already renting tools and equipment
              without the hassle of buying or borrowing from friends.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 relative">
              <Link
                to="/register"
                className="bg-white text-[#1a5c3a] font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-[#f0f9f4] transition-all hover:-translate-y-0.5 shadow-sm w-full sm:w-auto"
              >
                Create free account
              </Link>
              <Link
                to="/tools"
                className="text-white/70 hover:text-white text-sm font-medium flex items-center gap-1 transition-colors"
              >
                Browse without signing up <ArrowRight size={13} />
              </Link>
            </div>

            {/* Honest trust line — no fake numbers */}
            <p className="text-white/30 text-xs mt-8 relative">
              Free to join · No subscription · Pay only when you rent
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}