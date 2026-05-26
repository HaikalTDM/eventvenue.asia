"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useDataMode } from "@/lib/data-mode";

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

type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string, phone?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "phone" | "avatarUrl">>) => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  updateProfile: () => {},
  isLoading: true,
});

async function fetchSession(): Promise<User | null> {
  try {
    const res = await fetch("/api/v1/auth/session");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { mode } = useDataMode();

  useEffect(() => {
    if (mode === "mock") {
      const stored = localStorage.getItem("ev_mock_user");
      if (stored) {
        try {
          const u = JSON.parse(stored);
          setUser({
            id: "mock-1",
            name: u.name,
            email: u.email,
            role: u.role || "customer",
            phone: u.phone,
            avatarUrl: u.avatarUrl,
            isVerified: true,
            createdAt: u.joinedAt || "2025-01-01",
          });
        } catch {
          localStorage.removeItem("ev_mock_user");
        }
      }
      setIsLoading(false);
    } else {
      fetchSession().then((u) => {
        setUser(u);
        setIsLoading(false);
      });
    }
  }, [mode]);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    if (mode === "mock") {
      const mockUser: User = {
        id: "mock-1",
        name: email.split("@")[0],
        email,
        phone: "+60 12 345 6789",
        avatarUrl: "https://i.pravatar.cc/100?img=32",
        role: "customer",
        isVerified: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUser(mockUser);
      localStorage.setItem("ev_mock_user", JSON.stringify({ name: mockUser.name, email: mockUser.email, role: "customer" }));
      return true;
    }

    try {
      const res = await fetch("/api/v1/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const signUp = async (name: string, email: string, password: string, phone?: string): Promise<boolean> => {
    if (mode === "mock") {
      const mockUser: User = {
        id: "mock-1",
        name,
        email,
        phone: phone || "+60 12 345 6789",
        avatarUrl: "https://i.pravatar.cc/100?img=32",
        role: "customer",
        isVerified: true,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setUser(mockUser);
      localStorage.setItem("ev_mock_user", JSON.stringify({ name, email, phone, role: "customer" }));
      return true;
    }

    try {
      const res = await fetch("/api/v1/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const signOut = async () => {
    if (mode === "mock") {
      setUser(null);
      localStorage.removeItem("ev_mock_user");
      return;
    }
    await fetch("/api/v1/auth/sign-out", { method: "POST" });
    setUser(null);
  };

  const updateProfile = (updates: Partial<Pick<User, "name" | "phone" | "avatarUrl">>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    if (mode === "mock") {
      localStorage.setItem("ev_mock_user", JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, updateProfile, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
