import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';

// Layout & Core Pages
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';

// Main App Pages
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ProductsPage from './pages/ProductsPage';
import POSPage from './pages/POSPage';
import InventoryPage from './pages/InventoryPage';
import InvoicesPage from './pages/InvoicesPage';

// Predictive Intelligence Suite
import ForecastingPage from './pages/ForecastingPage';
import SegmentationPage from './pages/SegmentationPage';
import ChurnPage from './pages/ChurnPage';
import RecommendationsPage from './pages/RecommendationsPage';
import AnomaliesPage from './pages/AnomaliesPage';

// Operations & Admin
import PromotionsPage from './pages/PromotionsPage';
import ReportsPage from './pages/ReportsPage';
import DatasetsPage from './pages/DatasetsPage';
import FeedbackPage from './pages/FeedbackPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-xs">Authenticating session...</p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            {/* Public Marketing & Authentication */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Guided Tour & First-time Onboarding */}
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />

            {/* Application Console */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="sales" element={<POSPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="invoices" element={<InvoicesPage />} />

              {/* Predictive Intelligence */}
              <Route path="ai/forecasting" element={<ForecastingPage />} />
              <Route path="ai/segmentation" element={<SegmentationPage />} />
              <Route path="ai/churn" element={<ChurnPage />} />
              <Route path="ai/recommendations" element={<RecommendationsPage />} />
              <Route path="ai/anomalies" element={<AnomaliesPage />} />

              {/* Operations & Administration */}
              <Route path="promotions" element={<PromotionsPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="datasets" element={<DatasetsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
