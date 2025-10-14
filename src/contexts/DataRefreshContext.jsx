import React, { createContext, useContext, useState, useCallback } from 'react';

const DataRefreshContext = createContext();

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};

export const DataRefreshProvider = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Trigger refresh for all components
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Trigger refresh after creating a decision
  const refreshAfterDecision = useCallback(() => {
    console.log('Refreshing data after new decision');
    triggerRefresh();
  }, [triggerRefresh]);

  // Trigger refresh after creating a branch
  const refreshAfterBranch = useCallback(() => {
    console.log('Refreshing data after new branch');
    triggerRefresh();
  }, [triggerRefresh]);

  const value = {
    refreshTrigger,
    triggerRefresh,
    refreshAfterDecision,
    refreshAfterBranch
  };

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
};
