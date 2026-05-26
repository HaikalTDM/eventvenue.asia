"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useDataMode } from "@/lib/data-mode";
import { mockVendorUsers } from "@/lib/vendor-data";

type User = {
  id: string;
  name: string;
  email: string;
  role: "customer" | "vendor" | "admin";
  phone?: string;
  avatarUrl?: string;
  isVerified: boolean;
  vendorId?: string;
  vendorType?: string;
  vendorName?: string;
  createdAt: string;
};

type VendorAuthContextType = {
  vendor: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const VendorAuthContext = createContext<VendorAuthContextType>({
  vendor: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => false,
  logout: async () => {},
});

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { mode } = useDataMode();

  useEffect(() => {
    if (mode === "mock") {
      const stored = localStorage.getItem("ev_vendor_auth");
      if (stored) {
        try {
          const v = JSON.parse(stored);
          setVendor({
            id: v.id || "mock-vendor",
            name: v.name,
            email: v.email,
            role: "vendor",
            phone: v.phone,
            avatarUrl: v.avatarUrl,
            isVerified: v.isVerified ?? true,
            vendorId: v.id,
            vendorType: v.vendorType || "venue",
            vendorName: v.businessName,
            createdAt: v.joinedAt || "2025-01-01",
          });
        } catch {
          localStorage.removeItem("ev_vendor_auth");
        }
      }
      setIsLoading(false);
    } else {
      fetch("/api/v1/auth/session")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.user?.role === "vendor") {
            setVendor(data.user);
          }
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [mode]);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (mode === "mock") {
      const found = mockVendorUsers.find((v) => v.email === email);
      if (found) {
        const v: User = {
          id: found.id,
          name: found.name,
          email: found.email,
          role: "vendor",
          phone: found.phone,
          avatarUrl: found.avatarUrl,
          isVerified: found.isVerified,
          vendorId: found.id,
          vendorType: found.vendorType === "service" ? "service_provider" : "venue_owner",
          vendorName: found.businessName,
          createdAt: found.joinedAt,
        };
        setVendor(v);
        localStorage.setItem("ev_vendor_auth", JSON.stringify(found));
        return true;
      }
      return false;
    }

    try {
      const res = await fetch("/api/v1/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.user.role !== "vendor") return false;
      setVendor(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    if (mode === "mock") {
      setVendor(null);
      localStorage.removeItem("ev_vendor_auth");
      return;
    }
    await fetch("/api/v1/auth/sign-out", { method: "POST" });
    setVendor(null);
  };

  return (
    <VendorAuthContext.Provider value={{ vendor, isAuthenticated: !!vendor, isLoading, login, logout }}>
      {children}
    </VendorAuthContext.Provider>
  );
}

export function useVendorAuth() {
  return useContext(VendorAuthContext);
}
