import React, { createContext, useContext, useMemo, useState } from 'react';

const StudentSessionContext = createContext(null);

export function StudentSessionProvider({ children }) {
  const [selectedBatch, setSelectedBatch] = useState(null);

  const value = useMemo(
    () => ({
      selectedBatch,
      setSelectedBatch,
    }),
    [selectedBatch]
  );

  return (
    <StudentSessionContext.Provider value={value}>
      {children}
    </StudentSessionContext.Provider>
  );
}

export function useStudentSession() {
  const context = useContext(StudentSessionContext);

  if (!context) {
    throw new Error('useStudentSession must be used within StudentSessionProvider');
  }

  return context;
}
