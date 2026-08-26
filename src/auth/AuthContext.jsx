import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api.auth.me();
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (username, password) => {
    const { user, token } = await api.auth.login(username, password);
    setToken(token); // persist the session so we don't re-login constantly
    setUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore */
    }
    setToken("");
    setUser(null);
  }, []);

  // Server-side truth for permissions is authoritative; this is just a UI hint.
  const hasPermission = useCallback(
    (perm) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return Array.isArray(user.permissions) && user.permissions.includes(perm);
    },
    [user]
  );

  const changeOwnPassword = useCallback(
    async (current, next) => {
      const res = await api.admin.passwords.changeOwn(current, next);
      return res;
    },
    []
  );

  const value = { user, loading, login, logout, refresh, hasPermission, changeOwnPassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
