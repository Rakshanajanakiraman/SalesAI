import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, Upload, RefreshCw, CheckCircle2,
  FileSpreadsheet, Sparkles, AlertCircle, ArrowRight, Check,
  UserPlus, PackagePlus, Users, Package, ShoppingBag, Layers, Search
} from 'lucide-react';
import api from '../services/api';
import { useData } from '../context/DataContext';
import AddCustomerModal from '../components/modals/AddCustomerModal';
import AddProductModal from '../components/modals/AddProductModal';

export default function DatasetsPage() {
  const { activeDataset, triggerRefresh, datasets, fetchDatasets, refreshTrigger } = useData();

  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');
  const [error, setError] = useState('');

  // Modals for adding Customer & Product to Dataset
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  // Dataset Content Explorer state
  const [explorerTab, setExplorerTab] = useState('products'); // 'products' | 'customers' | 'sales'
  const [records, setRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // CSV Upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState('');

  const requiredFields = [
    { key: "product_name", label: "Product Name *" },
    { key: "category", label: "Category" },
    { key: "cost_price", label: "Cost Price *" },
    { key: "selling_price", label: "Selling Price *" },
    { key: "gst_rate", label: "GST Tax Rate (%)" },
    { key: "initial_stock", label: "Initial Stock Quantity" }
  ];

  // Fetch live dataset records for explorer
  const fetchRecords = useCallback(async (tab) => {
    setRecordsLoading(true);
    try {
      const res = await api.get(`/datasets/records?record_type=${tab}&limit=60`);
      setRecords(res.data.records || []);
    } catch (err) {
      console.warn("Could not fetch dataset records:", err);
      setRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords(explorerTab);
  }, [explorerTab, refreshTrigger, fetchRecords]);

  const handleSeedSample = async () => {
    setSeeding(true);
    setSeedNotice('');
    setError('');
    try {
      const res = await api.post('/datasets/seed-sample');
      setSeedNotice("Sample Indian retail dataset re-seeded successfully! 40 products, 2,500 sales and AI models refreshed.");
      triggerRefresh();
      fetchDatasets();
      fetchRecords(explorerTab);
    } catch (err) {
      setError("Failed to load sample dataset.");
    } finally {
      setSeeding(false);
    }
  };

  const handleCsvSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setError('');

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post('/datasets/preview-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCsvPreview(res.data);

      const autoMap = {};
      const cols = res.data.headers || [];
      requiredFields.forEach(f => {
        const match = cols.find(c => c.toLowerCase().includes(f.key.toLowerCase()));
        if (match) autoMap[f.key] = match;
      });
      setMapping(autoMap);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not read CSV file.");
    }
  };

  const handleConfirmImport = async () => {
    if (!csvFile) return;
    setImporting(true);
    setError('');
    setImportNotice('');

    try {
      const formData = new FormData();
      formData.append("file", csvFile);
      formData.append("dataset_name", csvFile.name.replace(".csv", ""));
      formData.append("mapping_json", JSON.stringify(mapping));

      const res = await api.post('/datasets/confirm-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setImportNotice(`Imported ${res.data.rows_processed} transactions from CSV! Machine learning models re-trained.`);
      setCsvFile(null);
      setCsvPreview(null);
      triggerRefresh();
      fetchDatasets();
      fetchRecords(explorerTab);
    } catch (err) {
      setError(err.response?.data?.detail || "Import failed.");
    } finally {
      setImporting(false);
    }
  };

  // Filter records based on search query
  const filteredRecords = records.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (r.name && r.name.toLowerCase().includes(q)) return true;
    if (r.sku && r.sku.toLowerCase().includes(q)) return true;
    if (r.code && r.code.toLowerCase().includes(q)) return true;
    if (r.sale_number && r.sale_number.toLowerCase().includes(q)) return true;
    if (r.phone && r.phone.includes(q)) return true;
    return false;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Dataset & Data Ingestion Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Whatever customers or products you add are instantly saved in PostgreSQL and synced into the active AI dataset.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
            title="Add customer and sync directly into active dataset"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-400" />
            <span>+ Add Customer to Dataset</span>
          </button>

          <button
            onClick={() => setProductModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
            title="Add product and sync directly into active dataset"
          >
            <PackagePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Add Product to Dataset</span>
          </button>

          <button
            onClick={handleSeedSample}
            disabled={seeding}
            className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${seeding ? 'animate-spin' : ''}`} />
            <span>{seeding ? "Populating..." : "Reload Sample Dataset"}</span>
          </button>
        </div>
      </div>

      {seedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{seedNotice}</span>
        </div>
      )}

      {importNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{importNotice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Dataset Overview Banner with Live Sync Cards */}
      <div className="glass-panel p-6 rounded-3xl border border-brand-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current Operational Dataset</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold font-['Outfit'] text-white mt-1">
                {activeDataset?.name || "MarketMind AI Master Indian Dataset"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Every customer created, product catalogued, and POS transaction recorded is live-linked to this dataset. Machine learning pipelines and forecasting models continuously reference these records.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Total Rows</div>
              <div className="text-lg font-black text-brand-400 font-mono mt-0.5">
                {activeDataset?.row_count?.toLocaleString() || activeDataset?.stats?.total_items?.toLocaleString() || '2,540'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Customers</div>
              <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">
                {activeDataset?.stats?.total_customers?.toLocaleString() || '1,000+'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Products</div>
              <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
                {activeDataset?.stats?.total_products?.toLocaleString() || '40+'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400">Transactions</div>
              <div className="text-lg font-black text-indigo-400 font-mono mt-0.5">
                {activeDataset?.stats?.total_sales?.toLocaleString() || '2,500'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dataset Content Explorer */}
      <div className="glass-panel rounded-3xl p-6 space-y-5 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold font-['Outfit'] text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-400" />
              <span>Dataset Contents Explorer</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect stored customers, catalogue products, and transactions inside the active dataset.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter dataset items..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 space-x-2">
          <button
            onClick={() => setExplorerTab('products')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              explorerTab === 'products'
                ? 'border-brand-500 text-white bg-brand-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-cyan-400" />
            <span>Products in Dataset</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {activeDataset?.stats?.total_products || '40+'}
            </span>
          </button>

          <button
            onClick={() => setExplorerTab('customers')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              explorerTab === 'customers'
                ? 'border-brand-500 text-white bg-brand-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-brand-400" />
            <span>Customers in Dataset</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {activeDataset?.stats?.total_customers || '1,000+'}
            </span>
          </button>

          <button
            onClick={() => setExplorerTab('sales')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-all ${
              explorerTab === 'sales'
                ? 'border-brand-500 text-white bg-brand-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sales Transactions</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
              {activeDataset?.stats?.total_sales || '2,500'}
            </span>
          </button>
        </div>

        {/* Table Content */}
        {recordsLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3">
            <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <span>Retrieving records from dataset...</span>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No records found matching the query.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
            {explorerTab === 'products' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-4">SKU Code</th>
                    <th className="py-3">Product Name</th>
                    <th className="py-3">Category</th>
                    <th className="py-3 text-right">Cost Price</th>
                    <th className="py-3 text-right">Selling Price</th>
                    <th className="py-3 text-center">GST</th>
                    <th className="py-3 pr-4 text-right">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pl-4 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3 font-semibold text-white">{p.name}</td>
                      <td className="py-3 text-slate-300">{p.category}</td>
                      <td className="py-3 text-right font-mono text-slate-400">₹{p.cost_price?.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-right font-mono text-emerald-400 font-bold">₹{p.selling_price?.toLocaleString('en-IN')}</td>
                      <td className="py-3 text-center font-mono text-slate-400">{p.gst_rate}%</td>
                      <td className="py-3 pr-4 text-right font-semibold text-white">{p.stock} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {explorerTab === 'customers' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-4">Customer Code</th>
                    <th className="py-3">Full Name</th>
                    <th className="py-3">Phone</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Location</th>
                    <th className="py-3 pr-4 text-right">Segment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pl-4 font-mono text-brand-400 font-semibold">{c.code}</td>
                      <td className="py-3 font-semibold text-white">{c.name}</td>
                      <td className="py-3 text-slate-300 font-mono">{c.phone || "—"}</td>
                      <td className="py-3 text-slate-400">{c.email || "—"}</td>
                      <td className="py-3 text-slate-300">{c.city}, {c.state}</td>
                      <td className="py-3 pr-4 text-right">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {c.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {explorerTab === 'sales' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-400">
                    <th className="py-3 pl-4">Invoice #</th>
                    <th className="py-3">Sale Date</th>
                    <th className="py-3 text-center">Items</th>
                    <th className="py-3 text-center">Payment Mode</th>
                    <th className="py-3 pr-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRecords.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 pl-4 font-mono text-white font-semibold">{s.sale_number}</td>
                      <td className="py-3 text-slate-400">{s.sale_date?.slice(0, 10)}</td>
                      <td className="py-3 text-center text-slate-300">{s.items_count} items</td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 font-mono">
                          {s.payment_method}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-right font-bold font-mono text-emerald-400">
                        ₹{s.total_amount?.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* CSV Upload Section */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div>
          <h3 className="text-base font-bold font-['Outfit'] text-white flex items-center space-x-2">
            <Upload className="w-4 h-4 text-brand-400" />
            <span>Upload Custom Inventory CSV</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Import your real store inventory. Our system will map columns and automatically re-train demand forecasting and clustering models.
          </p>
        </div>

        <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-2xl p-8 text-center transition-colors">
          <input
            type="file"
            accept=".csv"
            onChange={handleCsvSelect}
            className="hidden"
            id="csv-file-input"
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-brand-400 flex items-center justify-center mx-auto">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-white">
                {csvFile ? csvFile.name : "Choose CSV file to upload"}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                CSV files up to 10MB supported
              </p>
            </div>
          </label>
        </div>

        {/* CSV Preview and Column Mapping */}
        {csvPreview && (
          <div className="space-y-5 pt-4 border-t border-slate-800 text-xs">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">
              Step 2: Map Columns from "{csvFile?.name}"
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {requiredFields.map(f => (
                <div key={f.key} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                  <label className="block text-slate-300 font-semibold mb-1.5">{f.label}</label>
                  <select
                    value={mapping[f.key] || ''}
                    onChange={(e) => setMapping({ ...mapping, [f.key]: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-brand-500 text-xs"
                  >
                    <option value="">-- Match CSV Column --</option>
                    {csvPreview.headers?.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="gradient-btn px-6 py-2.5 rounded-xl text-white font-semibold flex items-center space-x-2 disabled:opacity-50"
              >
                <span>{importing ? "Importing & Training AI..." : "Confirm & Import Dataset"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dataset Add Modals */}
      <AddCustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={() => {
          fetchRecords('customers');
          setExplorerTab('customers');
        }}
      />
      <AddProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSuccess={() => {
          fetchRecords('products');
          setExplorerTab('products');
        }}
      />
    </div>
  );
}
