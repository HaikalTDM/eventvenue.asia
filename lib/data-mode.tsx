"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type DataMode = "mock" | "live";

type DataModeContextType = {
  mode: DataMode;
  setMode: (m: DataMode) => void;
};

const DataModeContext = createContext<DataModeContextType>({
  mode: "mock",
  setMode: () => {},
});

const STORAGE_KEY = "ev_data_mode";

export function DataModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<DataMode>("mock");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "mock" || stored === "live") {
      setModeState(stored);
    }
    setMounted(true);
  }, []);

  const setMode = (m: DataMode) => {
    setModeState(m);
    localStorage.setItem(STORAGE_KEY, m);
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <DataModeContext.Provider value={{ mode, setMode }}>
      {children}
    </DataModeContext.Provider>
  );
}

export function useDataMode() {
  return useContext(DataModeContext);
}
