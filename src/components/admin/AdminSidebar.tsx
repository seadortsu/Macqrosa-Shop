import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface AdminSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen = true, onToggle }) => {
  const { admin, logoutAdmin } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Analytics', path: '/admin', icon: 'insights', end: true },
    { label: 'Orders', path: '/admin/orders', icon: 'receipt_long' },
    { label: 'Products', path: '/admin/products', icon: 'inventory_2' },
    { label: 'Categories', path: '/admin/categories', icon: 'category' },
    { label: 'Inventory', path: '/admin/inventory', icon: 'warehouse' },
    { label: 'Customers', path: '/admin/customers', icon: 'group' },
    { label: 'Notifications', path: '/admin/notifications', icon: 'campaign' },
  ];

  const bottomNavItems = [
    { label: 'System Configurations', path: '/admin/settings', icon: 'settings' }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-full w-72 bg-surface-container-lowest dark:bg-dark-surface border-r border-surface-container dark:border-dark-outline-variant z-50 flex flex-col admin-sidebar transition-transform duration-300 ${
          isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        {/* Sidebar Header — Clean & Clear */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-surface-container dark:border-dark-outline-variant shrink-0">
          <Link to="/admin" className="flex items-center gap-3 group">
            {/* Logo Mark */}
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 group-hover:shadow-gold-sm transition-shadow">
              <span className="text-secondary-gold font-serif text-lg font-bold">M</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-[15px] font-semibold text-primary dark:text-dark-on-surface leading-tight tracking-wide">
                Macqrosa
              </span>
              <span className="text-[11px] font-sans font-medium text-secondary dark:text-secondary-gold tracking-wide">
                {admin?.role === 'super_admin' ? 'Administrator(super)' : 'Store Manager'}
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={onToggle}
              className="p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low transition-colors lg:hidden"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Storefront Status */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low dark:bg-dark-surface-container border border-secondary/8 dark:border-dark-outline-variant">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[12px] font-medium text-on-surface dark:text-dark-on-surface">Store Online</span>
            <span className="text-[11px] text-on-surface-variant dark:text-dark-on-surface-variant ml-auto">USD</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="px-3 mb-2 mt-1">
          </div>
          <nav className="flex flex-col gap-0.5">
            {navItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                onClick={() => isMobile && onToggle?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-low dark:hover:bg-dark-surface-container hover:text-on-surface dark:hover:text-dark-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Storefront Link */}
          <div className="mt-4 px-3 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Quick Access
            </span>
          </div>
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors group"
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            <span>View Live Store</span>
            <span className="material-symbols-outlined text-[14px] ml-auto text-outline group-hover:translate-x-0.5 transition-transform">
              open_in_new
            </span>
          </Link>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-auto px-3 py-2 border-t border-surface-container dark:border-dark-outline-variant">
          <nav className="flex flex-col gap-0.5">
            {bottomNavItems.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && onToggle?.()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container-low dark:hover:bg-dark-surface-container hover:text-on-surface dark:hover:text-dark-on-surface'
                  }`
                }
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};
