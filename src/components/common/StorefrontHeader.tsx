import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from './BrandLogo';

import { useStoreSettings } from '../../context/StoreSettingsContext';

export const StorefrontHeader: React.FC = () => {
  const { customer } = useAuth();
  const { itemCount, subtotal, setIsCartOpen } = useCart();
  const { themeConfig, systemAlerts, menus } = useStoreSettings();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDynamicCategories(data.map((c: any) => c.name));
        }
      })
      .catch(err => console.error('Failed to load categories:', err));
      
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcut ⌘K or / for quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  // Use dynamic menu if available, otherwise fallback
  const mainMenu = menus['main-menu']?.items || [];
  
  const navLinks = mainMenu.length > 0 
    ? mainMenu.map((item: any) => ({
        label: item.title,
        path: item.url,
        icon: 'storefront' // We can expand to use icons later
      }))
    : [
        { label: 'Shop', path: '/catalog', icon: 'storefront' },
        { label: 'New Arrivals', path: '/catalog?sort=newest', icon: 'new_releases' },
        { label: 'Best Sellers', path: '/catalog?sort=popular', icon: 'trending_up' },
      ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-container-lowest/98 dark:bg-dark-surface/98 backdrop-blur-2xl shadow-gold-sm border-b border-secondary/20 dark:border-dark-outline-variant'
            : 'bg-surface-container-lowest/95 dark:bg-dark-surface/95 backdrop-blur-xl border-b border-secondary/15 dark:border-dark-outline-variant/50'
        }`}
      >
        {/* System-Wide Broadcast Alert (if triggered by Admin) */}
        {systemAlerts && systemAlerts.enabled && (
          <div
            className={`py-2 px-4 text-center text-xs font-medium tracking-wide flex items-center justify-center gap-2 ${
              systemAlerts.type === 'urgent'
                ? 'bg-rose-900 text-rose-100 border-b border-rose-700'
                : systemAlerts.type === 'warning'
                ? 'bg-amber-900 text-amber-100 border-b border-amber-700'
                : 'bg-secondary-gold text-primary font-semibold border-b border-secondary'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {systemAlerts.type === 'urgent' ? 'emergency' : systemAlerts.type === 'warning' ? 'warning' : 'campaign'}
            </span>
            <span>{systemAlerts.message}</span>
            {systemAlerts.linkUrl && (
              <Link
                to={systemAlerts.linkUrl}
                className="underline font-semibold ml-2 hover:opacity-80"
              >
                {systemAlerts.linkText || 'View Details'}
              </Link>
            )}
          </div>
        )}

        {/* Top Promo / Announcement Bar */}
        <div
          className="py-2 px-4 sm:px-8 text-center relative overflow-hidden border-b border-white/5"
          style={{
            backgroundColor: themeConfig?.bannerBg || '#181615',
            color: themeConfig?.bannerText || '#FFFFFF'
          }}
        >
          <div className="flex items-center justify-center gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-fixed animate-pulse" />
            <p className="font-sans text-[11px] sm:text-xs tracking-wide">
              {themeConfig?.announcementText || 'Free shipping on orders over $150 — Complimentary Place Vendôme Gift Packaging'}
            </p>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="h-16 sm:h-20 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile Menu Toggle */}
          <div className="flex items-center gap-4 lg:gap-6 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-on-surface hover:text-secondary-gold transition-colors rounded-lg hover:bg-surface-container-low"
              aria-label="Toggle navigation menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>

            {/* Desktop Nav — simple links, no categories */}
            <nav className="hidden lg:flex items-center gap-6">
              {navLinks.map((link: any) => {
                const isActive = location.pathname + location.search === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`group relative text-[13px] font-medium py-1 transition-colors ${
                      isActive
                        ? 'text-primary dark:text-secondary-gold font-semibold'
                        : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-secondary-gold'
                    }`}
                  >
                    <span>{link.label}</span>
                    <span
                      className={`absolute -bottom-1 left-0 h-[2px] bg-secondary-gold rounded-full transition-all duration-300 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Center: Brand Logo */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <BrandLogo size="md" />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors p-2 rounded-lg hover:bg-surface-container-low"
              title="Search (⌘K)"
            >
              <span className="material-symbols-outlined text-[22px]">search</span>
              <span className="hidden xl:inline text-[13px] font-medium text-on-surface-variant dark:text-dark-on-surface-variant">Search</span>
            </button>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-secondary-gold transition-colors p-2 rounded-lg hover:bg-surface-container-low dark:hover:bg-dark-surface-container"
              title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span className="material-symbols-outlined text-[22px] transition-transform duration-300">
                {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Customer Account */}
            <Link
              to={customer ? "/account" : "/auth"}
              className="flex items-center gap-2 text-on-surface-variant dark:text-dark-on-surface-variant hover:text-primary dark:hover:text-secondary-gold transition-colors p-2 rounded-lg hover:bg-surface-container-low dark:hover:bg-dark-surface-container"
              title={customer ? `Account: ${customer.firstName}` : "Sign In"}
            >
              <span className="material-symbols-outlined text-[22px]">
                {customer ? 'person' : 'account_circle'}
              </span>
              <span className="hidden lg:inline text-[13px] font-medium dark:text-dark-on-surface">
                {customer ? customer.firstName : 'Sign In'}
              </span>
            </Link>

            {/* Bag Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="group relative flex items-center gap-2 bg-primary text-on-primary px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-all duration-300 hover:bg-neutral-800 shadow-sm border border-secondary/20 hover:border-secondary/40"
            >
              <span className="material-symbols-outlined text-[20px] text-secondary-fixed group-hover:scale-110 transition-transform">
                shopping_bag
              </span>
              <span className="text-[13px] font-medium">
                <span className="hidden sm:inline">Bag </span>
                <span className="text-secondary-fixed font-semibold">({itemCount})</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center pt-20 sm:pt-24 px-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-surface-container-lowest dark:bg-dark-surface-container border border-secondary/20 dark:border-dark-outline-variant rounded-xl p-5 sm:p-8 w-full max-w-2xl shadow-gold-lg animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-surface-container">
              <span className="text-sm font-semibold text-primary">
                Search Macqrosa
              </span>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors"
                title="Close (Esc)"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSearch} className="mt-4 flex items-center gap-3">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary text-[20px]">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search products, collections, ingredients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-secondary/15 rounded-lg text-sm text-on-surface outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/40 transition-all"
                />
              </div>
              <button
                type="submit"
                className="bg-primary text-on-primary px-5 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Search
              </button>
            </form>

            <div className="mt-4 pt-3 border-t border-surface-container flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium text-on-surface-variant text-[13px]">
                Popular:
              </span>
              {(dynamicCategories.length > 0 ? dynamicCategories.slice(0, 4) : ['Skincare', 'Fragrance']).map(term => (
                <button
                  key={term}
                  onClick={() => {
                    setSearchQuery(term);
                    navigate(`/catalog?category=${encodeURIComponent(term)}`);
                    setIsSearchOpen(false);
                  }}
                  className="px-3 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-primary text-[13px] font-medium transition-colors border border-secondary/10"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-80 max-w-[85vw] h-full bg-surface-container-lowest shadow-2xl flex flex-col overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-surface-container">
              <BrandLogo size="sm" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-on-surface rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-4 flex flex-col gap-1">
              {navLinks.map((link: any) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-[14px] font-medium text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] text-secondary">{link.icon}</span>
                  <span>{link.label}</span>
                  <span className="material-symbols-outlined text-[16px] text-outline ml-auto">chevron_right</span>
                </Link>
              ))}

              <div className="my-3 border-t border-surface-container" />

              {/* Category quick links in mobile */}
              <p className="px-4 text-[11px] font-semibold uppercase tracking-wider text-secondary mb-2">Categories</p>
              {dynamicCategories.map(cat => (
                <Link
                  key={cat}
                  to={`/catalog?category=${encodeURIComponent(cat)}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-[14px] text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
                >
                  <span>{cat}</span>
                </Link>
              ))}
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-surface-container space-y-3">
              <Link
                to={customer ? "/account" : "/auth"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-3 rounded-lg text-sm font-semibold transition-colors hover:bg-neutral-800"
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                <span>{customer ? 'My Account' : 'Sign In / Register'}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
