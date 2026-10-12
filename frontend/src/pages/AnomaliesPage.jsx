import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, ShieldAlert, Sparkles, RefreshCw, CheckCircle2,
  Clock, Check, X, Search, Filter, AlertCircle, HelpCircle,
  Eye, ArrowRight, Tag, ShoppingBag, Layers, Lock, ChevronDown
} from 'lucide-react';
import api from '../services/api';

export default function AnomaliesPage() {
  const [anomaliesData, setAnomaliesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'unresolved', 'resolved'
  const [search, setSearch] = useState('');
  const [selectedAnomaly, setSelectedAnomaly] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/anomalies');
      setAnomaliesData(res.data);
    } catch (err) {
      console.error("Anomalies error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolveModal = (anomaly) => {
    setSelectedAnomaly(anomaly);
    setResolutionNote('Reviewed and verified by store supervisor');
    setResolveModalOpen(true);
  };

  const handleConfirmResolve = async () => {
    if (!selectedAnomaly) return;
    setResolvingId(selectedAnomaly.id);
    try {
      await api.post(`/ml/anomalies/${selectedAnomaly.id}/resolve`);
      setAnomaliesData(prev => ({
        ...prev,
        anomalies: (prev?.anomalies || []).map(a =>
          a.id === selectedAnomaly.id
            ? { ...a, status: 'resolved', resolution_note: resolutionNote }
            : a
        )
      }));
      setResolveModalOpen(false);
      setSelectedAnomaly(null);
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setResolvingId(null);
    }
  };

  const anomaliesList = anomaliesData?.anomalies || [];
  const unresolvedCount = anomaliesList.filter(a => a.status === 'unresolved').length;
  const resolvedCount = anomaliesList.filter(a => a.status === 'resolved').length;

  // Categories present in data
  const categories = useMemo(() => {
    const set = new Set();
    anomaliesList.forEach(a => {
      if (a.category) set.add(a.category);
    });
    return Array.from(set);
  }, [anomaliesList]);

  // Filtered anomalies
  const filteredAnomalies = useMemo(() => {
    return anomaliesList.filter(a => {
      const matchesCategory = activeCategory === 'all' || a.category === activeCategory;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'unresolved' && a.status === 'unresolved') ||
        (statusFilter === 'resolved' && a.status === 'resolved');

      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        (a.title && a.title.toLowerCase().includes(q)) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        (a.record_id && a.record_id.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q));

      return matchesCategory && matchesStatus && matchesSearch;
    });
  }, [anomaliesList, activeCategory, statusFilter, search]);

  const getCategoryIcon = (category) => {
    if (!category) return ShieldCheck;
    const cat = category.toLowerCase();
    if (cat.includes('price') || cat.includes('margin')) return Tag;
    if (cat.includes('security') || cat.includes('compliance')) return Lock;
    if (cat.includes('inventory') || cat.includes('warehouse')) return Layers;
    return ShoppingBag;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Friendly Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 mb-1">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Store Security & Fraud Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Operational Integrity & Discrepancy Audits
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Automated AI scanning for unusual discounts, rapid checkout loops, and inventory shrinkage so you can protect your profits.
          </p>
        </div>

        <button
          onClick={fetchAnomalies}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Run Fresh Radar Scan</span>
        </button>
      </div>

      {/* Explanatory Guide Banner (Makes the page intuitive and educational) */}
      <div className="glass-panel p-4 sm:p-5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5 text-xs text-slate-200">
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0 mt-0.5">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm font-['Outfit']">
              How Does This Radar Protect Your Store?
            </h4>
            <p className="text-slate-300 mt-0.5 leading-relaxed">
              When cashiers or stock movements deviate significantly from your store's normal averages (such as a 45% manual discount or 40 items vanishing without a bill), our AI highlights it here. Review each alert, check the recommended action, and mark it resolved.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Metric Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AI Scanner Status</span>
          <div className="text-base font-bold text-emerald-400 mt-1 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Active & Guarding Store</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Multivariate Outlier Isolation</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Pending Supervisor Reviews</span>
          <div className="text-2xl font-extrabold text-amber-400 font-mono mt-1">
            {unresolvedCount} {unresolvedCount === 1 ? 'Notice' : 'Notices'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Awaiting manager verification</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Audit Resolution Rate</span>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono mt-1">
            {anomaliesList.length > 0 ? Math.round((resolvedCount / anomaliesList.length) * 100) : 100}%
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold mt-1 block">
            {resolvedCount} of {anomaliesList.length} investigations closed
          </span>
        </div>
      </div>

      {/* Interactive Controls & Filters */}
      <div className="glass-panel p-4 rounded-2xl space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                activeCategory === 'all'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Alerts ({anomaliesList.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  activeCategory === cat
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Segment Control */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('unresolved')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'unresolved' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Pending ({unresolvedCount})
            </button>
            <button
              onClick={() => setStatusFilter('resolved')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'resolved' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Resolved ({resolvedCount})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by issue title, transaction ID, product name, or keyword..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Anomalies List with Rich Context Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3 glass-panel rounded-3xl">
            <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Scanning transaction radar and cross-checking stock records...</span>
          </div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="glass-panel p-16 text-center text-slate-400 text-xs rounded-3xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-white">All Clear! No Discrepancies Found</div>
            <p className="text-slate-400 max-w-md mx-auto">
              Every checkout bill, cashier discount, and warehouse decrement conforms to expected retail standards.
            </p>
          </div>
        ) : (
          filteredAnomalies.map(a => {
            const isResolved = a.status === 'resolved';
            const Icon = getCategoryIcon(a.category);

            return (
              <div
                key={a.id}
                className={`p-6 rounded-3xl border transition-all duration-300 space-y-4 shadow-xl ${
                  isResolved
                    ? 'bg-slate-900/30 border-slate-800/40 opacity-75'
                    : a.severity === 'high'
                    ? 'bg-slate-900/80 border-amber-500/40 shadow-amber-500/5'
                    : 'bg-slate-900/80 border-cyan-500/30 shadow-cyan-500/5'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isResolved
                        ? 'bg-slate-800 text-slate-400'
                        : a.severity === 'high'
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="text-base font-bold text-white font-['Outfit']">
                          {a.title || `${a.record_type.toUpperCase()} Audit Notice`}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {a.category || "Store Operations"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          a.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {a.severity?.toUpperCase()} PRIORITY
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-2 font-mono">
                        <span>Ref ID: {a.record_id}</span>
                        <span>•</span>
                        <span>Deviation: {a.score_percentage || 85}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Resolution action button */}
                  <div className="self-end sm:self-auto shrink-0">
                    {isResolved ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center space-x-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Resolved & Verified</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenResolveModal(a)}
                        className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md shadow-brand-600/30"
                      >
                        <Check className="w-4 h-4" />
                        <span>Review & Resolve</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 3-Part Intuitive Breakdown: Detected vs Normal vs Impact */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 flex items-center space-x-1">
                      <span>⚡ What Was Detected</span>
                    </span>
                    <p className="text-slate-200 font-medium">
                      {a.detected_value || a.description}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center space-x-1">
                      <span>📏 Standard Baseline</span>
                    </span>
                    <p className="text-slate-300">
                      {a.expected_normal || "Standard historical store baseline"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center space-x-1">
                      <span>💼 Business Risk / Impact</span>
                    </span>
                    <p className="text-slate-300">
                      {a.business_impact || "Potential revenue leakage or policy violation"}
                    </p>
                  </div>
                </div>

                {/* Plain-English Recommended Action Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-start space-x-2.5 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-emerald-300 mr-1.5">Recommended Store Action:</span>
                    <span className="text-slate-200">
                      {a.recommended_action || "Audit transaction details and confirm supervisor authorization."}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Friendly Resolve Confirmation Modal */}
      {resolveModalOpen && selectedAnomaly && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Resolve Audit Notice
                </h3>
              </div>
              <button
                onClick={() => setResolveModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Flag Title:</span>
                <span className="font-bold text-white text-sm">{selectedAnomaly.title}</span>
              </div>

              <div>
                <span className="text-slate-400 block font-medium">Event Description:</span>
                <p className="text-slate-300 mt-0.5 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  {selectedAnomaly.description}
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Manager Resolution / Audit Notes:
                </label>
                <textarea
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  placeholder="e.g. Verified with cashier, customer receipt authorized by manager."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setResolveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-300 hover:text-white font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                disabled={resolvingId === selectedAnomaly.id}
                className="gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-brand-600/30 flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{resolvingId === selectedAnomaly.id ? "Saving..." : "Confirm & Close Flag"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
