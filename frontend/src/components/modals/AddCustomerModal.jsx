import React, { useState } from 'react';
import { X, UserPlus, Database, CheckCircle2, AlertCircle, Phone, Mail, MapPin, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useData } from '../../context/DataContext';

export default function AddCustomerModal({ isOpen, onClose, onSuccess }) {
  const { activeDataset, triggerRefresh, fetchDatasets } = useData();
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    customer_type: 'Retail',
    preferred_contact_method: 'WhatsApp',
    address: ''
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessNotice(null);

    try {
      const res = await api.post('/customers/', formData);
      const dsInfo = res.data.dataset || {};
      setSuccessNotice({
        name: res.data.full_name || formData.full_name,
        dsName: dsInfo.name || activeDataset?.name || 'MarketMind AI Dataset',
        rowCount: dsInfo.row_count || 'Updated'
      });
      triggerRefresh();
      fetchDatasets();

      if (onSuccess) {
        onSuccess(res.data);
      }

      // Close modal after brief celebratory feedback
      setTimeout(() => {
        setSuccessNotice(null);
        setFormData({
          full_name: '',
          phone: '',
          email: '',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          customer_type: 'Retail',
          preferred_contact_method: 'WhatsApp',
          address: ''
        });
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create customer. Please check the details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-3xl p-6 sm:p-7 border border-slate-700/80 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold font-['Outfit'] text-white">
              Add New Customer
            </h3>
            <p className="text-xs text-slate-400">
              Stores profile in database & registers entry into active dataset
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
              <div className="font-semibold text-white">Customer "{successNotice.name}" Added!</div>
              <div className="text-[11px] text-emerald-400">
                Stored in Postgres & dataset row count increased to {successNotice.rowCount}.
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
            <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Deepika Sundaram"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Mobile (+91) *</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="9845012345"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="deepika@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">State</label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Customer Type</label>
              <select
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="VIP Regular">VIP Regular</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Preferred Channel</label>
              <select
                value={formData.preferred_contact_method}
                onChange={(e) => setFormData({ ...formData, preferred_contact_method: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
              >
                <option value="WhatsApp">WhatsApp</option>
                <option value="SMS">SMS</option>
                <option value="Email">Email</option>
              </select>
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
