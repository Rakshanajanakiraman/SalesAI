import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Lock, Mail, User, Building, MapPin, ArrowRight,
  AlertCircle, Shield, Sparkles, TrendingUp, Users, Zap, CheckCircle2,
  Cpu, Layers, Eye
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    business_name: '',
    business_type: 'Supermarket / Grocery',
    city: 'Bengaluru',
    state: 'Karnataka',
    intended_role: 'business_owner'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active AI image gallery state
  const aiShowcaseImage = {
    url: '/images/ai_retail_intelligence.jpg',
    title: 'AI Neural Retail Brain',
    badge: '94.8% Forecasting Precision',
    desc: 'Deep neural networks analyzing real-time sales telemetry and consumer velocity.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      navigate('/onboarding');
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Please check the details entered.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-brand-600/15 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 blur-[130px] rounded-full pointer-events-none" />

      {/* Main Container */}
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
                Intelligent Retail Operating System
              </span>
            </div>
          </Link>
        </div>

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: AI Visual Showcase & Value Prop (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Visual AI Showcase Box - Single Brain Neural Image */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
              <div className="relative rounded-2xl overflow-hidden aspect-video sm:aspect-[16/10] bg-slate-900 border border-slate-700/60 shadow-inner">
                {/* Embedded AI Picture */}
                <img
                  src={aiShowcaseImage.url}
                  alt={aiShowcaseImage.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Ambient Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Floating AI Status Badges on Image */}
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

                {/* Image Details Caption at bottom */}
                <div className="absolute bottom-3.5 left-3.5 right-3.5">
                  <h4 className="text-sm font-bold text-white font-['Outfit']">
                    {aiShowcaseImage.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                    {aiShowcaseImage.desc}
                  </p>
                </div>
              </div>
            </div>

            {/* AI Capabilities Highlights */}
            <div className="glass-panel p-5 rounded-3xl border border-slate-800/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>What MarketMind AI Powers For You:</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Prophet Forecasting</strong>
                    <span className="text-[11px] text-slate-400">30-day automated stock replenishment</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">RFM Segmentation</strong>
                    <span className="text-[11px] text-slate-400">K-Means clustering on Indian shoppers</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Market Basket AI</strong>
                    <span className="text-[11px] text-slate-400">Affinity mining for bill bundle boosts</span>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block">Churn Risk Radar</strong>
                    <span className="text-[11px] text-slate-400">Proactive alerts before regulars drop off</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: High-Tech Signup Card (7 cols on lg) */}
          <div className="lg:col-span-7">
            <div className="glass-panel py-7 px-6 sm:px-9 rounded-3xl border border-slate-800/90 shadow-2xl relative">
              <div className="mb-6">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Free Instant Onboarding
                  </span>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-[11px] text-slate-400 font-medium">Ready in under 60 seconds</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-white">
                  Create Your Business Workspace
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Set up your store, track sales & inventory, and let AI forecast your revenue.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="e.g. Ramesh Sundaram"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Work Email *</label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="ramesh@retailmart.com"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Password *</label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Mobile Contact (+91)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 9845012345"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Store / Business Name *</label>
                    <div className="relative">
                      <Building className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={formData.business_name}
                        onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                        placeholder="e.g. Sundaram Supermart"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Retail Department</label>
                    <select
                      value={formData.business_type}
                      onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    >
                      <option value="Supermarket / Grocery">Supermarket / Grocery</option>
                      <option value="Consumer Electronics">Consumer Electronics</option>
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Wholesale Distribution">Wholesale Distribution</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bengaluru"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="Karnataka"
                      className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Role in Workspace</label>
                  <select
                    value={formData.intended_role}
                    onChange={(e) => setFormData({ ...formData, intended_role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="business_owner">Business Owner (Full Intelligence & Admin Access)</option>
                    <option value="store_manager">Store Manager (Inventory, Orders & AI Models)</option>
                    <option value="sales_executive">Sales Executive (POS Billing & Customer Profiles)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 gradient-btn text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-brand-600/30 hover:opacity-95 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Initialize Workspace & Launch AI</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center space-x-1.5 text-slate-500">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <span>256-bit AES Encryption • GST Ready</span>
                </div>
                <div>
                  Already registered?{' '}
                  <Link to="/login" className="text-brand-400 font-bold hover:text-brand-300">
                    Sign In &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
