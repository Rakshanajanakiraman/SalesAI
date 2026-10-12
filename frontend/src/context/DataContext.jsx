import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [activeDataset, setActiveDataset] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  const fetchDatasets = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, activeRes] = await Promise.all([
        api.get('/datasets/list').catch(() => ({ data: { datasets: [] } })),
        api.get('/datasets/active').catch(() => null)
      ]);
      setDatasets(listRes.data.datasets || []);
      if (activeRes && activeRes.data) {
        setActiveDataset({
          ...activeRes.data.dataset,
          stats: activeRes.data.stats,
          recent_customers: activeRes.data.recent_customers,
          recent_products: activeRes.data.recent_products
        });
      } else {
        const active = listRes.data.datasets?.find(d => d.is_active) || listRes.data.datasets?.[0];
        setActiveDataset(active || { name: "MarketMind AI Sample Dataset", source_type: "sample" });
      }
    } catch (err) {
      console.warn("Could not load datasets list:", err);
      setActiveDataset({ name: "MarketMind AI Sample Dataset", source_type: "sample" });
    }
  }, [user]);

  const fetchAlertsCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/inventory/alerts/count');
      setUnreadAlerts(res.data.unread_count || 0);
    } catch (err) {
      // quiet fallback
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDatasets();
      fetchAlertsCount();
    }
  }, [user, refreshTrigger, fetchDatasets, fetchAlertsCount]);

  return (
    <DataContext.Provider value={{
      activeDataset,
      datasets,
      setActiveDataset,
      unreadAlerts,
      triggerRefresh,
      refreshTrigger,
      fetchDatasets
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
