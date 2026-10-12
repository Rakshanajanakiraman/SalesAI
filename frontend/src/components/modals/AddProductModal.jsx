import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Database, CheckCircle2, AlertCircle, Tag, DollarSign, Layers } from 'lucide-react';
import api from '../../services/api';
import { useData } from '../../context/DataContext';

export default function AddProductModal({ isOpen, onClose, onSuccess }) {
  const { activeDataset, triggerRefresh, fetchDatasets } = useData();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category: 'Grocery & Staples',
    brand: '',
    cost_price: 150,
    selling_price: 220,
    gst_rate: 18,
    initial_stock: 30,
    reorder_level: 10
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.warn("Could not load categories:", err);
    }
  };

  if (!isOpen) return null;

  const cost = Number(formData.cost_price) || 0;
  const selling = Number(formData.selling_price) || 0;
  const profit = selling - cost;
  const marginPercent = selling > 0 ? ((profit / selling) * 100).toFixed(1) : '0';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessNotice(null);

    try {
      const payload = {
        product_name: formData.product_name,
        sku: formData.sku || undefined,
        category: formData.category,
        brand: formData.brand,
        cost_price: Number(formData.cost_price),
        purchase_price: Number(formData.cost_price),
        selling_price: Number(formData.selling_price),
        gst_rate: Number(formData.gst_rate),
        initial_stock: Number(formData.initial_stock),
        reorder_level: Number(formData.reorder_level)
      };

      const res = await api.post('/products/', payload);
      const dsInfo = res.data.dataset || {};
      setSuccessNotice({
        name: res.data.product_name || formData.product_name,
        dsName: dsInfo.name || activeDataset?.name || 'MarketMind AI Dataset',
        rowCount: dsInfo.row_count || 'Updated'
      });
      triggerRefresh();
      fetchDatasets();

      if (onSuccess) {
        onSuccess(res.data);
      }

      setTimeout(() => {
        setSuccessNotice(null);
        setFormData({
          product_name: '',
          sku: '',
          category: 'Grocery & Staples',
          brand: '',
          cost_price: 150,
          selling_price: 220,
          gst_rate: 18,
          initial_stock: 30,
          reorder_level: 10
        });
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-brand-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <PackagePlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-['Outfit'] text-white">
              Add New Product
            </h3>
            <p className="text-xs text-slate-400">
              Stores item in inventory catalogue & registers into active dataset
            </p>
          </div>
        </div>

        {/* Dataset Sync Notification Banner */}
        <div className="my-4 p-3 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-between text-xs text-brand-300">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="font-medium">
              Target Dataset: <strong className="text-white">{activeDataset?.name || "MarketMind AI Master Dataset"}</strong>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300">
            Auto-Sync
          </span>
        </div>

        {successNotice && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2.5 animate-in slide-in-from-top-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-semibold text-white">Product "{successNotice.name}" Added!</div>
              <div className="text-[11px] text-emerald-400">
                Saved to Postgres & dataset row count increased to {successNotice.rowCount}.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder="e.g. Fortune Sunlite Sunflower Oil 1L"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <option key={c.id || c.name} value={c.name}>{c.name}</option>
                  ))
                ) : (
                  <>
                    <option value="Grocery & Staples">Grocery & Staples</option>
                    <option value="Dairy & Beverages">Dairy & Beverages</option>
                    <option value="Personal Care & Hygiene">Personal Care & Hygiene</option>
                    <option value="Snacks & Packaged Food">Snacks & Packaged Food</option>
                    <option value="Home Cleaning">Home Cleaning</option>
                    <option value="Electronics">Electronics</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Brand Name</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Fortune, Amul, Tata"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">SKU Code</label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Auto-assigned if empty"
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">GST Tax Slab</label>
              <select
                value={formData.gst_rate}
                onChange={(e) => setFormData({ ...formData, gst_rate: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="0">0% (Staples / Exempt)</option>
                <option value="5">5% (Edible Oils, Sugar)</option>
                <option value="12">12% (Appliances, Stationery)</option>
                <option value="18">18% (Consumer Goods)</option>
                <option value="28">28% (Luxury)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Wholesale Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Retail Selling Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 font-mono"
              />
            </div>
          </div>

          {/* Dynamic Margin Indicator */}
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Unit Profit & Margin:</span>
            <div className="space-x-2">
              <span className="text-white font-mono font-bold">₹{profit.toFixed(2)}</span>
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                Number(marginPercent) >= 25 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
              }`}>
                {marginPercent}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Initial Stock Count</label>
              <input
                type="number"
                value={formData.initial_stock}
                onChange={(e) => setFormData({ ...formData, initial_stock: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Low-Stock Alert Level</label>
              <input
                type="number"
                value={formData.reorder_level}
                onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="gradient-btn px-5 py-2.5 rounded-xl text-white font-semibold flex items-center space-x-1.5 shadow-lg shadow-brand-600/30 disabled:opacity-50"
            >
              <span>{submitting ? "Saving & Syncing..." : "Save to Dataset & DB"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
