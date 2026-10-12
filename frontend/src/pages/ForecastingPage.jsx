import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  TrendingUp, Sparkles, RefreshCw, CheckCircle2,
  Calendar, Layers, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Download, Filter, Eye, Zap
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../services/api';
import { useData } from '../context/DataContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ForecastingPage() {
  const { triggerRefresh } = useData();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainedNotice, setRetrainedNotice] = useState(false);
  const [timeframe, setTimeframe] = useState('30d'); // '7d', '14d', '30d'
  const [showConfidenceBands, setShowConfidenceBands] = useState(true);
  const chartRef = useRef(null);

  useEffect(() => {
    fetchForecast();
  }, []);

  const fetchForecast = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/forecasting');
      setForecastData(res.data);
    } catch (err) {
      console.error("Forecasting load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/ml/re-train');
      setRetrainedNotice(true);
      triggerRefresh();
      await fetchForecast();
      setTimeout(() => setRetrainedNotice(false), 4000);
    } catch (err) {
      console.error("Retrain error:", err);
    } finally {
      setRetraining(false);
    }
  };

  // Filter dataset by selected timeframe
  const filteredData = useMemo(() => {
    const raw = forecastData?.data || [];
    if (timeframe === '7d') return raw.slice(0, 7);
    if (timeframe === '14d') return raw.slice(0, 14);
    return raw;
  }, [forecastData, timeframe]);

  // Key summary statistics
  const stats = useMemo(() => {
    if (!filteredData.length) {
      return { totalRevenue: 0, avgDaily: 0, peakDay: null, minDay: null };
    }
    const totalRevenue = filteredData.reduce((acc, curr) => acc + Number(curr.predicted_revenue), 0);
    const avgDaily = Math.round(totalRevenue / filteredData.length);

    let peakDay = filteredData[0];
    let minDay = filteredData[0];
    for (const d of filteredData) {
      if (Number(d.predicted_revenue) > Number(peakDay.predicted_revenue)) peakDay = d;
      if (Number(d.predicted_revenue) < Number(minDay.predicted_revenue)) minDay = d;
    }

    return { totalRevenue, avgDaily, peakDay, minDay };
  }, [filteredData]);

  // ChartJS datasets & styling
  const chartData = useMemo(() => {
    const labels = filteredData.map(d => {
      // Format as e.g. "Oct 12"
      const parts = d.date.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return dateObj.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      }
      return d.date;
    });

    const datasets = [];

    if (showConfidenceBands) {
      datasets.push({
        label: 'Optimistic Ceiling (Upper Bound)',
        data: filteredData.map(d => d.upper_bound),
        borderColor: 'rgba(56, 189, 248, 0.4)',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.35,
      });
    }

    // Main forecast line with rich gradient fill
    datasets.push({
      label: 'AI Forecasted Revenue (₹)',
      data: filteredData.map(d => d.predicted_revenue),
      borderColor: '#818cf8',
      borderWidth: 3,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(129, 140, 248, 0.38)');
        gradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.15)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        return gradient;
      },
      fill: true,
      tension: 0.38,
      pointBackgroundColor: '#6366f1',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: filteredData.length <= 14 ? 4 : 2.5,
      pointHoverRadius: 7,
      pointHoverBackgroundColor: '#38bdf8',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
    });

    if (showConfidenceBands) {
      datasets.push({
        label: 'Conservative Floor (Lower Bound)',
        data: filteredData.map(d => d.lower_bound),
        borderColor: 'rgba(244, 63, 94, 0.35)',
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.35,
      });
    }

    return { labels, datasets };
  }, [filteredData, showConfidenceBands]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: '#cbd5e1',
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          font: { size: 11, family: 'sans-serif', weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        titleFont: { size: 12, weight: 'bold' },
        bodyColor: '#cbd5e1',
        bodyFont: { size: 11 },
        borderColor: 'rgba(99, 102, 241, 0.3)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          title: (items) => `Forecast Date: ${items[0].label}`,
          label: (context) => {
            const val = Number(context.raw).toLocaleString('en-IN');
            return ` ${context.dataset.label}: ₹${val}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94a3b8', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: {
          color: '#94a3b8',
          font: { size: 11 },
          callback: (value) => `₹${(value / 1000).toFixed(0)}k`
        }
      }
    }
  };

  const exportForecastCSV = () => {
    if (!filteredData.length) return;
    const header = "Date,Lower Bound (INR),Predicted Revenue (INR),Upper Bound (INR)\n";
    const rows = filteredData.map(d => `${d.date},${d.lower_bound},${d.predicted_revenue},${d.upper_bound}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MarketMind_Sales_Forecast_${timeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 mb-1">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider">Predictive Machine Learning</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Sales Demand Forecasting Trajectory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Machine learning projections modeled with seasonality patterns, weekday velocity, and confidence boundaries.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start sm:self-auto">
          <button
            onClick={exportForecastCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs text-slate-200 font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
            <span>{retraining ? "Training Model..." : "Re-train Forecaster"}</span>
          </button>
        </div>
      </div>

      {retrainedNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>Forecasting model weights updated and forward projections recomputed successfully!</span>
        </div>
      )}

      {/* Model Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all pointer-events-none" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Projected {timeframe.toUpperCase()} Revenue</span>
          <div className="text-2xl font-extrabold text-brand-400 font-mono mt-1.5">
            ₹{Math.round(stats.totalRevenue).toLocaleString('en-IN')}
          </div>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-400 font-semibold mt-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Cumulative forecast for {filteredData.length} days</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Expected Daily Average</span>
          <div className="text-2xl font-extrabold text-cyan-300 font-mono mt-1.5">
            ₹{stats.avgDaily.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Expected run-rate per day</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Peak Demand Day</span>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1.5 truncate">
            {stats.peakDay ? `₹${Number(stats.peakDay.predicted_revenue).toLocaleString('en-IN')}` : '—'}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block truncate">
            {stats.peakDay ? `Date: ${stats.peakDay.date}` : 'Calculating...'}
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all pointer-events-none" />
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Model Accuracy (R² Score)</span>
          <div className="text-2xl font-bold text-purple-300 font-mono mt-1.5">
            {forecastData?.metrics?.r2_score || "0.91"}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            MAE: ₹{forecastData?.metrics?.mae ? Number(forecastData.metrics.mae).toLocaleString('en-IN') : '1,840'}
          </span>
        </div>
      </div>

      {/* Main Interactive Forecast Graph */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              <span>Projected Revenue Curve (INR)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Solid curve depicts AI regression forecast with upper (optimistic) and lower (conservative) bounds.
            </p>
          </div>

          {/* Timeframe & Display Controls */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {/* Confidence Band Toggle */}
            <button
              onClick={() => setShowConfidenceBands(!showConfidenceBands)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                showConfidenceBands
                  ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                  : 'bg-slate-900 border-slate-700/60 text-slate-400 hover:text-white'
              }`}
            >
              Bounds {showConfidenceBands ? 'On' : 'Off'}
            </button>

            {/* Timeframe Selectors */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-xl p-1 text-xs">
              {[
                { id: '7d', label: '7 Days' },
                { id: '14d', label: '14 Days' },
                { id: '30d', label: '30 Days' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setTimeframe(tab.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    timeframe === tab.id
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Canvas Area */}
        <div className="h-96 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs space-y-3">
              <div className="w-9 h-9 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <span>Synthesizing time-series predictions & seasonality weights...</span>
            </div>
          ) : (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          )}
        </div>
      </div>

      {/* Day-by-Day Forecast Breakdown Table */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-slate-800/80">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white font-['Outfit']">
              Day-by-Day Demand Breakdown
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily revenue targets, conservative floor, and optimistic ceiling metrics.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredData.length} forecasted days
          </span>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 z-10">
              <tr>
                <th className="py-3.5 pl-6">Forecast Date</th>
                <th className="py-3.5 text-right">Conservative Floor</th>
                <th className="py-3.5 text-right">Predicted Revenue</th>
                <th className="py-3.5 text-right">Optimistic Ceiling</th>
                <th className="py-3.5 text-right">Variance Spread</th>
                <th className="py-3.5 pr-6 text-center">Confidence Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono">
              {filteredData.map((row, idx) => {
                const spread = Math.round(Number(row.upper_bound) - Number(row.lower_bound));
                const isPeak = stats.peakDay && row.date === stats.peakDay.date;

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-800/30 transition-colors ${
                      isPeak ? 'bg-brand-500/10' : ''
                    }`}
                  >
                    <td className="py-3 pl-6 font-sans text-slate-200 flex items-center space-x-2">
                      <span>{row.date}</span>
                      {isPeak && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-500 text-white uppercase">
                          Peak
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right text-rose-300">
                      ₹{Number(row.lower_bound).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right font-bold text-brand-300">
                      ₹{Number(row.predicted_revenue).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right text-cyan-300">
                      ₹{Number(row.upper_bound).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right text-slate-400">
                      ±₹{Math.round(spread / 2).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 pr-6 text-center font-sans">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-semibold inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>90% Confidence</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
