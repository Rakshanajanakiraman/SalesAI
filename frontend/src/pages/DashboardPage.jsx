import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, ShoppingBag, Users, AlertTriangle, ArrowUpRight,
  Package, DollarSign, Sparkles, RefreshCw, CheckCircle2,
  ChevronRight, BarChart3, PieChart, Activity, Layers,
  CreditCard, Search, ArrowUpDown, Filter, Zap, Clock, Smartphone,
  UserPlus, PackagePlus, Database
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import confetti from 'canvas-confetti';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import AddCustomerModal from '../components/modals/AddCustomerModal';
import AddProductModal from '../components/modals/AddProductModal';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeDataset, triggerRefresh } = useData();
  const navigate = useNavigate();

  // Interactive filters
  const [timeframe, setTimeframe] = useState('1y'); // '7d' | '30d' | '90d' | '1y'
  const [activeMetric, setActiveMetric] = useState('revenue'); // 'revenue' | 'orders' | 'aov' | 'profit'
  const [barMetric, setBarMetric] = useState('revenue'); // 'revenue' | 'units'
  const [searchProduct, setSearchProduct] = useState('');
  const [sortProductBy, setSortProductBy] = useState('units'); // 'units' | 'revenue'

  // Data state
  const [kpis, setKpis] = useState(null);
  const [salesTrend, setSalesTrend] = useState(null);
  const [categoryDist, setCategoryDist] = useState(null);
  const [paymentDist, setPaymentDist] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interactive Action states
  const [retraining, setRetraining] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe, activeDataset]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [kpiRes, trendRes, catRes, payRes, topRes] = await Promise.all([
        api.get('/analytics/dashboard-kpis', { params: { timeframe } }),
        api.get('/analytics/sales-trend', { params: { timeframe } }),
        api.get('/analytics/category-distribution'),
        api.get('/analytics/payment-distribution'),
        api.get('/analytics/top-products')
      ]);

      setKpis(kpiRes.data);
      setSalesTrend(trendRes.data);
      setCategoryDist(catRes.data);
      setPaymentDist(payRes.data);
      setTopProducts(topRes.data || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Interactive: Simulate 5 real-time POS sales
  const handleSimulateSales = async () => {
    setSimulating(true);
    try {
      const res = await api.post('/analytics/simulate-sales');
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      setActionNotice({
        type: 'success',
        text: `Simulated 5 live counter transactions! Stock deducted and revenue updated in real time.`
      });
      triggerRefresh();
      await fetchDashboardData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      console.error("Simulate sales error:", err);
    } finally {
      setSimulating(false);
    }
  };

  // Interactive: Re-train AI pipelines
  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/ml/re-train');
      setActionNotice({
        type: 'success',
        text: "K-Means Customer Clusters, 30-Day Prophet Forecaster, and Churn Risk Models re-trained successfully!"
      });
      triggerRefresh();
      await fetchDashboardData();
      setTimeout(() => setActionNotice(null), 5000);
    } catch (err) {
      console.error("Retrain error:", err);
    } finally {
      setRetraining(false);
    }
  };

  // Chart 1: Interactive Line Chart Configuration
  const trendChartData = useMemo(() => {
    const labels = salesTrend?.labels || [];
    let datasetLabel = 'Revenue (₹)';
    let datasetValues = salesTrend?.revenues || [];
    let strokeColor = '#6366f1';
    let bgColor = 'rgba(99, 102, 241, 0.18)';

    if (activeMetric === 'orders') {
      datasetLabel = 'Orders Count';
      datasetValues = salesTrend?.orders || [];
      strokeColor = '#38bdf8';
      bgColor = 'rgba(56, 189, 248, 0.18)';
    } else if (activeMetric === 'aov') {
      datasetLabel = 'Average Order Value (₹)';
      datasetValues = salesTrend?.aov_trend || [];
      strokeColor = '#10b981';
      bgColor = 'rgba(16, 185, 129, 0.18)';
    } else if (activeMetric === 'profit') {
      datasetLabel = 'Estimated Gross Profit (₹)';
      datasetValues = (salesTrend?.revenues || []).map(r => Math.round(r * 0.285));
      strokeColor = '#ec4899';
      bgColor = 'rgba(236, 72, 153, 0.18)';
    }

    return {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data: datasetValues,
          borderColor: strokeColor,
          backgroundColor: bgColor,
          fill: true,
          tension: 0.38,
          pointBackgroundColor: strokeColor,
          pointBorderColor: '#ffffff',
          pointRadius: labels.length > 20 ? 2 : 4,
          pointHoverRadius: 6,
          borderWidth: 2.5,
        }
      ]
    };
  }, [salesTrend, activeMetric]);

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const val = Number(context.raw);
            if (activeMetric === 'orders') {
              return ` Volume: ${val} orders`;
            }
            return ` ${context.dataset.label}: ₹${val.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: (value) => {
            if (activeMetric === 'orders') return value;
            return `₹${(value / 1000).toFixed(0)}k`;
          }
        }
      }
    }
  };

  // Chart 2: Interactive Category Bar Chart Configuration
  const categoryBarChartData = useMemo(() => {
    const labels = categoryDist?.labels || [];
    const values = barMetric === 'revenue'
      ? (categoryDist?.revenues || categoryDist?.data || [])
      : (categoryDist?.units || []);

    const colors = [
      '#6366f1', '#38bdf8', '#34d399', '#f59e0b',
      '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'
    ];

    return {
      labels,
      datasets: [
        {
          label: barMetric === 'revenue' ? 'Category Revenue (₹)' : 'Units Sold',
          data: values,
          backgroundColor: colors.slice(0, labels.length),
          borderRadius: 8,
          borderWidth: 0,
        }
      ]
    };
  }, [categoryDist, barMetric]);

  const categoryBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (ctx) => {
            if (barMetric === 'units') return ` Units Sold: ${Number(ctx.raw).toLocaleString()} items`;
            return ` Revenue: ₹${Number(ctx.raw).toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 10 },
          callback: (value) => {
            if (barMetric === 'units') return value;
            return `₹${(value / 1000).toFixed(0)}k`;
          }
        }
      }
    }
  };

  // Chart 3: Category Doughnut Chart Configuration
  const categoryDoughnutData = useMemo(() => {
    return {
      labels: categoryDist?.labels || [],
      datasets: [
        {
          data: categoryDist?.revenues || categoryDist?.data || [],
          backgroundColor: [
            '#6366f1', '#38bdf8', '#34d399', '#f59e0b',
            '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'
          ],
          borderColor: '#0b1120',
          borderWidth: 2,
          hoverOffset: 6
        }
      ]
    };
  }, [categoryDist]);

  const categoryDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#cbd5e1',
          font: { size: 11 },
          boxWidth: 10,
          padding: 8
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        callbacks: {
          label: (ctx) => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const val = Number(ctx.raw);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ₹${val.toLocaleString('en-IN')} (${pct}%)`;
          }
        }
      }
    },
    cutout: '72%'
  };

  // Chart 4: Payment Distribution (Doughnut / Bar)
  const paymentChartData = useMemo(() => {
    return {
      labels: paymentDist?.labels || ['UPI', 'Cash', 'Card', 'Bank Transfer'],
      datasets: [
        {
          data: paymentDist?.revenues || [60, 20, 15, 5],
          backgroundColor: ['#10b981', '#f59e0b', '#6366f1', '#38bdf8'],
          borderColor: '#0b1120',
          borderWidth: 2,
        }
      ]
    };
  }, [paymentDist]);

  const paymentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#cbd5e1', font: { size: 10 }, boxWidth: 10, padding: 8 }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${Number(ctx.raw).toLocaleString('en-IN')}`
        }
      }
    },
    cutout: '65%'
  };

  // Filtered & Sorted Top Products
  const processedProducts = useMemo(() => {
    let prods = [...topProducts];
    if (searchProduct) {
      const q = searchProduct.toLowerCase();
      prods = prods.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (sortProductBy === 'revenue') {
      prods.sort((a, b) => b.total_revenue - a.total_revenue);
    } else {
      prods.sort((a, b) => b.units_sold - a.units_sold);
    }
    return prods;
  }, [topProducts, searchProduct, sortProductBy]);

  if (loading && !kpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Aggregating live telemetry and predictive models...</p>
      </div>
    );
  }

  return (
    <div className="space-y-7 max-w-7xl mx-auto">
      {/* Top Cockpit Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 mb-1">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Live Business Intelligence</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-white">
            {user?.workspace_name || "MarketMind Intelligence Cockpit"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time sales telemetry, predictive forecasting curves, inventory tracking, and consumer segment clusters.
          </p>
        </div>

        {/* Interactive Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Customer Button */}
          <button
            onClick={() => setCustomerModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
            title="Add new customer & register in active dataset"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-400" />
            <span>+ Add Customer</span>
          </button>

          {/* Add Product Button */}
          <button
            onClick={() => setProductModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95"
            title="Add new product & register in active dataset"
          >
            <PackagePlus className="w-3.5 h-3.5 text-cyan-400" />
            <span>+ Add Product</span>
          </button>

          {/* Realtime Sale Simulation Button */}
          <button
            onClick={handleSimulateSales}
            disabled={simulating}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50"
            title="Simulate 5 real-time POS sales with instant inventory reduction"
          >
            <Zap className={`w-3.5 h-3.5 text-emerald-400 ${simulating ? 'animate-bounce' : ''}`} />
            <span>{simulating ? "Simulating Sales..." : "Simulate Live Sales (+5)"}</span>
          </button>

          {/* Re-train AI Button */}
          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95 disabled:opacity-50"
            title="Re-run K-Means and Random Forest models on latest data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin text-brand-400' : ''}`} />
            <span>{retraining ? "Training AI..." : "Re-train AI"}</span>
          </button>

          {/* Quick POS Navigation */}
          <Link
            to="/app/sales"
            className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-1.5 active:scale-95"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>POS Billing Terminal</span>
          </Link>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3 shadow-lg animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* Interactive Timeframe Pill Filter Bar */}
      <div className="glass-panel p-3 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-xs text-slate-300">
          <Clock className="w-4 h-4 text-brand-400" />
          <span className="font-semibold">Interactive Horizon:</span>
        </div>

        <div className="flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: '90d', label: 'Last 90 Days' },
            { id: '1y', label: '12 Months (All)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeframe === tab.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive KPI Stat Cards (Clickable to switch chart metric) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <button
          onClick={() => setActiveMetric('revenue')}
          className={`p-5 rounded-3xl border text-left transition-all ${
            activeMetric === 'revenue'
              ? 'glass-panel border-brand-500 shadow-xl shadow-brand-600/20 ring-1 ring-brand-500/50'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Gross Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-white">
            ₹{kpis?.total_revenue ? Number(kpis.total_revenue).toLocaleString('en-IN') : '0'}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span className="text-emerald-400 font-semibold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              +14.2% vs prev
            </span>
            <span className="text-[10px] text-brand-400 font-medium">Click to Graph &rarr;</span>
          </div>
        </button>

        {/* Order Volume */}
        <button
          onClick={() => setActiveMetric('orders')}
          className={`p-5 rounded-3xl border text-left transition-all ${
            activeMetric === 'orders'
              ? 'glass-panel border-cyan-500 shadow-xl shadow-cyan-600/20 ring-1 ring-cyan-500/50'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transaction Volume</span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-white">
            {kpis?.total_orders?.toLocaleString() || 0}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>AOV: ₹{kpis?.average_order_value || 0}</span>
            <span className="text-[10px] text-cyan-400 font-medium">Click to Graph &rarr;</span>
          </div>
        </button>

        {/* Estimated Gross Profit */}
        <button
          onClick={() => setActiveMetric('profit')}
          className={`p-5 rounded-3xl border text-left transition-all ${
            activeMetric === 'profit'
              ? 'glass-panel border-pink-500 shadow-xl shadow-pink-600/20 ring-1 ring-pink-500/50'
              : 'glass-panel hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Gross Margin (28.5%)</span>
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-emerald-400 font-mono">
            ₹{kpis?.gross_profit ? Number(kpis.gross_profit).toLocaleString('en-IN') : '0'}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>COGS: ~71.5%</span>
            <span className="text-[10px] text-pink-400 font-medium">Click to Graph &rarr;</span>
          </div>
        </button>

        {/* Repeat Customer Retention */}
        <Link
          to="/app/customers"
          className="p-5 rounded-3xl border text-left glass-panel hover:border-slate-700 transition-all block group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Repeat Retention</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-white">
            {kpis?.repeat_customers_pct || 0}%
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
            <span>{kpis?.total_customers || 0} registered</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
        </Link>
      </div>

      {/* Row 1: Interactive Line Chart + Category Doughnut (Pie) Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dynamic Line Chart (8 cols) */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-brand-400" />
                <h3 className="text-base font-bold font-['Outfit'] text-white">
                  Sales Trend Trajectory ({timeframe.toUpperCase()})
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic curve displaying {activeMetric.toUpperCase()} across selected time horizon.
              </p>
            </div>

            {/* Metric Switcher Inside Card */}
            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              {[
                { id: 'revenue', label: 'Revenue' },
                { id: 'orders', label: 'Orders' },
                { id: 'aov', label: 'AOV' },
                { id: 'profit', label: 'Margin' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setActiveMetric(m.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    activeMetric === m.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <Line data={trendChartData} options={trendChartOptions} />
          </div>
        </div>

        {/* Category Pie / Doughnut Chart (4 cols) */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold font-['Outfit'] text-white">
                  Category Share
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Doughnut</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Revenue distribution across retail product categories.
            </p>
          </div>

          <div className="h-56 w-full my-auto py-2">
            <Doughnut data={categoryDoughnutData} options={categoryDoughnutOptions} />
          </div>

          <div className="pt-3 border-t border-slate-800 text-center text-[11px] text-slate-400">
            Hover over arc slices to view exact percentage and ₹ turnover.
          </div>
        </div>
      </div>

      {/* Row 2: Interactive Bar Chart + Payment Modes Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Bar Chart (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold font-['Outfit'] text-white">
                  Category Comparison (Bar Chart)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare performance across categories by Revenue or Units Sold.
              </p>
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setBarMetric('revenue')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  barMetric === 'revenue'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Revenue (₹)
              </button>
              <button
                onClick={() => setBarMetric('units')}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  barMetric === 'units'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Units Sold
              </button>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <Bar data={categoryBarChartData} options={categoryBarChartOptions} />
          </div>
        </div>

        {/* Payment Modes Share (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-3xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base font-bold font-['Outfit'] text-white">
                  Indian Payment Modes
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">UPI / Cash / Card</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Turnover breakdown by customer checkout preference.
            </p>
          </div>

          <div className="h-52 w-full my-auto py-2">
            <Doughnut data={paymentChartData} options={paymentChartOptions} />
          </div>

          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-900 text-center">
              <span className="text-slate-400 block text-[10px]">UPI Dominance</span>
              <span className="font-bold text-emerald-400">~60% of volume</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-900 text-center">
              <span className="text-slate-400 block text-[10px]">Settlement</span>
              <span className="font-bold text-white">Instant T+0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Interactive Best-Selling Products Leaderboard Table */}
      <div className="glass-panel p-6 rounded-3xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold font-['Outfit'] text-white">
              Best-Selling Product Performers Leaderboard
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ranked catalogue items with real-time volume, unit pricing, and quick billing actions.
            </p>
          </div>

          {/* Interactive Search & Sort Bar */}
          <div className="flex items-center space-x-3">
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchProduct}
                onChange={(e) => setSearchProduct(e.target.value)}
                placeholder="Search products or SKU..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-[11px]">
              <button
                onClick={() => setSortProductBy('units')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  sortProductBy === 'units' ? 'bg-brand-600 text-white' : 'text-slate-400'
                }`}
              >
                By Units
              </button>
              <button
                onClick={() => setSortProductBy('revenue')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  sortProductBy === 'revenue' ? 'bg-brand-600 text-white' : 'text-slate-400'
                }`}
              >
                By Revenue
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400">
                <th className="pb-3 pl-2">Rank & Product</th>
                <th className="pb-3">SKU</th>
                <th className="pb-3">Category</th>
                <th className="pb-3 text-right">Retail Price</th>
                <th className="pb-3 text-right">Units Sold</th>
                <th className="pb-3 text-right">Gross Revenue</th>
                <th className="pb-3 pr-2 text-right">Quick POS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {processedProducts.map((p, idx) => (
                <tr key={p.id || idx} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 pl-2 font-medium text-white flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-semibold">{p.name}</span>
                  </td>
                  <td className="py-3 font-mono text-slate-400 text-[11px]">{p.sku}</td>
                  <td className="py-3 text-slate-300">{p.category}</td>
                  <td className="py-3 text-right font-mono text-slate-200">₹{p.price}</td>
                  <td className="py-3 text-right font-mono font-bold text-emerald-400">
                    {p.units_sold.toLocaleString()}
                  </td>
                  <td className="py-3 text-right font-mono font-extrabold text-white">
                    ₹{p.total_revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 pr-2 text-right">
                    <Link
                      to="/app/sales"
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 hover:text-white font-semibold text-[11px] transition-colors inline-flex items-center space-x-1"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Bill</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Action Modals */}
      <AddCustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <AddProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
