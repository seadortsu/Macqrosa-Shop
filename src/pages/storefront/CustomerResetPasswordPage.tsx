import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandLogo } from '../../components/common/BrandLogo';

export const CustomerResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await resetPassword(token, password);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth');
      }, 3000);
    } else {
      setError(res.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&q=80&w=2000')" }}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
      <div className="relative z-10 bg-surface-container-lowest/90 backdrop-blur-md border border-secondary-gold/20 rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-2xl space-y-6">
        <div className="text-center">
          <BrandLogo size="md" className="justify-center mb-3" />
          <h2 className="font-serif text-2xl text-primary font-normal">Choose New Password</h2>
          <p className="text-xs text-on-surface-variant font-light mt-1">
            Please enter your new password below.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center p-6 space-y-4">
            <div className="mx-auto w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined">check</span>
            </div>
            <p className="text-sm text-primary">Your password has been reset successfully.</p>
            <p className="text-xs text-on-surface-variant">Redirecting to sign in...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
              />
            </div>
            
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-outline mb-1 font-semibold">Confirm New Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 bg-surface-container-low border border-secondary/20 rounded text-xs text-primary outline-none focus:border-secondary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3.5 rounded text-xs uppercase tracking-[0.2em] font-semibold hover:bg-neutral-800 transition-all shadow-md mt-4"
            >
              {loading ? 'Processing...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
