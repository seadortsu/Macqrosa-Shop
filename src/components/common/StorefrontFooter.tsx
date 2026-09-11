import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from './BrandLogo';

import { useStoreSettings } from '../../context/StoreSettingsContext';

export const StorefrontFooter: React.FC = () => {
  const { footerConfig, menus } = useStoreSettings();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer className="bg-primary text-on-primary border-t border-secondary/20 pt-16 pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
        {/* Top Newsletter & Maison Invitation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-16 border-b border-surface-container-high/20">
          <div>
            <span className="text-[11px] uppercase tracking-[0.24em] text-secondary-fixed font-medium block mb-2">
              L'Atelier Privé • Private Dispatch
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-normal tracking-tight text-on-primary mb-3">
              Subscribe to the Place Vendôme Gazette
            </h3>
            <p className="text-sm font-light text-on-primary-container max-w-lg leading-relaxed">
              Receive private invitations to limited-edition batch harvests, bespoke formulation releases, and complimentary sensorial discovery samples.
            </p>
          </div>

          <div className="flex flex-col justify-center">
            {subscribed ? (
              <div className="p-4 rounded bg-secondary/15 border border-secondary/40 text-secondary-fixed text-xs uppercase tracking-widest font-medium animate-fade-in">
                ✓ Bienvenue. You have been inducted into the Macqrosa Circle. Check your inbox for your inaugural gift.
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  placeholder="Enter your private email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-surface-container-high border border-secondary/30 rounded text-sm text-on-primary placeholder:text-outline outline-none focus:border-secondary transition-all"
                />
                <button
                  type="submit"
                  className="bg-secondary-fixed text-primary px-8 py-3.5 rounded text-xs uppercase tracking-[0.16em] font-semibold hover:bg-white transition-all shrink-0"
                >
                  Join Circle
                </button>
              </form>
            )}
            <p className="text-[10px] opacity-70 text-on-primary mt-2">
              By subscribing you agree to our Privacy Policy. You may withdraw membership privileges at any time.
            </p>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-b border-surface-container-high/20">
          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-secondary-fixed mb-4">
              {menus['footer-menu']?.title || 'The Disciplines'}
            </h4>
            <ul className="space-y-2.5 text-xs opacity-80 text-on-primary font-light">
              {(menus['footer-menu']?.items || [
                { title: 'Haute Skincare', url: '/catalog?category=Skincare' },
                { title: 'Luminous Complexion', url: '/catalog?category=Complexion' },
                { title: 'Lips & Eye Lacquers', url: '/catalog?category=Lips%20%26%20Eyes' },
                { title: 'Extrait de Parfums', url: '/catalog?category=Fragrance' },
                { title: 'The Gifting Atelier', url: '/catalog?category=Gifting%20Atelier' }
              ]).map((item: any, idx: number) => (
                <li key={idx}><Link to={item.url} className="hover:text-on-primary transition-colors">{item.title}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-secondary-fixed mb-4">Atelier Services</h4>
            <ul className="space-y-2.5 text-xs opacity-80 text-on-primary font-light">
              <li><span className="text-on-primary font-normal">White Glove Courier</span> (Climate Controlled)</li>
              <li><span>Diamond-Point Monogramming</span></li>
              <li><span>Complimentary Deluxe Samples</span></li>
              <li><span>Place Vendôme Wax Crest Boxing</span></li>
              <li><Link to="/account" className="hover:text-on-primary transition-colors">Order Tracking &amp; History</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-secondary-fixed mb-4">The Maison</h4>
            <ul className="space-y-2.5 text-xs opacity-80 text-on-primary font-light">
              <li><span>Place Vendôme, Paris VIII</span></li>
              <li><span>Grasse Harvest Ethos</span></li>
              <li><span>24K Gold Bio-Alchemy</span></li>
              <li><span>Clinical Efficacy Reports</span></li>
              <li><span>Sustainability &amp; Refills</span></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm uppercase tracking-widest text-secondary-fixed mb-4">Client Care</h4>
            <ul className="space-y-2.5 text-xs opacity-80 text-on-primary font-light">
              <li><span>{footerConfig?.email || 'concierge@macqrosa.com'}</span></li>
              <li><span>{footerConfig?.phone || '+33 1 42 60 00 00'}</span></li>
              <li><span>{footerConfig?.hours || 'Mon - Sat • 9am - 8pm CET'}</span></li>
              <li className="pt-2">
                <Link to="/admin/login" className="text-secondary-fixed hover:text-on-primary text-[11px] underline uppercase tracking-wider">
                  Staff &amp; Admin Portal →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-70 text-on-primary">
          <div className="flex items-center gap-3">
            <BrandLogo variant="light" size="sm" />
            <span>© {new Date().getFullYear()} MACQROSA S.A.S. Place Vendôme, Paris. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6 text-[11px] font-light">
            <span className="hover:text-on-primary cursor-pointer">Terms of Haute Sale</span>
            <span className="hover:text-on-primary cursor-pointer">Privacy Protocol</span>
            <span className="hover:text-on-primary cursor-pointer">Cookie Governance</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
