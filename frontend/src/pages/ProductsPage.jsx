import React, { useState, useEffect } from 'react';
import {
  Package, Search, Plus, Filter, Tag, Layers,
  AlertTriangle, DollarSign, X, Check, ArrowUpDown
} from 'lucide-react';
import api from '../services/api';
import AddProductModal from '../components/modals/AddProductModal';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');

  // Add Product modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    product_name: '',
    sku: '',
    category_id: '',
    brand: '',
    cost_price: 100,
    selling_price: 150,
    gst_rate: 18,
    initial_stock: 25,
    reorder_level: 10
  });

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [search, selectedCat]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error("Categories fetch error:", err);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/', {
        params: {
          q: search || undefined,
          category: selectedCat || undefined,
          limit: 60
        }
      });
      setProducts(res.data.products || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error("Fetch products error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/products/', newProduct);
      setModalOpen(false);
      setNewProduct({
        product_name: '',
        sku: '',
        category_id: '',
        brand: '',
        cost_price: 100,
        selling_price: 150,
        gst_rate: 18,
        initial_stock: 25,
        reorder_level: 10
      });
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Product Catalogue & Margins
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {total} items tracked with GST compliance, wholesale costing, and retail prices.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
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
            placeholder="Search products by title, SKU, brand..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500 w-full md:w-auto"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product List Table */}
      <div className="glass-panel rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading product catalogue...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No products found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 pl-6">Product & SKU</th>
                  <th className="py-3.5">Category & Brand</th>
                  <th className="py-3.5 text-right">Cost Price</th>
                  <th className="py-3.5 text-right">Selling Price</th>
                  <th className="py-3.5 text-center">GST Rate</th>
                  <th className="py-3.5 text-right">Gross Margin</th>
                  <th className="py-3.5 pr-6 text-right">In Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {products.map((p) => {
                  const cost = Number(p.cost_price);
                  const price = Number(p.selling_price);
                  const margin = price > 0 ? (((price - cost) / price) * 100).toFixed(1) : '0';
                  const isLow = p.current_stock <= p.reorder_level;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 pl-6 font-medium text-white">
                        <div>
                          <span className="font-semibold">{p.product_name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{p.sku}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-300">
                        <div>
                          <span>{p.category}</span>
                          {p.brand && <span className="block text-[10px] text-slate-500">{p.brand}</span>}
                        </div>
                      </td>
                      <td className="py-3.5 text-right text-slate-400 font-mono">
                        ₹{cost.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-right text-white font-bold font-mono">
                        ₹{price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-semibold">
                          {p.gst_rate}%
                        </span>
                      </td>
                      <td className="py-3.5 text-right font-semibold">
                        <span className={Number(margin) >= 30 ? 'text-emerald-400' : 'text-amber-400'}>
                          {margin}%
                        </span>
                      </td>
                      <td className="py-3.5 pr-6 text-right font-semibold">
                        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] ${
                          isLow
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold'
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3 mr-0.5" />}
                          <span>{p.current_stock} units</span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal with Active Dataset Sync */}
      <AddProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
