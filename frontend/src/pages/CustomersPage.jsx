import React, { useState, useEffect } from 'react';
import {
  Users, Search, Plus, Filter, Phone, Mail, MapPin,
  Calendar, ShoppingBag, Eye, X, MessageSquare, Check, Sparkles
} from 'lucide-react';
import api from '../services/api';
import AddCustomerModal from '../components/modals/AddCustomerModal';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Add customer modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
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

  // Customer Detail Drawer state
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search, selectedCity, selectedType]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers/', {
        params: {
          q: search || undefined,
          city: selectedCity || undefined,
          customer_type: selectedType || undefined,
          limit: 50
        }
      });
      setCustomers(res.data.customers || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Fetch customers error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/customers/', newCustomer);
      setModalOpen(false);
      setNewCustomer({
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
      fetchCustomers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create customer.");
    } finally {
      setSubmitting(false);
    }
  };

  const viewCustomer = async (customerId) => {
    setLoadingDetail(true);
    setDetailOpen(true);
    try {
      const res = await api.get(`/customers/${customerId}`);
      setSelectedDetail(res.data);
    } catch (err) {
      console.error("Fetch customer detail error:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Customer Directory & Demographics
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {total} registered retail and wholesale customers across Indian cities.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 w-1/2 md:w-auto"
          >
            <option value="">All Indian Cities</option>
            <option value="Bengaluru">Bengaluru</option>
            <option value="Chennai">Chennai</option>
            <option value="Hyderabad">Hyderabad</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Pune">Pune</option>
            <option value="Delhi NCR">Delhi NCR</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Madurai">Madurai</option>
            <option value="Kochi">Kochi</option>
            <option value="Ahmedabad">Ahmedabad</option>
            <option value="Kolkata">Kolkata</option>
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 w-1/2 md:w-auto"
          >
            <option value="">All Customer Types</option>
            <option value="Retail">Retail</option>
            <option value="Wholesale">Wholesale</option>
            <option value="VIP Regular">VIP Regular</option>
          </select>
        </div>
      </div>

      {/* Customer List Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading customer data...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No customers match the current filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 pl-6">Customer Code & Name</th>
                  <th className="py-3.5">Contact Details</th>
                  <th className="py-3.5">City & State</th>
                  <th className="py-3.5">Type</th>
                  <th className="py-3.5">Channel</th>
                  <th className="py-3.5 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 pl-6 font-medium text-white">
                      <div>
                        <span className="font-semibold">{c.full_name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">{c.customer_code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-300">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-1.5 text-slate-300">
                          <Phone className="w-3 h-3 text-brand-400" />
                          <span>{c.phone || "—"}</span>
                        </div>
                        {c.email && (
                          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-300">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.city}, {c.state}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{c.pincode}</span>
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        c.customer_type === 'VIP Regular'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : c.customer_type === 'Wholesale'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {c.customer_type}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-400">
                      <span className="text-emerald-400 font-medium">{c.preferred_contact_method || 'WhatsApp'}</span>
                    </td>
                    <td className="py-3.5 pr-6 text-right">
                      <button
                        onClick={() => viewCustomer(c.id)}
                        className="p-1.5 text-slate-300 hover:text-brand-400 hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center space-x-1 text-xs"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Customer Modal with Active Dataset Sync */}
      <AddCustomerModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchCustomers}
      />

      {/* Customer Detail Drawer */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md h-full p-6 border-l border-slate-800 overflow-y-auto relative animate-in slide-in-from-right">
            <button
              onClick={() => setDetailOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingDetail || !selectedDetail ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading customer profile...</span>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                <div>
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-mono text-[10px]">
                    {selectedDetail.customer.customer_code}
                  </span>
                  <h2 className="text-xl font-bold font-['Outfit'] text-white mt-1">
                    {selectedDetail.customer.full_name}
                  </h2>
                  <div className="text-slate-400 mt-1 flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedDetail.customer.city}, {selectedDetail.customer.state} ({selectedDetail.customer.pincode})</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">Lifetime Spend</span>
                    <div className="text-lg font-bold text-white mt-1">
                      ₹{selectedDetail.metrics.total_spent.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">Total Orders</span>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      {selectedDetail.metrics.order_count}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Action */}
                {selectedDetail.customer.phone && (
                  <a
                    href={`https://wa.me/91${selectedDetail.customer.phone.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(selectedDetail.customer.full_name)},%20greetings%20from%20our%20store!`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Send WhatsApp Engagement</span>
                  </a>
                )}

                {/* Sales History */}
                <div>
                  <h4 className="font-bold text-white uppercase text-[11px] tracking-wider mb-3">
                    Recent Purchase History
                  </h4>
                  {selectedDetail.sales_history.length === 0 ? (
                    <p className="text-slate-500 italic">No recorded purchases yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedDetail.sales_history.map((s) => (
                        <div key={s.id} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-white">{s.sale_number}</div>
                            <div className="text-[10px] text-slate-400">{s.sale_date} • {s.payment_method}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-400">₹{s.total_amount.toLocaleString('en-IN')}</div>
                            <div className="text-[10px] text-slate-500">{s.items_count} items</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
