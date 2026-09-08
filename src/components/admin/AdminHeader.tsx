import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStoreSettings } from '../../context/StoreSettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
  searchPlaceholder?: string;
  onToggleSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onSearch,
  searchValue = '',
  searchPlaceholder = 'Search orders, products, or customers...',
  onToggleSidebar
}) => {
  const { admin, logoutAdmin } = useAuth();
  const { systemAlerts } = useStoreSettings();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin/login');
  };

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-72 h-16 sm:h-20 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-surface-container z-30 flex items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-300">
      {/* Left: Mobile sidebar toggle + Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-container-low transition-colors"
          aria-label="Toggle sidebar"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        {/* Search */}
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">
            search
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={e => onSearch && onSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-[13px] bg-surface-container-low text-on-surface placeholder:text-outline rounded-lg outline-none focus:ring-1 focus:ring-secondary/50 transition-all border border-transparent focus:border-secondary/20"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 ml-4">
        {systemAlerts && systemAlerts.enabled ? (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[12px] font-medium text-amber-900">
              Broadcast Alert Active
            </span>
          </div>
        ) : null}

        <button 
          onClick={toggleTheme}
          title="Toggle Dark Mode"
          className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">
            {resolvedTheme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        <button className="relative p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors">
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary-gold ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-surface-container-high hidden sm:block" />

        <div className="hidden sm:flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
            {admin?.name ? admin.name[0] : 'A'}
          </div>
          <div className="hidden lg:flex flex-col text-left mr-2">
            <span className="text-[13px] font-semibold text-on-surface leading-tight">
              {admin ? admin.name : 'Admin'}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {admin?.role === 'super_admin' ? 'Administrator(super)' : 'Store Manager'}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            title="Sign out"
            className="text-on-surface-variant hover:text-error p-2 transition-colors rounded-lg hover:bg-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
