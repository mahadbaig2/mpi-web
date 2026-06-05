"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { GoogleUserInfo } from "@/lib/google-auth";

interface User {
  email: string;
  name: string;
  picture?: string;
  provider?: "google" | "local";
}

interface AuthContextType {  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (userInfo: GoogleUserInfo) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("cardioscan_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem("cardioscan_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Sync user profile to Supabase (fire-and-forget)
  const syncProfile = (userData: User) => {
    fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    }).catch(e => console.warn("Profile sync skipped:", e));
  };

  const loginWithGoogle = async (userInfo: GoogleUserInfo) => {
    try {
      if (!userInfo.email) {
        return { success: false, error: "Google account did not return an email address." };
      }

      const userData: User = {
        email: userInfo.email,
        name: userInfo.name || userInfo.email.split("@")[0],
        picture: userInfo.picture,
        provider: "google",
      };
      setUser(userData);
      localStorage.setItem("cardioscan_user", JSON.stringify(userData));
      syncProfile(userData);
      return { success: true };
    } catch {
      return { success: false, error: "Google sign-in failed. Please try again." };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem("cardioscan_users") || "{}");
    if (users[email]) {
      return { success: false, error: "An account with this email already exists" };
    }

    users[email] = { name, email, passwordHash: hashPassword(password) };
    localStorage.setItem("cardioscan_users", JSON.stringify(users));

    const userData: User = { email, name, provider: "local" };
    setUser(userData);
    localStorage.setItem("cardioscan_user", JSON.stringify(userData));
    syncProfile(userData);

    return { success: true };
  };

  const login = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem("cardioscan_users") || "{}");
    const storedUser = users[email];

    if (!storedUser) {
      return { success: false, error: "No account found with this email" };
    }

    if (storedUser.passwordHash !== hashPassword(password)) {
      return { success: false, error: "Incorrect password" };
    }

    const userData: User = { email: storedUser.email, name: storedUser.name, provider: "local" };
    setUser(userData);
    localStorage.setItem("cardioscan_user", JSON.stringify(userData));
    syncProfile(userData);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("cardioscan_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
