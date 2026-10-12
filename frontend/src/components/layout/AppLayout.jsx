import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BrainCircuit, LayoutDashboard, Users, Package, ShoppingBag,
  TrendingUp, FileText, Bell, Settings, LogOut, Database,
  Tag, MessageSquare, ShieldAlert, Sparkles, ChevronDown, Check,
  Menu, X, AlertTriangle, Layers, UserPlus, PackagePlus, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import AddCustomerModal from '../modals/AddCustomerModal';
import AddProductModal from '../modals/AddProductModal';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { activeDataset, unreadAlerts } = useData();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertDrawerOpen, setAlertDrawerOpen] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  const role = user?.role_name || 'business_owner';

  // Role-based navigation rules (PDF Section 4 RBAC Access Matrix)
  const navItems = [
    {
      label: "Dashboard",
      path: "/app/dashboard",
      icon: LayoutDashboard,
      roles: ["business_owner", "store_manager", "sales_executive", "system_admin"]
    },
    {
      label: "Customers",
      path: "/app/customers",
      icon: Users,
      roles: ["business_owner", "store_manager", "sales_executive", "system_admin"]
    },
    {
      label: "Products",
      path: "/app/products",
      icon: Package,
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    {
      label: "Point of Sale (POS)",
      path: "/app/sales",
      icon: ShoppingBag,
      roles: ["business_owner", "store_manager", "sales_executive", "system_admin"]
    },
    {
      label: "Inventory & Alerts",
      path: "/app/inventory",
      icon: Layers,
      badge: unreadAlerts > 0 ? `${unreadAlerts}` : null,
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    {
      label: "Invoices & Billing",
      path: "/app/invoices",
      icon: FileText,
      roles: ["business_owner", "store_manager", "sales_executive", "system_admin"]
    },
    // AI Suite
    {
      header: "Predictive Intelligence",
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    {
      label: "Sales Forecasting",
      path: "/app/ai/forecasting",
      icon: TrendingUp,
      roles: ["business_owner", "system_admin", "store_manager"]
    },
    {
      label: "Customer Segmentation",
      path: "/app/ai/segmentation",
      icon: Users,
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    {
      label: "Churn Risk & Retention",
      path: "/app/ai/churn",
      icon: ShieldAlert,
      roles: ["business_owner", "system_admin", "store_manager"]
    },
    {
      label: "Product Recommender",
      path: "/app/ai/recommendations",
      icon: Sparkles,
      roles: ["business_owner", "store_manager", "sales_executive", "system_admin"]
    },
    {
      label: "Integrity & Fraud Radar",
      path: "/app/ai/anomalies",
      icon: ShieldCheck,
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    // Marketing & Operations
    {
      header: "Operations & Admin",
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    {
      label: "Promotions",
      path: "/app/promotions",
      icon: Tag,
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    {
      label: "Business Reports",
      path: "/app/reports",
      icon: FileText,
      roles: ["business_owner", "store_manager", "system_admin"]
    },
    {
      label: "Dataset Manager",
      path: "/app/datasets",
      icon: Database,
      roles: ["business_owner", "system_admin"]
    },
    {
      label: "Feedback",
      path: "/app/feedback",
      icon: MessageSquare,
      roles: ["business_owner", "store_manager", "sales_executive", "system_admin"]
    },
    {
      label: "Settings & Tour",
      path: "/app/settings",
      icon: Settings,
      roles: ["business_owner", "store_manager", "sales_executive", "system_admin"]
    }
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (r) => {
    switch (r) {
      case 'business_owner': return 'Business Owner';
      case 'store_manager': return 'Store Manager';
      case 'sales_executive': return 'Sales Executive';
      case 'system_admin': return 'System Administrator';
      default: return r;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-slate-900/90 border-r border-slate-800 shrink-0">
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800">
          <Link to="/app/dashboard" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold font-['Outfit'] text-white">
                MarketMind <span className="gradient-text">AI</span>
              </span>
              <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">
                Sales Intelligence
              </span>
            </div>
          </Link>
        </div>

        {/* Active Dataset Badge (Prompt Section 47) */}
        <div className="p-3 mx-4 my-3 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Database className="w-3 h-3 text-brand-400" />
              <span>Active Data Source</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xs font-semibold text-white truncate" title={activeDataset?.name}>
            {activeDataset?.name || "MarketMind AI Sample Data"}
          </div>
          <Link to="/app/datasets" className="text-[10px] text-brand-400 hover:text-brand-300 font-medium block mt-1">
            Manage Data Sources &rarr;
          </Link>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {navItems.map((item, index) => {
            if (item.header) {
              if (!item.roles.includes(role)) return null;
              return (
                <div key={index} className="pt-4 pb-1 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {item.header}
                </div>
              );
            }

            if (!item.roles.includes(role)) return null;

            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">{user?.full_name || 'Business User'}</div>
              <div className="text-[10px] text-brand-400 font-semibold">{getRoleDisplayName(role)}</div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-slate-900/60 border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between shrink-0 glass-panel">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div>
              <div className="text-xs text-slate-400 font-medium">
                Workspace: <span className="text-slate-200 font-semibold">{user?.workspace_name || "MarketMind Retail India"}</span>
              </div>
              <div className="text-lg font-bold font-['Outfit'] text-white">
                {user?.city ? `${user.city}, India` : 'Bengaluru, India'} • INR (₹)
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Quick Add Customer */}
            <button
              onClick={() => setCustomerModalOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-all hover:border-brand-500/50 shadow-sm"
              title="Add Customer & Sync to Dataset"
            >
              <UserPlus className="w-3.5 h-3.5 text-brand-400" />
              <span>+ Customer</span>
            </button>

            {/* Quick Add Product */}
            <button
              onClick={() => setProductModalOpen(true)}
              className="hidden md:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-200 text-xs font-semibold transition-all hover:border-brand-500/50 shadow-sm"
              title="Add Product & Sync to Dataset"
            >
              <PackagePlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>+ Product</span>
            </button>

            {/* Notifications Button */}
            <Link
              to="/app/inventory"
              className="relative p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Stock & System Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {unreadAlerts}
                </span>
              )}
            </Link>

            {/* Quick Link to POS */}
            <Link
              to="/app/sales"
              className="gradient-btn hidden sm:flex items-center space-x-2 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-brand-600/30"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>New Sale / Billing</span>
            </Link>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950">
          <Outlet />
        </main>
      </div>

      {/* Global Quick Action Modals */}
      <AddCustomerModal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
      />
      <AddProductModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
      />
    </div>
  );
}
