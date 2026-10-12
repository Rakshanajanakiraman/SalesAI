import React, { useState, useEffect } from 'react';
import {
  Layers, AlertTriangle, CheckCircle2, Plus, Minus,
  RefreshCw, Search, Bell, X, Check, ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useData } from '../context/DataContext';

export default function InventoryPage() {
  const { triggerRefresh } = useData();

  const [inventory, setInventory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'alerts'

  // Adjust stock modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [adjustQty, setAdjustQty] = useState(10);
  const [adjustReason, setAdjustReason] = useState('supplier_restock');
  const [adjustNotes, setAdjustNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [invRes, alertRes] = await Promise.all([
        api.get('/inventory/'),
        api.get('/inventory/alerts')
      ]);
      setInventory(invRes.data || []);
      setAlerts(alertRes.data || []);
    } catch (err) {
      console.error("Inventory error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;
    setAdjusting(true);
    try {
      await api.post('/inventory/adjust', {
        product_id: selectedItem.product_id,
        quantity_change: Number(adjustQty),
        reason: adjustReason,
        notes: adjustNotes
      });
      setModalOpen(false);
      setSelectedItem(null);
      triggerRefresh();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to adjust stock.");
    } finally {
      setAdjusting(false);
    }
  };

  const markAlertRead = async (alertId) => {
    try {
      await api.post(`/inventory/alerts/${alertId}/read`);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_read: true } : a));
      triggerRefresh();
    } catch (err) {
      console.error("Mark alert read error:", err);
    }
  };

  const filteredInventory = inventory.filter(item => {
    const q = search.toLowerCase();
    return item.product_name.toLowerCase().includes(q) ||
           item.sku.toLowerCase().includes(q) ||
           item.category.toLowerCase().includes(q);
  });

  const lowStockCount = inventory.filter(i => i.is_low_stock).length;
  const unreadAlertsCount = alerts.filter(a => !a.is_read).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Inventory Tracking & Stock Alerts
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time warehouse stock balances, reorder trigger alerts, and inventory movement logs.
          </p>
        </div>

        <button
          onClick={() => {
            if (inventory.length > 0) setSelectedItem(inventory[0]);
            setModalOpen(true);
          }}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Restock / Stock Adjustment</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'inventory'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Warehouse Stock ({inventory.length})</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {lowStockCount} low
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all ${
            activeTab === 'alerts'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Stock Alerts ({alerts.length})</span>
          {unreadAlertsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">
              {unreadAlertsCount} unread
            </span>
          )}
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Search bar */}
          <div className="glass-panel p-3.5 rounded-2xl">
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stock by SKU, product name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Stock Table */}
          <div className="glass-panel rounded-3xl overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading inventory status...</span>
              </div>
            ) : filteredInventory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No inventory records found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-400">
                      <th className="py-3.5 pl-6">Product & SKU</th>
                      <th className="py-3.5">Category</th>
                      <th className="py-3.5">Warehouse Bin</th>
                      <th className="py-3.5 text-center">Reorder Threshold</th>
                      <th className="py-3.5 text-center">Current Stock</th>
                      <th className="py-3.5 text-center">Health Status</th>
                      <th className="py-3.5 pr-6 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredInventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 pl-6 font-medium text-white">
                          <div>
                            <span className="font-semibold">{item.product_name}</span>
                            <span className="block text-[10px] text-slate-400 font-mono">{item.sku}</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-300">{item.category}</td>
                        <td className="py-3.5 text-slate-400 font-mono text-[11px]">{item.warehouse_location || "Shelf A-1"}</td>
                        <td className="py-3.5 text-center text-slate-400">{item.reorder_level} units</td>
                        <td className="py-3.5 text-center font-bold font-mono text-white text-sm">
                          {item.current_stock}
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center space-x-1 ${
                            item.is_low_stock
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {item.is_low_stock && <AlertTriangle className="w-3 h-3 mr-0.5" />}
                            <span>{item.is_low_stock ? "Low Stock" : "Healthy"}</span>
                          </span>
                        </td>
                        <td className="py-3.5 pr-6 text-right">
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Alerts View */
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="glass-panel p-12 text-center text-slate-400 text-xs rounded-3xl">
              No inventory alerts at this time. All stock levels are sufficient.
            </div>
          ) : (
            alerts.map(a => (
              <div
                key={a.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  a.is_read
                    ? 'bg-slate-900/60 border-slate-800/60 text-slate-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-200 shadow-md shadow-rose-950/20'
                }`}
              >
                <div className="flex items-start space-x-3 text-xs">
                  <div className={`p-2 rounded-xl mt-0.5 ${a.is_read ? 'bg-slate-800 text-slate-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">{a.product_name}</div>
                    <p className="mt-0.5">{a.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Triggered: {new Date(a.created_at).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {!a.is_read && (
                  <button
                    onClick={() => markAlertRead(a.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Mark as Read</span>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-['Outfit'] text-white mb-1">
              Adjust Stock Quantity
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Apply stock restock (+) or inventory audit deduction (-).
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Product</label>
                <select
                  value={selectedItem?.product_id || ''}
                  onChange={(e) => {
                    const found = inventory.find(i => i.product_id === e.target.value);
                    setSelectedItem(found);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                >
                  {inventory.map(i => (
                    <option key={i.product_id} value={i.product_id}>
                      {i.product_name} (Current: {i.current_stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Quantity Change (+ / -)</label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. +20 or -5"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Positive number adds stock, negative reduces stock.
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="supplier_restock">Supplier Restock Inflow</option>
                  <option value="damaged_goods">Damaged / Expired Goods</option>
                  <option value="audit_correction">Audit Physical Stock Discrepancy</option>
                  <option value="customer_return">Customer Return</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Internal Reference Notes</label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Supplier PO #4092 received from Bengaluru hub"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-brand-500"
                />
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
                  disabled={adjusting}
                  className="gradient-btn px-5 py-2.5 rounded-xl text-white font-semibold"
                >
                  {adjusting ? "Updating..." : "Commit Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
