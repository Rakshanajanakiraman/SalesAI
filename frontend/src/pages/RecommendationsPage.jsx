import React, { useState, useEffect } from 'react';
import {
  Sparkles, RefreshCw, ShoppingBag, ArrowRight,
  Tag, Layers, Award, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useData } from '../context/DataContext';

export default function RecommendationsPage() {
  const { triggerRefresh } = useData();
  const [recData, setRecData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ml/recommendations');
      setRecData(res.data);
    } catch (err) {
      console.error("Recs load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setRetraining(true);
    try {
      await api.post('/ml/re-train');
      triggerRefresh();
      await fetchRecommendations();
    } catch (err) {
      console.error("Retrain error:", err);
    } finally {
      setRetraining(false);
    }
  };

  const recs = recData?.recommendations || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Association Rule Mining</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-['Outfit'] text-white">
            Market Basket Recommender & Co-Purchases
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Uncover frequent item combinations (Apriori co-purchases) to build high-margin bundle discounts and cross-sells.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="gradient-btn text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2 self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? "Mining Rules..." : "Re-mine Market Basket"}</span>
        </button>
      </div>

      {/* Algorithm Banner */}
      <div className="glass-panel p-4 rounded-2xl flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400">Underlying Model:</span>
          <span className="text-white font-bold ml-1.5">{recData?.algorithm || "Apriori Co-Purchase Mining"}</span>
        </div>
        <div className="text-slate-400">
          Discovered Co-Purchase Pairs: <span className="text-brand-400 font-bold">{recs.length}</span>
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recs.map((r, idx) => (
          <div key={idx} className="glass-panel p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:border-brand-500/40 transition-all">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300">
                  {r.rule_type}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  {r.confidence_pct}% Confidence
                </span>
              </div>

              {/* Pair Visualization */}
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-slate-500" />
                  <span className="text-xs font-semibold text-slate-200 truncate">{r.source_product}</span>
                </div>
                <div className="flex items-center space-x-2 pl-3 text-slate-500">
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-[10px] text-brand-400 font-semibold">frequently paired with</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-white truncate">{r.recommended_product}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                {r.explanation}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">Bundle Add-on Price</span>
                <span className="text-sm font-bold text-white font-mono">₹{r.recommended_price}</span>
              </div>

              <Link
                to="/app/promotions"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1"
              >
                <Tag className="w-3.5 h-3.5 text-brand-400" />
                <span>Create Promo</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
