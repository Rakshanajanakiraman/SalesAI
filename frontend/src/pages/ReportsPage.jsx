import React, { useState, useEffect } from 'react';
import {
  FileText, Printer, Download, TrendingUp, Layers,
  CreditCard, PieChart, Sparkles, CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export default function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary');
      setReport(res.data);
    } catch (err) {
      console.error("Report fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const revenue = report?.revenue_summary || {};
  const inventory = report?.inventory_valuation || {};
  const payments = report?.payment_breakdown || [];
  const topCategories = report?.top_categories || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Business Financial Audit & Tax Reports
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Profit & Loss (P&L), Cost of Goods Sold (COGS), dual GST tax collections, and warehouse asset valuation.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export Audit Summary</span>
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-3 glass-panel rounded-3xl">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span>Aggregating ledger balances and fiscal metrics...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue & Profitability Panel */}
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-brand-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Revenue, Margin & P&L Analysis
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Currency: INR (₹)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Gross Sales Turnover</span>
                <div className="text-xl font-extrabold text-white font-mono mt-1">
                  ₹{revenue.gross_revenue?.toLocaleString('en-IN') || '0'}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">{revenue.total_orders || 0} orders processed</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Cost of Goods Sold (COGS)</span>
                <div className="text-xl font-bold text-slate-300 font-mono mt-1">
                  ₹{revenue.cogs?.toLocaleString('en-IN') || '0'}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Wholesale product acquisition</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Net Gross Profit</span>
                <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                  ₹{revenue.net_profit?.toLocaleString('en-IN') || '0'}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">{revenue.profit_margin_pct}% margin</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total GST Collected</span>
                <div className="text-xl font-extrabold text-indigo-400 font-mono mt-1">
                  ₹{revenue.gst_collected?.toLocaleString('en-IN') || '0'}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">CGST + SGST remittance</span>
              </div>
            </div>
          </div>

          {/* Inventory Valuation Panel */}
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Current Inventory Valuation & Asset Health
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Warehouse Physical Units</span>
                <div className="text-xl font-bold text-white font-mono mt-1">
                  {inventory.units_in_stock?.toLocaleString('en-IN') || 0} Units
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">In stock on retail shelves</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Wholesale Asset Valuation</span>
                <div className="text-xl font-bold text-slate-300 font-mono mt-1">
                  ₹{inventory.cost_valuation?.toLocaleString('en-IN') || '0'}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Total purchase capital tied up</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400">Potential Retail Yield</span>
                <div className="text-xl font-bold text-brand-400 font-mono mt-1">
                  ₹{inventory.retail_valuation?.toLocaleString('en-IN') || '0'}
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 block">
                  Unrealized Margin: ₹{inventory.unrealized_profit?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="glass-panel p-6 rounded-3xl space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
              <CreditCard className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Indian Payment Mode Distribution
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {payments.map(p => (
                <div key={p.method} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-white">{p.method}</span>
                    <span className="text-brand-400 font-bold">{p.percentage}%</span>
                  </div>
                  <div className="text-lg font-bold text-slate-200 font-mono">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    {p.count} transactions completed
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performing Categories Breakdown */}
          {topCategories.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl space-y-5">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-4">
                <PieChart className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Top Performing Merchandise Categories
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCategories.map(cat => (
                  <div key={cat.category} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white text-sm">{cat.category}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                        {cat.percentage}% of sales
                      </span>
                    </div>
                    <div className="text-xl font-bold text-purple-400 font-mono">
                      ₹{cat.revenue.toLocaleString('en-IN')}
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-500 h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, cat.percentage)}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 flex justify-between">
                      <span>{cat.units_sold} units sold</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
