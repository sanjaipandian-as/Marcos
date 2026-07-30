import React, { useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

// Sunburst Icon matching screenshot
const SunburstIcon = () => (
  <svg width="44" height="44" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="translate(20, 20)">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <rect
          key={deg}
          x="-2"
          y="-16"
          width="4"
          height="9"
          rx="2"
          fill="#f55900"
          transform={`rotate(${deg})`}
        />
      ))}
    </g>
  </svg>
);

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide your email and password.');
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
    <div className="h-screen w-full bg-[#140d08] flex items-center justify-center p-3 sm:p-5 md:p-8 font-sans overflow-hidden">
      {/* Full Screen Main Card Container */}
      <div className="w-full h-full max-w-7xl bg-white rounded-[32px] p-4 sm:p-6 md:p-8 shadow-2xl border border-white/20 flex flex-col md:flex-row gap-6 md:gap-10 items-stretch overflow-hidden">
        
        {/* ── Left Dark Hero Panel with Flame Glow ── */}
        <div className="md:w-1/2 bg-[#0c0c0e] rounded-[24px] p-8 sm:p-10 md:p-12 text-white flex flex-col justify-between relative overflow-hidden min-h-[300px] border border-slate-800 shrink-0">
          
          {/* Top Headline Text */}
          <div className="relative z-10 max-w-sm">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold leading-[1.12] text-white tracking-tight">
              Convert your ideas into successful business.
            </h1>
          </div>

          {/* Glowing Flame Graphics at Bottom Left */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 pointer-events-none overflow-hidden rounded-b-[24px]">
            {/* Soft warm backdrop glow */}
            <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-[#f55900]/40 via-amber-600/10 to-transparent blur-2xl opacity-75" />
            
            {/* Vertical Flame Pillars */}
            <div className="absolute bottom-0 left-6 w-12 h-56 bg-gradient-to-t from-[#f55900] via-amber-500/70 to-transparent rounded-t-full blur-md opacity-85" />
            <div className="absolute bottom-0 left-20 w-14 h-72 bg-gradient-to-t from-[#ff6a00] via-amber-400/80 to-transparent rounded-t-full blur-lg opacity-90" />
            <div className="absolute bottom-0 left-36 w-10 h-44 bg-gradient-to-t from-orange-600 via-amber-500/60 to-transparent rounded-t-full blur-md opacity-75" />
            <div className="absolute bottom-0 left-50 w-8 h-32 bg-gradient-to-t from-amber-600 via-orange-500/50 to-transparent rounded-t-full blur-md opacity-60" />
          </div>

        </div>

        {/* ── Right Form Section ── */}
        <div className="md:w-1/2 flex flex-col justify-center py-4 px-2 sm:px-6 md:px-10 overflow-y-auto">
          
          <div className="space-y-6 max-w-md mx-auto w-full">
            {/* Sunburst Logo Header */}
            <div>
              <SunburstIcon />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight mt-4">
                Admin Login
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5">
                Welcome back — Please enter your credentials to login
              </p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Email Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">
                  Your email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@marcos.com"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200/90 text-slate-800 text-sm font-medium focus:outline-none focus:border-[#f55900] focus:ring-1 focus:ring-[#f55900] transition-all bg-white placeholder-slate-400"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 block">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200/90 text-slate-800 text-sm font-medium focus:outline-none focus:border-[#f55900] focus:ring-1 focus:ring-[#f55900] transition-all bg-white placeholder-slate-400"
                />
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 mt-2 rounded-xl bg-[#f55900] hover:bg-[#e04a00] active:scale-[0.99] text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
