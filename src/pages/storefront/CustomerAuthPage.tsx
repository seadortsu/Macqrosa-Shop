import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const CustomerAuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { loginCustomer, registerCustomer } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const res = await loginCustomer(email, password);
      if (res.success) {
        navigate('/account');
      } else {
        setError(res.error || 'Authentication rejected');
      }
    } else {
      const res = await registerCustomer({
        email,
        password,
        firstName,
        lastName,
        phone
      });
      if (res.success) {
        navigate('/account');
      } else {
        setError(res.error || 'Registration failed');
      }
    }
    setLoading(false);
  };

  const handleDemoCustomer = () => {
    setEmail('claire@vendome.com');
    setPassword('customer123');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-surface-container-lowest border border-secondary/25 rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-gold-md space-y-6">
        <div className="text-center">
          <BrandLogo size="md" className="justify-center mb-3" />
          <h2 className="font-serif text-2xl text-primary font-normal">
            {isLogin ? 'Circle Privé Access' : 'Create Maison Account'}
          </h2>
          <p className="text-xs text-on-surface-variant font-light mt-1">
            {isLogin
              ? 'Enter your private credentials to view your order history and privileges.'
              : 'Join our distinguished circle of patrons for bespoke consultations and samples.'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-surface-container">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 ${
              isLogin ? 'border-secondary text-primary' : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 ${
              !isLogin ? 'border-secondary text-primary' : 'border-transparent text-outline hover:text-primary'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="Claire"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sinclair"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Email Address</label>
            <input
              type="email"
              required
              placeholder="claire@vendome.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Phone Number</label>
              <input
                type="tel"
                placeholder="+1 (555) 839-2910"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Secret Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3.5 rounded text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-all shadow-md mt-2"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Access Circle Privé' : 'Complete Registration'}
          </button>
        </form>

        {isLogin && (
          <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleDemoCustomer}
              className="text-[11px] text-secondary hover:underline font-semibold"
            >
              Fill Demo Patron (claire@vendome.com)
            </button>

            <Link to="/admin/login" className="text-[11px] text-outline hover:text-primary underline">
              Staff Portal →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
