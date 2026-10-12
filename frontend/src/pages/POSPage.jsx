import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Search, Plus, Minus, Trash2, User,
  CheckCircle2, Printer, CreditCard, Smartphone, Banknote,
  Sparkles, X, AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useData } from '../context/DataContext';

export default function POSPage() {
  const { triggerRefresh } = useData();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSuggestions, setCustomerSuggestions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Cart
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Completed Invoice Modal
  const [completedSale, setCompletedSale] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchDefaultCustomer();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/', { params: { limit: 100 } });
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("POS load error:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories');
      setCategories(res.data || []);
    } catch (err) {}
  };

  const fetchDefaultCustomer = async () => {
    try {
      const res = await api.get('/customers/', { params: { limit: 1 } });
      if (res.data.customers?.length > 0) {
        setSelectedCustomer(res.data.customers[0]);
      }
    } catch (err) {}
  };

  // Search customers autocomplete
  useEffect(() => {
    if (customerSearch.trim().length > 0) {
      const timeout = setTimeout(async () => {
        try {
          const res = await api.get('/customers/suggestions', { params: { q: customerSearch } });
          setCustomerSuggestions(res.data || []);
          setShowSuggestions(true);
        } catch (err) {}
      }, 250);
      return () => clearTimeout(timeout);
    } else {
      setCustomerSuggestions([]);
      setShowSuggestions(false);
    }
  }, [customerSearch]);

  const addToCart = (product) => {
    if (product.current_stock <= 0) {
      alert("Product is currently out of stock!");
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.current_stock) {
          alert(`Cannot add more. Current inventory stock is ${product.current_stock}.`);
          return prev;
        }
        return prev.map(item =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, {
          product_id: product.id,
          product_name: product.product_name,
          sku: product.sku,
          price: Number(product.selling_price),
          gst_rate: Number(product.gst_rate),
          quantity: 1,
          discount_percent: 0,
          current_stock: product.current_stock
        }];
      }
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > item.current_stock) {
            alert(`Only ${item.current_stock} items available in stock.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => {
    const discountedPrice = item.price * (1 - item.discount_percent / 100);
    return acc + (discountedPrice * item.quantity);
  }, 0);

  const totalGst = cart.reduce((acc, item) => {
    const discountedPrice = item.price * (1 - item.discount_percent / 100);
    const lineSubtotal = discountedPrice * item.quantity;
    return acc + (lineSubtotal * (item.gst_rate / 100));
  }, 0);

  const grandTotal = subtotal + totalGst;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Please add at least one product to cart.");
      return;
    }
    if (!selectedCustomer) {
      setError("Please select a customer for billing.");
      return;
    }

    setError('');
    setProcessing(true);

    try {
      const payload = {
        customer_id: selectedCustomer.id,
        payment_method: paymentMethod,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          discount_percent: item.discount_percent
        }))
      };

      const res = await api.post('/sales/', payload);

      // Trigger Confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {}

      setCompletedSale(res.data);
      setInvoiceModalOpen(true);
      setCart([]);
      triggerRefresh();
      fetchProducts(); // Refresh stock counts
    } catch (err) {
      setError(err.response?.data?.detail || "Checkout transaction could not be completed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Point of Sale & Smart Checkout
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Express counter billing with instant GST tax invoices and stock synchronization.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Product Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="glass-panel p-3.5 rounded-2xl flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan barcode or type product name, SKU..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-brand-500"
            >
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          {/* Product Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredProducts.map(p => {
              const inStock = p.current_stock > 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  disabled={!inStock}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                    inStock
                      ? 'glass-panel hover:border-brand-500/50 hover:bg-slate-800/40 cursor-pointer active:scale-95'
                      : 'bg-slate-900/30 border-slate-800/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block truncate">
                      {p.category}
                    </span>
                    <h4 className="text-xs font-bold text-white line-clamp-2 mt-0.5" title={p.product_name}>
                      {p.product_name}
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{p.sku}</span>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-extrabold text-white">
                        ₹{Number(p.selling_price).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[9px] text-slate-400">GST {p.gst_rate}%</span>
                    </div>

                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      p.current_stock <= p.reorder_level
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {p.current_stock} left
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Cart, Customer & Checkout (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-3xl space-y-5">
          {/* Customer Selection Box */}
          <div className="relative">
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Customer Details</span>
              <span className="text-[10px] text-brand-400 lowercase">autocomplete search</span>
            </label>

            {selectedCustomer ? (
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-brand-400" />
                    <span>{selectedCustomer.full_name || selectedCustomer.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {selectedCustomer.phone} • {selectedCustomer.city || 'India'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="text-[11px] text-slate-400 hover:text-rose-400"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search Indian customer name or phone..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                />
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-slate-800">
                    {customerSuggestions.map(s => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(s);
                          setShowSuggestions(false);
                          setCustomerSearch('');
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-800 text-xs transition-colors flex items-center justify-between"
                      >
                        <div>
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.phone} • {s.city}</div>
                        </div>
                        <span className="text-[10px] text-brand-400">Select</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Items List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                Cart Items ({cart.length})
              </span>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[11px] text-rose-400 hover:text-rose-300"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                Your cart is empty. Click on products to add items.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.product_id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                    <div className="truncate max-w-[160px]">
                      <div className="font-semibold text-white truncate">{item.product_name}</div>
                      <div className="text-[10px] text-slate-400">
                        ₹{item.price} each (GST {item.gst_rate}%)
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5 bg-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product_id, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product_id, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'UPI', label: 'UPI / QR', icon: Smartphone },
                { id: 'Cash', label: 'Cash', icon: Banknote },
                { id: 'Card', label: 'Card', icon: CreditCard },
              ].map(method => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                      isSelected
                        ? 'bg-brand-600 border-brand-500 text-white shadow-md shadow-brand-600/30'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Taxable Subtotal</span>
              <span className="font-mono">₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>CGST + SGST (Dual GST)</span>
              <span className="font-mono">₹{totalGst.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex justify-between text-white font-extrabold text-sm">
              <span>Grand Total</span>
              <span className="text-brand-400 font-mono text-base">₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={processing || cart.length === 0}
            className="w-full gradient-btn text-white py-3.5 rounded-xl font-bold text-sm shadow-xl shadow-brand-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {processing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Complete Billing (₹{grandTotal.toFixed(2)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tax Invoice Modal */}
      {invoiceModalOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl relative text-xs">
            <button
              onClick={() => setInvoiceModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-['Outfit'] text-white">
                Tax Invoice Generated
              </h3>
              <p className="text-[11px] text-slate-400">
                Invoice #{completedSale.invoice_number} • {completedSale.payment_method}
              </p>
            </div>

            <div className="py-4 space-y-2 border-b border-slate-800">
              <div className="flex justify-between text-slate-400">
                <span>Customer:</span>
                <span className="text-white font-semibold">{selectedCustomer?.full_name || selectedCustomer?.name}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Sale Reference:</span>
                <span className="text-white font-mono">{completedSale.sale_number}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Payment Mode:</span>
                <span className="text-emerald-400 font-semibold">{completedSale.payment_method}</span>
              </div>
            </div>

            <div className="py-4 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span>₹{Number(completedSale.total_amount - completedSale.gst_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST Breakdown:</span>
                <span>₹{Number(completedSale.gst_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-white font-bold text-sm pt-2 border-t border-slate-800">
                <span>Amount Paid:</span>
                <span className="text-brand-400 font-mono">₹{Number(completedSale.total_amount).toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 flex space-x-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print GST Receipt</span>
              </button>
              <button
                onClick={() => setInvoiceModalOpen(false)}
                className="flex-1 gradient-btn py-2.5 px-4 rounded-xl text-white font-semibold"
              >
                Start Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
