import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, User, Building, Compass, Database,
  ShieldCheck, RefreshCw, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [resettingTour, setResettingTour] = useState(false);

  const handleRetakeTour = async () => {
    setResettingTour(true);
    try {
      await api.post('/auth/reset-onboarding');
      updateUser({ onboarding_completed: false });
      navigate('/onboarding');
    } catch (err) {
      console.error("Reset onboarding error:", err);
    } finally {
      setResettingTour(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
          Workspace Settings & Tour
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Store profile configurations, role permissions, and guided onboarding settings.
        </p>
      </div>

      {/* User & Workspace Profile */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <h3 className="text-base font-bold font-['Outfit'] text-white flex items-center space-x-2">
          <User className="w-4 h-4 text-brand-400" />
          <span>Active User Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block">Full Name</span>
            <span className="text-base font-bold text-white mt-1 block">{user?.full_name || "Business User"}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block">Email Address</span>
            <span className="text-base font-bold text-white mt-1 block">{user?.email || "user@store.com"}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block">Assigned Role</span>
            <span className="text-base font-bold text-brand-400 mt-1 block capitalize">
              {user?.role_name?.replace('_', ' ') || "Business Owner"}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-slate-400 block">Workspace Entity</span>
            <span className="text-base font-bold text-white mt-1 block">{user?.workspace_name || "MarketMind Retail India"}</span>
          </div>
        </div>
      </div>

      {/* Guided Tour Option */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex items-center space-x-2 text-brand-400">
          <Compass className="w-5 h-5" />
          <h3 className="text-base font-bold text-white font-['Outfit']">Interactive Feature Tour</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Need a refresher on how the predictive intelligence engines, inventory alerts, and POS work?
          You can re-launch the interactive step-by-step walkthrough at any time.
        </p>

        <button
          onClick={handleRetakeTour}
          disabled={resettingTour}
          className="gradient-btn px-5 py-2.5 rounded-xl text-white font-semibold text-xs flex items-center space-x-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resettingTour ? 'animate-spin' : ''}`} />
          <span>{resettingTour ? "Preparing Tour..." : "Re-Launch Guided Onboarding Tour"}</span>
        </button>
      </div>

      {/* System Technical Architecture */}
      <div className="glass-panel p-6 rounded-3xl space-y-4 text-xs">
        <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Platform Technology Stack</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Backend</span>
            <span className="font-semibold text-white mt-1 block">FastAPI Python 3.12</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Database</span>
            <span className="font-semibold text-white mt-1 block">PostgreSQL (psycopg2)</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">AI Engines</span>
            <span className="font-semibold text-white mt-1 block">Scikit-Learn & Prophet</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-slate-500 font-bold block text-[10px] uppercase">Frontend</span>
            <span className="font-semibold text-white mt-1 block">React 18 + TailwindCSS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
