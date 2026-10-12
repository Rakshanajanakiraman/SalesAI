import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, Users, Package, BrainCircuit, ShieldAlert, Sparkles,
  BarChart3, ChevronRight, CheckCircle2, ArrowRight, Zap, RefreshCw,
  FileSpreadsheet, Award, Layers, ShoppingBag, Database, ArrowDown
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeStoryStep, setActiveStoryStep] = useState(0);

  const storySteps = [
    {
      num: "01",
      title: "Raw Sales Transactions",
      desc: "Daily POS sales, UPI payments, cash bills, discounts & GST are recorded and relationalized instantly.",
      badge: "Ingestion Layer",
      icon: ShoppingBag,
      color: "from-blue-500/20 to-cyan-500/20",
      accent: "text-cyan-400"
    },
    {
      num: "02",
      title: "Customer Intelligence",
      desc: "Identifies purchasing habits, recency, order frequencies, and lifetime value across 1,000+ Indian customer records.",
      badge: "Behavioral Analytics",
      icon: Users,
      color: "from-indigo-500/20 to-purple-500/20",
      accent: "text-indigo-400"
    },
    {
      num: "03",
      title: "Live Inventory Movement",
      desc: "Continuous stock deduction, reorder threshold checks, and automated low-stock warnings across warehouses.",
      badge: "Operational Sync",
      icon: Package,
      color: "from-amber-500/20 to-orange-500/20",
      accent: "text-amber-400"
    },
    {
      num: "04",
      title: "Machine Learning Engine",
      desc: "Prophet time-series regression, RFM K-Means clustering, and Isolation Forest algorithms process historical trends.",
      badge: "AI/ML Core",
      icon: BrainCircuit,
      color: "from-emerald-500/20 to-teal-500/20",
      accent: "text-emerald-400"
    },
    {
      num: "05",
      title: "Predictive Growth Decisions",
      desc: "Delivers 30-day revenue projections, customer churn mitigation plans, and personalized cross-selling bundles.",
      badge: "Strategic Impact",
      icon: TrendingUp,
      color: "from-purple-500/20 to-pink-500/20",
      accent: "text-purple-400"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold font-['Outfit'] tracking-tight text-white">
                MarketMind <span className="gradient-text">AI</span>
              </span>
              <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Small Business Sales Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-brand-400 transition-colors">How It Works</a>
            <a href="#features" className="hover:text-brand-400 transition-colors">Platform Capabilities</a>
            <a href="#ai-models" className="hover:text-brand-400 transition-colors">AI & ML Models</a>
            <a href="#roles" className="hover:text-brand-400 transition-colors">Roles & RBAC</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors hover:bg-slate-800/60"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="gradient-btn text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand-600/25 flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[350px] h-[350px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-8 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-brand-400 animate-pulse" />
            <span>AI-Driven Retail Analytics Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold font-['Outfit'] text-white tracking-tight leading-[1.1] max-w-5xl mx-auto">
            Turn Your Business Data Into <br className="hidden sm:inline" />
            <span className="gradient-text">Smarter Strategic Decisions</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            MarketMind AI empowers small business owners, store managers, and sales teams to monitor performance, optimize stock, predict customer churn, and forecast future revenue with real machine learning.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="gradient-btn text-white text-base font-semibold px-8 py-4 rounded-xl shadow-xl shadow-brand-600/30 flex items-center space-x-3 w-full sm:w-auto justify-center"
            >
              <span>Launch Demo Workspace</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#how-it-works"
              className="glass-panel text-slate-200 text-base font-semibold px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-slate-800/80 transition-all flex items-center space-x-2 w-full sm:w-auto justify-center"
            >
              <span>Explore Data Flow</span>
              <ArrowDown className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Quick Stats Pill */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">1,000+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Synthetic Indian Customers</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-['Outfit']">2,500+</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Real POS Sales Mapped</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-['Outfit']">5 ML Models</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Prophet, K-Means, XGBoost</div>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800/80">
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-['Outfit']">4 Roles</div>
              <div className="text-xs text-slate-400 mt-1 font-medium">Owner, Manager, Sales, Admin</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Visual Scrolling Story */}
      <section id="how-it-works" className="py-24 bg-slate-900/40 border-y border-slate-800/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Architectural Workflow</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] text-white">
              The Journey From Raw Data to <span className="gradient-text">Predictive Action</span>
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Explore how every single sales receipt in PostgreSQL fuels automated machine learning models in real time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Step Selector List */}
            <div className="lg:col-span-5 space-y-4">
              {storySteps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStoryStep === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveStoryStep(idx)}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? 'bg-slate-850/90 border-brand-500/50 shadow-lg shadow-brand-500/10'
                        : 'glass-panel border-slate-800/60 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isActive ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">{step.badge}</span>
                          <span className="text-xs text-slate-500 font-mono">STEP {step.num}</span>
                        </div>
                        <h4 className="text-lg font-bold text-white mt-1">{step.title}</h4>
                        <p className="text-sm text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Visual Story Canvas Preview */}
            <div className="lg:col-span-7">
              <div className="glass-panel p-8 rounded-3xl border border-slate-700/60 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs text-slate-400 font-mono ml-2">MarketMind Intelligence Pipeline Engine</span>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-brand-950 text-brand-300 border border-brand-800/40">
                    Live Data Flow
                  </span>
                </div>

                {/* Animated Pipeline Nodes */}
                <div className="space-y-6">
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">PostgreSQL Sales Ingestion</div>
                          <div className="text-xs text-slate-400">Transaction ID: INV-IN-2025-10482 (₹3,499.00 via UPI)</div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">Committed</span>
                    </div>
                  </div>

                  <div className="flex justify-center -my-3">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-cyan-500 to-indigo-500" />
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Customer Profile Update</div>
                          <div className="text-xs text-slate-400">Customer: Arjun Kumar (Bengaluru) • Frequency +1, Recency: 0d</div>
                        </div>
                      </div>
                      <span className="text-xs text-indigo-300 font-mono bg-indigo-950/60 px-2 py-1 rounded border border-indigo-800/40">RFM Calculated</span>
                    </div>
                  </div>

                  <div className="flex justify-center -my-3">
                    <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-emerald-500" />
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <BrainCircuit className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Predictive AI Feedback Loop</div>
                          <div className="text-xs text-slate-400">Churn Probability: 0.12 (Low Risk) • Next Month Forecast: +4.2%</div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-300 font-mono bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800/40">Model Tuned</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-brand-950/40 border border-brand-800/40 text-xs text-brand-300 flex items-center justify-between">
                  <span>Guaranteed ACID durability in PostgreSQL with zero mock numbers.</span>
                  <Link to="/register" className="font-semibold underline hover:text-white">Experience Now &rarr;</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: Core Business Intelligence Modules */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Built for Operations</div>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] text-white">
            All-in-One Sales & Inventory Engine
          </h2>
          <p className="text-slate-400 mt-4 text-base">
            Everything your small enterprise needs to eliminate spreadsheets and take command of daily retail workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="glass-panel glass-panel-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Point of Sale & Billing</h3>
            <p className="text-sm text-slate-400 mt-2">
              Fast transaction capture with UPI, Cash, and Card methods. Automatically calculates GST percentages, line discounts, and records payment status.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Live Inventory & Stock Alerts</h3>
            <p className="text-sm text-slate-400 mt-2">
              Every completed sale immediately decrements stock. Automatic alerts notify managers when goods breach their reorder thresholds.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Customer CRM & History</h3>
            <p className="text-sm text-slate-400 mt-2">
              Indian phone formats, cities, address verification, and intelligent autocomplete suggestions for repeat customer names.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">AI Sales Forecasting</h3>
            <p className="text-sm text-slate-400 mt-2">
              Prophet time-series models predict next 30, 60, and 90-day demand and turnover with authentic MAE, RMSE, and R² precision metrics.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Churn & Anomaly Detection</h3>
            <p className="text-sm text-slate-400 mt-2">
              Identifies at-risk customers with inactivity scoring and catches inventory discrepancies and abnormal transactions using Isolation Forest.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-6 rounded-2xl">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Custom CSV Ingestion</h3>
            <p className="text-sm text-slate-400 mt-2">
              Easily upload your store's own CSV spreadsheets. Our smart engine auto-maps columns, validates fields, and populates your private workspace.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION: 4 Platform Roles */}
      <section id="roles" className="py-24 bg-slate-900/30 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-2">Enterprise Security</div>
            <h2 className="text-3xl sm:text-5xl font-extrabold font-['Outfit'] text-white">
              Role-Based Access Control (RBAC)
            </h2>
            <p className="text-slate-400 mt-4 text-base">
              Securely partitioned views enforced at the database level for all four business stakeholders.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl border-t-4 border-indigo-500">
              <h3 className="text-lg font-bold text-white">Business Owner</h3>
              <p className="text-xs text-indigo-400 font-mono mt-1">Full Executive Oversight</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>View revenue analytics & KPIs</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Access AI forecast reports</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Review churn & retention</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Export executive reports</span></li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-t-4 border-amber-500">
              <h3 className="text-lg font-bold text-white">Store Manager</h3>
              <p className="text-xs text-amber-400 font-mono mt-1">Operational & Stock Control</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Live inventory management</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Monitor reorder alerts</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Review daily sales turnover</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Operational report generator</span></li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-t-4 border-cyan-500">
              <h3 className="text-lg font-bold text-white">Sales Executive</h3>
              <p className="text-xs text-cyan-400 font-mono mt-1">POS & Customer Servicing</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Process counter sales & bills</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Generate GST invoices</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Access customer recommendations</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Track personal transactions</span></li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-t-4 border-purple-500">
              <h3 className="text-lg font-bold text-white">System Admin</h3>
              <p className="text-xs text-purple-400 font-mono mt-1">Platform & Data Governance</p>
              <ul className="mt-4 space-y-2 text-xs text-slate-300">
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Manage users and roles</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Configure system permissions</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Workspace dataset controls</span></li>
                <li className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>Full deployment & audit logs</span></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold font-['Outfit'] text-white">MarketMind AI</span>
          </div>
          <div className="text-xs text-slate-400 text-center md:text-left">
            Production-grade Small Business Sales Intelligence Platform • Connected to PostgreSQL & FastAPI
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">Get Started Free</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
