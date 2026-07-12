import React, { createContext, useContext, useMemo, useState } from 'react';

const UserSessionContext = createContext(null);

export function UserSessionProvider({ children }) {
  const [userProfile, setUserProfile] = useState(null);
  const [activeChild, setActiveChild] = useState(null);

  const value = useMemo(
    () => ({
      userProfile,
      setUserProfile,
      activeChild,
      setActiveChild,
    }),
    [userProfile, activeChild]
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