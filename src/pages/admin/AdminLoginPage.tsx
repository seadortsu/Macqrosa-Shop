import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await loginAdmin(email, password);
    if (res.success) {
      navigate('/admin');
    } else {
      setError(res.error || 'Administrator credentials invalid.');
    }
    setLoading(false);
  };

  const handleFillDemo = () => {
    setEmail('admin@macqrosa.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Ambient background light orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-secondary-gold/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-secondary/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 bg-surface-container-low/95 backdrop-blur-2xl border border-secondary-gold/30 rounded-2xl p-8 sm:p-12 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center">
          <BrandLogo size="md" className="justify-center mb-4 invert" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-gold/15 text-secondary-fixed text-[10px] uppercase tracking-widest font-semibold mb-2 border border-secondary-gold/30">
            <span className="material-symbols-outlined text-[14px]">shield_person</span>
            <span>Place Vendôme Staff &amp; Executive Portal</span>
          </div>
          <h1 className="font-serif text-2xl text-primary font-normal tracking-wide">
            MACQROSA Console
          </h1>
          <p className="text-xs text-on-surface-variant font-light mt-1">
            Restricted to authorized atelier inventory, order, and salon operators.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/60 border border-red-800/80 text-red-200 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-red-400">error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1.5 font-semibold">
              Administrator Email
            </label>
            <input
              type="email"
              required
              placeholder="admin@macqrosa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container border border-secondary-gold/25 rounded-lg text-xs text-primary placeholder-outline outline-none focus:border-secondary-gold transition-colors"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-on-surface-variant mb-1.5 font-semibold">
              Security Key / Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface-container border border-secondary-gold/25 rounded-lg text-xs text-primary placeholder-outline outline-none focus:border-secondary-gold transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary-gold hover:bg-white text-primary py-3.5 rounded-lg text-xs uppercase tracking-[0.2em] font-semibold transition-all duration-300 shadow-gold-md hover:shadow-gold-lg mt-2"
          >
            {loading ? 'Verifying Credentials...' : 'Authenticate & Enter Console'}
          </button>
        </form>

        <div className="pt-4 border-t border-white/10 flex flex-col items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleFillDemo}
            className="text-secondary-fixed hover:text-primary font-medium hover:underline text-[11px] transition-colors"
          >
            Fill Demo Credentials (admin@macqrosa.com)
          </button>

          <a href="/" className="text-on-surface-variant hover:text-primary text-[11px] transition-colors flex items-center gap-1">
            <span>←</span>
            <span>Return to Customer Storefront</span>
          </a>
        </div>
      </div>
    </div>
  );
};
