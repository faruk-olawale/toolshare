import { Link } from 'react-router-dom';
import { Wrench, Shield, Zap, Users, ArrowRight, MapPin, Star, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';
import ToolCard from '../components/tools/ToolCard';

const CATEGORIES = ['Construction', 'Agriculture', 'Electrical', 'Plumbing', 'Woodworking', 'Gardening', 'Transportation', 'Cleaning'];

export default function Landing() {
  const [featuredTools, setFeaturedTools] = useState([]);

  useEffect(() => {
    api.get('/tools?limit=6').then(({ data }) => setFeaturedTools(data.tools || [])).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-earth-50 via-white to-brand-50 pt-16 pb-24">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f2711c' fill-opacity='0.08'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="page-container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-sm font-medium px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></span>
              🇳🇬 Built for Nigeria. Scaled for Africa.
            </div>

            <h1 className="text-5xl md:text-6xl font-display font-bold text-gray-900 leading-tight mb-6">
              Rent Any Tool.
              <span className="block text-brand-500">Anywhere in Nigeria.</span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with trusted tool owners in your city. Save money, reduce waste, and build community — one rental at a time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/tools" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                Browse Tools <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="btn-secondary text-lg px-8 py-4">
                List Your Tools
              </Link>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
              {[['500+', 'Tools Listed'], ['200+', 'Happy Renters'], ['50+', 'Cities'], ['4.8★', 'Trust Score']].map(([val, label]) => (
                <div key={label} className="text-center">
                  <div className="text-xl font-bold text-gray-900">{val}</div>
                  <div>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="page-container">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">Browse by Category</h2>
            <p className="text-gray-500">Find exactly what you need for your next project</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                to={`/tools?category=${cat}`}
                className="group p-4 rounded-2xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 text-center transition-all duration-200 hover:shadow-sm"
              >
                <div className="w-10 h-10 bg-earth-100 group-hover:bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors">
                  <Wrench size={18} className="text-earth-600 group-hover:text-brand-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-brand-700">{cat}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gradient-to-b from-earth-50/50 to-white">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">How ToolShare Works</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Simple, secure, and designed for Nigerians</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '🔍', title: 'Search & Discover', desc: 'Browse hundreds of tools by category, location, or price. Filter to find exactly what you need.' },
              { icon: '📅', title: 'Book & Pay Securely', desc: 'Send a booking request, wait for approval, then pay securely via Paystack. No cash needed.' },
              { icon: '🔧', title: 'Pick Up & Get to Work', desc: 'Coordinate with the owner, collect the tool, and return it when done. Build something great.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center p-6">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="font-display font-semibold text-xl text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      {featuredTools.length > 0 && (
        <section className="py-16 bg-white">
          <div className="page-container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="section-title mb-1">Recently Listed</h2>
                <p className="text-gray-500">Fresh tools from trusted owners</p>
              </div>
              <Link to="/tools" className="btn-outline text-sm py-2 px-4 flex items-center gap-1">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <ToolCard key={tool._id} tool={tool} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Section */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="page-container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { icon: <Shield className="mx-auto mb-3 text-brand-400" size={32} />, title: 'Verified Owners', desc: 'Every tool owner is verified for your safety and peace of mind.' },
              { icon: <Zap className="mx-auto mb-3 text-brand-400" size={32} />, title: 'Instant Booking', desc: 'Book within minutes. Owners typically respond within 2 hours.' },
              { icon: <Users className="mx-auto mb-3 text-brand-400" size={32} />, title: 'Community First', desc: 'Built on trust, powered by communities across Nigerian cities.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="p-6">
                {icon}
                <h3 className="font-display font-semibold text-xl mb-2">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-brand-500 to-brand-700">
        <div className="page-container text-center">
          <h2 className="text-4xl font-display font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-brand-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of Nigerians renting and earning with ToolShare Africa today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register?role=renter" className="bg-white text-brand-600 font-semibold px-8 py-4 rounded-xl hover:bg-brand-50 transition-colors shadow-lg">
              Start Renting
            </Link>
            <Link to="/register?role=owner" className="bg-brand-400 text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-300 transition-colors border border-brand-300">
              Start Earning
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
