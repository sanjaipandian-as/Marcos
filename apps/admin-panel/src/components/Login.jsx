import React, { useState } from 'react';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.login(email.trim(), password);
      if (data.success && data.accessToken) {
        if (data.user.role === 'CUSTOMER') {
          api.logout();
          setError('Access denied: Only administrators and staff can access this portal.');
          return;
        }
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to the authentication server. Please verify port 5000 is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 relative overflow-hidden font-sans">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-brand-500/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="w-full max-w-md space-y-8 bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          {/* Elegant Logo Accent */}
          <div className="mx-auto w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/35 mb-4 animate-bounce">
            <span className="font-black text-2xl">M</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome to MARCOS</h2>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            SuperAdmin Dashboard Control Panel
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 bg-red-950/45 border border-red-500/35 rounded-2xl p-4 text-red-200 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcos@zippy.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/30 border border-slate-700/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 text-white placeholder-slate-500 text-xs font-semibold transition-all duration-300"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                Credentials Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/30 border border-slate-700/60 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/25 text-white placeholder-slate-500 text-xs font-semibold transition-all duration-300"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-lg shadow-brand-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Credentials...</span>
              </>
            ) : (
              <span>Access Control Panel</span>
            )}
          </button>
        </form>

        <div className="pt-2 text-center">
          <p className="text-[10px] text-slate-500 font-bold tracking-wide">
            MARCOS CUSTOM TAILORS &bull; MULTI-STORE MANAGEMENT
          </p>
        </div>
      </div>
    </div>
  );
}
