import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BrainCircuit, Lock, Mail, ArrowRight, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const aiShowcaseImage = {
    url: '/images/ai_retail_intelligence.jpg',
    title: 'AI Neural Retail Brain',
    badge: '94.8% Forecasting Precision',
    desc: 'Deep neural networks analyzing real-time sales telemetry, pricing, and consumer demand.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user.onboarding_completed) {
        navigate('/onboarding');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid login credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <span className="text-2xl sm:text-3xl font-black font-['Outfit'] text-white">
                MarketMind <span className="gradient-text">AI</span>
              </span>
              <span className="block text-[10px] text-brand-400 font-bold uppercase tracking-widest">
                Small Business Sales Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
          {/* Left Column: Single Neural Brain Image Showcase */}
          <div className="lg:col-span-5 space-y-5">
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-900 border border-slate-700/60 shadow-inner">
                {/* Single Brain Neural Image */}
                <img
                  src={aiShowcaseImage.url}
                  alt={aiShowcaseImage.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Ambient Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

                {/* Floating Status Badge */}
                <div className="absolute top-3.5 left-3.5 flex items-center space-x-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-950/80 text-white backdrop-blur-md border border-slate-700/80 flex items-center space-x-1.5 shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Neural AI Active</span>
                  </span>
                </div>

                <div className="absolute top-3.5 right-3.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-600/90 text-white backdrop-blur-md shadow-lg border border-brand-400/40">
                    {aiShowcaseImage.badge}
                  </span>
                </div>

                {/* Image Details Caption */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5">
                  <h4 className="text-sm font-bold text-white font-['Outfit']">
                    {aiShowcaseImage.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                    {aiShowcaseImage.desc}
                  </p>
                </div>
              </div>

              {/* Value proposition pill */}
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center space-x-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant insight across sales, inventory, and demand</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sign In Card */}
          <div className="lg:col-span-7">
            <div className="glass-panel py-8 px-6 sm:px-10 rounded-3xl border border-slate-800/80 shadow-2xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold font-['Outfit'] text-white">
                  Sign In to Your Workspace
                </h2>
                <p className="mt-1.5 text-xs text-slate-400">
                  Enter your credentials or select a 1-click demo role below.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 text-xs transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-btn text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-600/30 hover:opacity-95 transition-all flex items-center justify-center space-x-2 text-xs disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* 1-Click Demo Logins */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                    <span>Quick Demo Accounts</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('owner@marketmind.ai', 'Password@123')}
                    className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="font-semibold text-white">Business Owner</div>
                    <div className="text-[10px] text-slate-400">Full Analytics</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('manager@marketmind.ai', 'Password@123')}
                    className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="font-semibold text-white">Store Manager</div>
                    <div className="text-[10px] text-slate-400">Stock & Alerts</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('sales@marketmind.ai', 'Password@123')}
                    className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="font-semibold text-white">Sales Executive</div>
                    <div className="text-[10px] text-slate-400">POS & Invoices</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDemoCredentials('admin@marketmind.ai', 'Password@123')}
                    className="text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all text-xs"
                  >
                    <div className="font-semibold text-white">System Admin</div>
                    <div className="text-[10px] text-slate-400">System Controls</div>
                  </button>
                </div>
              </div>

              <div className="mt-5 text-center text-xs text-slate-400">
                Don't have an account?{' '}
                <Link to="/register" className="text-brand-400 font-semibold hover:text-brand-300">
                  Create an account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
