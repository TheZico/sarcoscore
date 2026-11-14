"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import {
  SessionUser,
  ROLE_HOME_ROUTE,
  AppFeature,
  canAccessFeature,
} from "@/lib/rls";
import { authenticateWithEmailPassword, loadDb } from "@/lib/db";

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => SessionUser;
  logout: () => void;
  hasAccess: (feature: AppFeature) => boolean;
}

const SESSION_ID_KEY = "sarcoscore_uid";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    try {
      window.localStorage.removeItem("sarcoscore_session_user_v1");
      const savedId = window.sessionStorage.getItem(SESSION_ID_KEY);
      if (savedId) {
        const db = loadDb();
        const found = db.users.find((u) => u.id === savedId);
        if (found) {
          setUser({
            id: found.id,
            email: found.email,
            fullName: found.fullName,
            role: found.role,
            linkedPatientId: found.linkedPatientId,
          });
        }
      }
    } catch {
      // ignore storage errors
    } finally {
      setReady(true);
    }
  }, []);

  const login = useCallback(
    (email: string, password: string): SessionUser => {
      const authenticated = authenticateWithEmailPassword(email, password);
      setUser(authenticated);
      try {
        window.sessionStorage.setItem(SESSION_ID_KEY, authenticated.id);
      } catch {
        // ignore
      }
      router.push(ROLE_HOME_ROUTE[authenticated.role]);
      return authenticated;
    },
    [router]
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      window.sessionStorage.removeItem(SESSION_ID_KEY);
    } catch {
      // ignore
    }
    router.push("/login");
  }, [router]);

  const hasAccess = useCallback(
    (feature: AppFeature) => canAccessFeature(user, feature),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
