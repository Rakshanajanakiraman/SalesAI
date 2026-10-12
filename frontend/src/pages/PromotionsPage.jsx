import React, { useState, useEffect } from 'react';
import {
  Tag, Plus, Trash2, Calendar, CheckCircle2,
  Clock, X, Sparkles, Filter, AlertCircle
} from 'lucide-react';
import api from '../services/api';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newPromo, setNewPromo] = useState({
    title: '',
    description: '',
    category: 'Mobile Accessories',
    discount_percent: 15,
    target_segment: 'All Customers',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'Active'
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/promotions/');
      setPromotions(res.data || []);
    } catch (err) {
      console.error("Promotions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/promotions/', newPromo);
      setModalOpen(false);
      setNewPromo({
        title: '',
        description: '',
        category: 'Mobile Accessories',
        discount_percent: 15,
        target_segment: 'All Customers',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'Active'
      });
      fetchPromotions();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create promotion.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (promo) => {
    const nextStatus = promo.status === 'Active' ? 'Expired' : 'Active';
    try {
      await api.put(`/promotions/${promo.id}/status`, { status: nextStatus });
      setPromotions(prev => prev.map(p => p.id === promo.id ? { ...p, status: nextStatus } : p));
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to remove this promotion?")) return;
    try {
      await api.delete(`/promotions/${id}`);
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Promotions & Marketing Campaigns
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Segmented promotional campaigns, discount coupons, and festive sales.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Promotion</span>
        </button>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3 glass-panel rounded-3xl">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading active campaigns...</span>
          </div>
        ) : promotions.length === 0 ? (
          <div className="col-span-full glass-panel p-12 text-center text-slate-400 text-xs rounded-3xl">
            No promotions active. Click "Launch Promotion" to create your first discount campaign.
          </div>
        ) : (
          promotions.map(p => {
            const isActive = p.status === 'Active';

            return (
              <div
                key={p.id}
                className="glass-panel p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-brand-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {p.status}
                    </span>
                    <span className="text-base font-extrabold text-brand-400 font-mono">
                      {p.discount_percent}% OFF
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white font-['Outfit']">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {p.description}
                  </p>

                  <div className="mt-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Target Audience:</span>
                      <span className="text-white font-semibold">{p.target_segment}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Category:</span>
                      <span className="text-slate-300">{p.category}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Validity:</span>
                      <span className="text-slate-300">{p.start_date} to {p.end_date}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => toggleStatus(p)}
                    className="text-slate-400 hover:text-white font-medium"
                  >
                    {isActive ? "Pause Campaign" : "Activate"}
                  </button>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    title="Delete promotion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Promotion Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl relative text-xs">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-['Outfit'] text-white mb-1">
              Launch Promotional Campaign
            </h3>
            <p className="text-slate-400 mb-5">
              Set discount rates, product categories, and target segments.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  value={newPromo.title}
                  onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                  placeholder="e.g. Diwali Electronics Mega Sale"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Offer Description</label>
                <input
                  type="text"
                  value={newPromo.description}
                  onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
                  placeholder="e.g. Flat 15% discount on all boAt and OnePlus audio"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Discount (%) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={newPromo.discount_percent}
                    onChange={(e) => setNewPromo({ ...newPromo, discount_percent: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target Segment</label>
                  <select
                    value={newPromo.target_segment}
                    onChange={(e) => setNewPromo({ ...newPromo, target_segment: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="All Customers">All Customers</option>
                    <option value="High-Value Champions">High-Value Champions</option>
                    <option value="Loyal Customers">Loyal Customers</option>
                    <option value="At Risk Customers">At Risk Customers</option>
                    <option value="Occasional Shoppers">Occasional Shoppers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newPromo.start_date}
                    onChange={(e) => setNewPromo({ ...newPromo, start_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={newPromo.end_date}
                    onChange={(e) => setNewPromo({ ...newPromo, end_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="gradient-btn px-5 py-2.5 rounded-xl text-white font-semibold"
                >
                  {submitting ? "Launching..." : "Launch Campaign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
