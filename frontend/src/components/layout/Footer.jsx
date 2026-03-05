import { Link } from 'react-router-dom';
import { Wrench, Twitter, Instagram, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-20">
      <div className="page-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                <Wrench size={18} className="text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-white text-lg leading-none">ToolShare</span>
                <span className="block text-xs text-brand-400 leading-none">Africa</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              Nigeria's premier peer-to-peer equipment rental marketplace. Empowering communities through shared tools.
            </p>
            <div className="flex items-center gap-3 mt-5">
              {[Twitter, Instagram, Linkedin, Mail].map((Icon, i) => (
                <a key={i} href="#" className="w-8 h-8 bg-gray-800 hover:bg-brand-500 rounded-lg flex items-center justify-center transition-colors">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2.5">
              {[['Browse Tools', '/tools'], ['List Your Tool', '/register?role=owner'], ['How It Works', '/'], ['Contact Us', '/contact']].map(([label, href]) => (
                <li key={label}><Link to={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2.5">
              {[['Help Center', '/help'], ['Safety Guidelines', '/safety'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']].map(([label, href]) => (
                <li key={label}><Link to={href} className="text-sm text-gray-400 hover:text-white transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} ToolShare Africa. All rights reserved.</p>
          {/* <p className="text-xs text-gray-500">Made with ❤️ in Nigeria 🇳🇬</p> */}
        </div>
      </div>
    </footer>
  );
}