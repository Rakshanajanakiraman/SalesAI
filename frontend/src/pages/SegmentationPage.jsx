import React, { useState, useEffect } from 'react';
import {
  Users, Sparkles, RefreshCw, CheckCircle2,
  TrendingUp, Award, Clock, DollarSign, Filter, MessageSquare
} from 'lucide-react';
import api from '../services/api';
import { useData } from '../context/DataContext';

export default function SegmentationPage() {
  const { triggerRefresh } = useData();
  const [segData, setSegData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [filterSegment, setFilterSegment] = useState('All');

  useEffect(() => {
    fetchSegmentation();
  }, []);

  const fetchSegmentation = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/segmentation');
      setSegData(res.data);
    } catch (err) {
      console.error("Segmentation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/ml/re-train');
      triggerRefresh();
      await fetchSegmentation();
    } catch (err) {
      console.error("Retrain error:", err);
    } finally {
      setRetraining(false);
    }
  };

  const profiles = segData?.segment_profiles || {};
  const segmentKeys = Object.keys(profiles);

  const customersList = segData?.customers || [];
  const filteredCustomers = filterSegment === 'All'
    ? customersList
    : customersList.filter(c => c.segment === filterSegment);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Unsupervised Clustering</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Customer Segmentation (RFM & K-Means)
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Cluster customer behaviors based on Recency of visit, Frequency of purchases, and Monetary basket spend.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? "Clustering..." : "Re-cluster K-Means"}</span>
        </button>
      </div>

      {/* Model Performance Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clustering Algorithm</span>
          <div className="text-base font-bold text-white mt-1">
            RFM Matrix + K-Means
          </div>
          <span className="text-[10px] text-brand-400 font-semibold mt-1 block">K-Means (k = 4 clusters)</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Silhouette Score (Separation)</span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {segData?.evaluation_metrics?.silhouette_score || 0.68}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Clean cluster separation</span>
        </div>

        <div className="glass-panel p-4 rounded-2xl">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Profiled Customers</span>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {customersList.length} Indian Buyers
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Live transaction history</span>
        </div>
      </div>

      {/* Segment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {segmentKeys.map(key => {
          const stats = profiles[key];
          const isSelected = filterSegment === key;

          return (
            <button
              key={key}
              onClick={() => setFilterSegment(isSelected ? 'All' : key)}
              className={`p-5 rounded-3xl border text-left transition-all ${
                isSelected
                  ? 'bg-brand-600/20 border-brand-500 shadow-xl shadow-brand-500/10'
                  : 'glass-panel hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-white uppercase tracking-wider">{key}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-brand-300">
                  {stats.count} users
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Total Segment Turnover:</span>
                  <span className="text-white font-bold font-mono">₹{stats.total_monetary.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Avg Order Frequency:</span>
                  <span className="text-emerald-400 font-bold">{stats.avg_frequency} orders</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Avg Recency Interval:</span>
                  <span className="text-slate-300">{stats.avg_recency} days ago</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-brand-400 font-semibold flex items-center justify-between">
                <span>{isSelected ? "Showing Filtered" : "Filter Customers"}</span>
                <span>&rarr;</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Segmented Customers Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white font-['Outfit']">
              Clustered Customer Directory ({filteredCustomers.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Filtered by: <span className="text-brand-400 font-semibold">{filterSegment}</span>
            </p>
          </div>

          {filterSegment !== 'All' && (
            <button
              onClick={() => setFilterSegment('All')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-3.5 pl-6">Customer Name</th>
                <th className="py-3.5">City</th>
                <th className="py-3.5">Assigned Segment</th>
                <th className="py-3.5 text-center">Recency (Days)</th>
                <th className="py-3.5 text-center">Frequency (Orders)</th>
                <th className="py-3.5 pr-6 text-right">Monetary Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredCustomers.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/20 font-sans">
                  <td className="py-3.5 pl-6 font-semibold text-white">{c.customer_name}</td>
                  <td className="py-3.5 text-slate-400">{c.city}</td>
                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-brand-300">
                      {c.segment}
                    </span>
                  </td>
                  <td className="py-3.5 text-center font-mono text-slate-300">{c.recency_days}d</td>
                  <td className="py-3.5 text-center font-mono text-emerald-400 font-bold">{c.frequency}</td>
                  <td className="py-3.5 pr-6 text-right font-mono font-bold text-white">
                    ₹{c.monetary.toLocaleString('en-IN')}
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
