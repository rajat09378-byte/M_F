import { createContext, useContext, useState, useCallback } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [sessionData, setSessionData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const clearSession = useCallback(() => {
    setSessionData(null);
    setError(null);
    setActiveTab('upload');
  }, []);

  const value = {
    sessionData,
    setSessionData,
    isLoading,
    setIsLoading,
    error,
    setError,
    activeTab,
    setActiveTab,
    clearSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within SessionProvider');
  return context;
};
