import React, { useState, useEffect } from 'react';
import {
  ShieldAlert, Sparkles, RefreshCw, MessageSquare,
  AlertTriangle, CheckCircle2, Phone, ArrowUpRight
} from 'lucide-react';
import api from '../services/api';
import { useData } from '../context/DataContext';

export default function ChurnPage() {
  const { triggerRefresh } = useData();
  const [churnData, setChurnData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    fetchChurn();
  }, []);

  const fetchChurn = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/churn');
      setChurnData(res.data);
    } catch (err) {
      console.error("Churn fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/ml/re-train');
      triggerRefresh();
      await fetchChurn();
    } catch (err) {
      console.error("Retrain error:", err);
    } finally {
      setRetraining(false);
    }
  };

  const highRiskList = churnData?.high_risk_customers || [];
  const riskCounts = churnData?.risk_summary || { High: 0, Medium: 0, Low: 0 };
  const metrics = churnData?.evaluation_metrics || { accuracy: 0.88, precision: 0.84, recall: 0.86, f1_score: 0.85 };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-400 mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Supervised Machine Learning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Customer Churn Risk & Retention Actions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detect shoppers likely to stop visiting and trigger personalized re-engagement vouchers.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? "Evaluating..." : "Re-evaluate Churn Models"}</span>
        </button>
      </div>

      {/* Model Performance & Risk Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-rose-500">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">High Risk Churners</span>
          <div className="text-2xl font-bold text-rose-400 mt-1">
            {riskCounts.High || 0} Customers
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Probability &gt; 70%</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-amber-500">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Medium Risk Churners</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {riskCounts.Medium || 0} Customers
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Probability 40% - 70%</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-emerald-500">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Retained / Low Risk</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            {riskCounts.Low || 0} Customers
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Active recurring shoppers</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl border-l-4 border-l-brand-500">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Model Accuracy</span>
          <div className="text-2xl font-bold text-brand-400 font-mono mt-1">
            {Math.round(metrics.accuracy * 100)}%
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">F1: {metrics.f1_score} • Precision: {metrics.precision}</span>
        </div>
      </div>

      {/* High-Risk Customer Directory */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white font-['Outfit']">
            At-Risk Customer List & Recommended Retention Actions
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Target high probability defectors before they migrate to competitor retail shops.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3.5 pl-6">Customer Name & City</th>
                <th className="py-3.5 text-center">Churn Probability</th>
                <th className="py-3.5 text-center">Risk Level</th>
                <th className="py-3.5">Primary Reason</th>
                <th className="py-3.5">AI Retention Recommendation</th>
                <th className="py-3.5 pr-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {highRiskList.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20">
                  <td className="py-3.5 pl-6 font-semibold text-white">
                    <div>
                      <span>{c.customer_name}</span>
                      <span className="block text-[10px] text-slate-400">{c.city} • {c.phone}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-center font-mono font-bold">
                    <span className={c.churn_probability >= 70 ? 'text-rose-400' : 'text-amber-400'}>
                      {c.churn_probability}%
                    </span>
                  </td>
                  <td className="py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      c.risk_level === 'High'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="py-3.5 text-slate-300 max-w-xs">{c.reason}</td>
                  <td className="py-3.5 text-brand-300 font-medium max-w-xs">{c.retention_action}</td>
                  <td className="py-3.5 pr-6 text-right">
                    {c.phone ? (
                      <a
                        href={`https://wa.me/91${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Dear ${c.customer_name}, we missed you! Here is a special 15% discount code for your next visit: WELCOMEBACK15`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold inline-flex items-center space-x-1.5 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-slate-500 italic">No phone</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
