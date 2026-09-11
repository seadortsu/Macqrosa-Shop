import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';
import { countries } from '../../data/countries';

export const CustomerAuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { loginCustomer, registerCustomer, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isForgotPassword) {
      const res = await forgotPassword(email);
      if (res.success) {
        setSuccessMsg(res.message || 'Reset link sent if account exists.');
        setIsForgotPassword(false);
      } else {
        setError(res.error || 'Failed to send reset link');
      }
      setLoading(false);
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

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
        firstName: otherNames,
        lastName,
        phone: `${countryCode} ${phone}`
      });
      if (res.success) {
        navigate('/account');
      } else {
        setError(res.error || 'Registration failed');
      }
    }
    setLoading(false);
  };



  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=2000')" }}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      <div className="relative z-10 bg-surface-container-lowest/90 backdrop-blur-md border border-secondary-gold/20 rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center">
          <BrandLogo size="md" className="justify-center mb-3" />
          <h2 className="font-serif text-2xl text-primary font-normal">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Client Dashboard' : 'Create New Account')}
          </h2>
          <p className="text-xs text-on-surface-variant font-light mt-1">
            {isForgotPassword
              ? "Enter your email and we'll send a link to reset your password."
              : (isLogin
                ? 'Enter your credentials to access your order history & Information'
                : 'Join our distinguished community of clients worldwide.')}
          </p>
        </div>

        {/* Tab switch / Back button */}
        <div className="flex border-b border-surface-container">
          {isForgotPassword ? (
            <button
              type="button"
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}
              className="flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 border-secondary text-primary"
            >
              Back to Sign In
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(''); setSuccessMsg(''); }}
                className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 ${
                  isLogin ? 'border-secondary text-primary' : 'border-transparent text-outline hover:text-primary'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(''); setSuccessMsg(''); }}
                className={`flex-1 pb-3 text-xs uppercase tracking-widest font-semibold transition-all border-b-2 ${
                  !isLogin ? 'border-secondary text-primary' : 'border-transparent text-outline hover:text-primary'
                }`}
              >
                Register
              </button>
            </>
          )}
        </div>

        {successMsg && (
          <div className="p-3 rounded bg-green-50 border border-green-200 text-green-800 text-xs text-center">
            {successMsg}
          </div>
        )}

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && !isForgotPassword && (
            <div className="grid grid-cols-2 gap-3">
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
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Other Names</label>
                <input
                  type="text"
                  required
                  placeholder="Claire"
                  value={otherNames}
                  onChange={e => setOtherNames(e.target.value)}
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
              placeholder="email@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
            />
          </div>

          {!isLogin && !isForgotPassword && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Phone Number</label>
              <div className="flex gap-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                    className="flex items-center justify-between gap-1 px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary focus:border-secondary w-[90px] h-full"
                  >
                    <span>{countryCode}</span>
                    <span className="material-symbols-outlined text-[14px] text-outline">expand_more</span>
                  </button>
                  
                  {isCountryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[220px] max-h-48 overflow-y-auto bg-surface-container-lowest border border-secondary/20 rounded shadow-lg z-50 rounded-md scrollbar-thin">
                      {countries.map((country, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setCountryCode(country.dial);
                            setIsCountryDropdownOpen(false);
                          }}
                          className="flex items-center justify-between w-full px-3 py-2 text-xs text-left text-primary hover:bg-surface-container transition-colors"
                        >
                          <span className="truncate pr-2">{country.name}</span>
                          <span className="text-outline flex-shrink-0">{country.dial}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="tel"
                  placeholder="(555) 839-2910"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
                />
              </div>
            </div>
          )}

          {!isForgotPassword && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] uppercase tracking-wider text-outline font-semibold">Password</label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}
                    className="text-[10px] text-secondary hover:text-primary hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
              />
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-3.5 rounded text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-all shadow-md mt-2"
          >
            {loading ? 'Processing...' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign in' : 'Complete Registration'))}
          </button>
        </form>


      </div>
    </div>
  );
};
