import React, { createContext, useContext, useMemo, useState } from 'react';

const UserSessionContext = createContext(null);

export function UserSessionProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);

  const value = useMemo(
    () => ({
      userProfile,
      setUserProfile,
      selectedBatch,
      setSelectedBatch,
    }),
    [userProfile, selectedBatch]
  );

  return (
    <UserSessionContext.Provider value={value}>
      {children}
    </UserSessionContext.Provider>
  );
}

export function useUserSession() {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within UserSessionProvider');
  }
  return context;
}
