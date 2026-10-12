import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Database, Upload, ArrowRight, CheckCircle2,
  FileSpreadsheet, Sparkles, ChevronRight, ChevronLeft,
  LayoutDashboard, Users, Package, ShoppingBag, TrendingUp, AlertTriangle
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { triggerRefresh } = useData();

  const [step, setStep] = useState(1); // 1 = Data Source Selection, 2 = CSV Upload (if chosen), 3 = Guided Tour
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // CSV Upload state
  const [csvFile, setCsvFile] = useState(null);
  const [csvPreview, setCsvPreview] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});

  // Tour step index
  const [tourIndex, setTourIndex] = useState(0);

  const tourSteps = [
    {
      title: "Executive Intelligence Dashboard",
      icon: LayoutDashboard,
      what: "Live business cockpit aggregating total revenue, sales volume, top categories, and operational health.",
      canDo: "Filter trends across time, track average order value (AOV), and monitor urgent system alerts.",
      whyUseful: "Gives small business owners instant clarity on store financial performance without waiting for end-of-month audits."
    },
    {
      title: "Customer Intelligence & Smart Names",
      icon: Users,
      what: "Customer relationship directory with Indian demographic fields (cities, phone, pincodes).",
      canDo: "Quickly look up purchase histories, view repeat visit frequencies, and use intelligent name autocomplete.",
      whyUseful: "Identifies top spenders and enables personalized WhatsApp marketing campaigns to improve retention."
    },
    {
      title: "Product Catalog & Inventory Movement",
      icon: Package,
      what: "Normalized product catalogue tracking SKUs, GST tax rates, wholesale costs, and retail prices.",
      canDo: "Add products, update stock quantities, configure minimum reorder thresholds, and assign suppliers.",
      whyUseful: "Prevents stockouts on high-margin goods and triggers automated alerts before inventory runs dry."
    },
    {
      title: "Point of Sale (POS) & Invoice Generation",
      icon: ShoppingBag,
      what: "Seamless counter billing system supporting Indian payment options (UPI, Cash, Cards).",
      canDo: "Process customer sales, apply discounts, calculate GST breakdowns, and print branded receipts.",
      whyUseful: "Guarantees that every retail sale immediately deducts inventory and feeds downstream AI algorithms."
    },
    {
      title: "Predictive AI Engines",
      icon: TrendingUp,
      what: "Machine learning suite including Sales Forecasting, Churn Risk Scoring, and Customer Segmentation.",
      canDo: "Inspect 30-day revenue projections, identify customers at risk of leaving, and bundle frequently bought items.",
      whyUseful: "Transforms raw transactional records into actionable foresight to grow business profitability."
    }
  ];

  const handleSelectSampleData = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/datasets/seed-sample');
      triggerRefresh();
      setStep(3); // Proceed to Guided Tour
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load sample dataset. Continuing to tour...");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file);
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/datasets/preview-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCsvPreview(res.data);
      setColumnMapping(res.data.suggested_mapping || {});
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to parse CSV file. Please verify column headers.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCsvImport = async () => {
    if (!csvFile || !csvPreview) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', csvFile);
    formData.append('dataset_name', `My Business Dataset (${csvFile.name})`);
    formData.append('mapping_json', JSON.stringify(columnMapping));

    try {
      await api.post('/datasets/confirm-import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      triggerRefresh();
      setStep(3); // Proceed to Guided Tour
    } catch (err) {
      setError(err.response?.data?.detail || "CSV Ingestion failed. Please verify required fields.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setLoading(true);
    try {
      await api.post('/auth/complete-onboarding');
      updateUser({ onboarding_completed: true });
      navigate('/app/dashboard');
    } catch (err) {
      navigate('/app/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative selection:bg-brand-500 selection:text-white">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-brand-500/30 text-brand-300 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Welcome to MarketMind AI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-['Outfit'] text-white">
            {step === 1 && "How would you like to work with your data?"}
            {step === 2 && "Configure & Map Your CSV Dataset"}
            {step === 3 && "Guided Tour of Your Platform"}
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-xl mx-auto">
            {step === 1 && "Choose whether to explore with our preloaded Indian retail sample dataset or import your own records."}
            {step === 2 && "Review detected columns, match fields, and ensure readiness for our AI forecasting models."}
            {step === 3 && `Step ${tourIndex + 1} of ${tourSteps.length}: Learn how MarketMind AI supercharges small business operations.`}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Data Choice Selection */}
        {step === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Option A: Sample Dataset */}
            <div
              onClick={handleSelectSampleData}
              className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-700/80 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Database className="w-7 h-7" />
                </div>
                <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-brand-950 text-brand-300 border border-brand-800/40 mb-3">
                  Recommended For Instant Demo
                </div>
                <h3 className="text-2xl font-bold font-['Outfit'] text-white">
                  Use MarketMind AI Sample Data
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Explore the full platform immediately using our realistic Indian retail dataset. Includes 1,000 customers, 2,500 sales, 10 product categories, INR currency, GST rates, and active AI models. No file upload required.
                </p>
              </div>

              <button
                disabled={loading}
                className="mt-8 w-full gradient-btn text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-600/30 flex items-center justify-center space-x-2 text-sm"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Load Sample Dataset</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Option B: Upload Own CSV */}
            <div
              onClick={() => setStep(2)}
              className="glass-panel glass-panel-hover p-8 rounded-3xl border border-slate-700/80 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/40 mb-3">
                  Custom Enterprise Import
                </div>
                <h3 className="text-2xl font-bold font-['Outfit'] text-white">
                  Upload My Business CSV
                </h3>
                <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                  Connect your own sales, customer, and product spreadsheet. Our guided wizard automatically inspects headers, lets you map columns, and ingests transactions into your private PostgreSQL workspace.
                </p>
              </div>

              <button
                className="mt-8 w-full py-3 px-4 rounded-xl border border-slate-600 hover:border-slate-400 bg-slate-800/80 text-white font-semibold flex items-center justify-center space-x-2 text-sm transition-all"
              >
                <span>Upload My CSV</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CSV Upload & Column Mapping Wizard */}
        {step === 2 && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
            {!csvPreview ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-2xl hover:border-brand-500 transition-colors">
                <FileSpreadsheet className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-white">Select your Sales CSV File</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Accepts standard .csv exports from Excel, Tally, Zoho, or POS terminals.
                </p>
                <label className="mt-6 inline-flex cursor-pointer gradient-btn text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-lg shadow-brand-600/30">
                  <span>Browse CSV File</span>
                  <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                </label>
                <div className="mt-4">
                  <button onClick={() => setStep(1)} className="text-xs text-slate-400 hover:text-white underline">
                    &larr; Back to data choices
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white">Detected Columns: {csvPreview.filename}</h4>
                    <p className="text-xs text-slate-400">Match your spreadsheet headers to standard MarketMind AI fields.</p>
                  </div>
                  <button onClick={() => setCsvPreview(null)} className="text-xs text-slate-400 hover:text-white underline">
                    Upload another file
                  </button>
                </div>

                {csvPreview.ai_readiness_warnings?.length > 0 && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
                    <div className="font-semibold flex items-center space-x-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Data Readiness Notice</span>
                    </div>
                    {csvPreview.ai_readiness_warnings.map((w, idx) => (
                      <div key={idx}>• {w}</div>
                    ))}
                  </div>
                )}

                {/* Mapping Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: "customer_name", label: "Customer Name", req: true },
                    { key: "product_name", label: "Product Name", req: true },
                    { key: "sale_date", label: "Sale Date (Forecasting)", req: true },
                    { key: "unit_price", label: "Unit Price (₹)", req: false },
                    { key: "quantity", label: "Quantity", req: false },
                    { key: "total_amount", label: "Total Amount (₹)", req: false },
                  ].map((field) => (
                    <div key={field.key} className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-semibold text-slate-200">
                          {field.label} {field.req && <span className="text-rose-400">*</span>}
                        </span>
                      </div>
                      <select
                        value={columnMapping[field.key] || ""}
                        onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-500"
                      >
                        <option value="">-- Choose Column --</option>
                        {csvPreview.headers.map((h) => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-400 hover:text-white px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmCsvImport}
                    disabled={loading}
                    className="gradient-btn text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-lg shadow-brand-600/30 flex items-center space-x-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Confirm & Ingest to PostgreSQL</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Guided Tour Walkthrough */}
        {step === 3 && (
          <div className="glass-panel p-8 rounded-3xl border border-slate-800 shadow-2xl">
            {(() => {
              const currentTour = tourSteps[tourIndex];
              const TourIcon = currentTour.icon;
              return (
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                        <TourIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold font-['Outfit'] text-white">{currentTour.title}</h3>
                        <span className="text-xs text-brand-400 font-mono">Module Walkthrough • {tourIndex + 1} of {tourSteps.length}</span>
                      </div>
                    </div>
                    <button
                      onClick={handleFinishOnboarding}
                      className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                    >
                      Skip Tour
                    </button>
                  </div>

                  <div className="space-y-4 my-6">
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-xs font-semibold uppercase tracking-wider text-brand-300 mb-1">What is this?</div>
                      <p className="text-sm text-slate-200">{currentTour.what}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1">What can I do here?</div>
                      <p className="text-sm text-slate-200">{currentTour.canDo}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                      <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1">Why is it useful?</div>
                      <p className="text-sm text-slate-200">{currentTour.whyUseful}</p>
                    </div>
                  </div>

                  {/* Tour Navigation Controls */}
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800">
                    <button
                      disabled={tourIndex === 0}
                      onClick={() => setTourIndex(prev => prev - 1)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700 disabled:opacity-30 disabled:pointer-events-none flex items-center space-x-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <div className="flex space-x-1.5">
                      {tourSteps.map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === tourIndex ? 'w-6 bg-brand-500' : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>

                    {tourIndex < tourSteps.length - 1 ? (
                      <button
                        onClick={() => setTourIndex(prev => prev + 1)}
                        className="gradient-btn px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-md shadow-brand-600/30 flex items-center space-x-1.5"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleFinishOnboarding}
                        disabled={loading}
                        className="gradient-btn px-6 py-2 rounded-xl text-xs font-semibold text-white shadow-lg shadow-brand-600/30 flex items-center space-x-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Finish & Open Dashboard</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
