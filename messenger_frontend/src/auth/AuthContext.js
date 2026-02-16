import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getMe, login as apiLogin, register as apiRegister } from "../api/auth";
import { clearSession, loadSession, saveSession } from "./session";

const AuthContext = createContext(null);

// PUBLIC_INTERFACE
export function useAuth() {
  /** Access auth state and actions. */
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

// PUBLIC_INTERFACE
export function AuthProvider({ children }) {
  /** Provides { user, token, actions } to the app. */
  const [token, setToken] = useState(() => loadSession().token);
  const [user, setUser] = useState(() => loadSession().user);
  const [bootstrapping, setBootstrapping] = useState(true);

  const setSession = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    if (nextToken) saveSession({ token: nextToken, user: nextUser });
    else clearSession();
  }, []);

  const logout = useCallback(() => {
    setSession(null, null);
  }, [setSession]);

  const login = useCallback(async ({ email, password }) => {
    const data = await apiLogin({ email, password });
    // Support multiple shapes: {token,user} OR {accessToken,user} OR {token}
    const nextToken = data?.token || data?.accessToken || data?.jwt || null;
    const nextUser = data?.user || data?.profile || { email };
    if (!nextToken) throw new Error("Login succeeded but no token was returned.");
    setSession(nextToken, nextUser);
    return { token: nextToken, user: nextUser };
  }, [setSession]);

  const register = useCallback(async ({ email, password, displayName }) => {
    const data = await apiRegister({ email, password, displayName });
    const nextToken = data?.token || data?.accessToken || data?.jwt || null;
    const nextUser = data?.user || data?.profile || { email, displayName };
    if (!nextToken) throw new Error("Registration succeeded but no token was returned.");
    setSession(nextToken, nextUser);
    return { token: nextToken, user: nextUser };
  }, [setSession]);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setBootstrapping(true);

      const { token: t, user: u } = loadSession();
      if (!t) {
        if (!cancelled) setBootstrapping(false);
        return;
      }

      try {
        const me = await getMe(t);
        if (!cancelled) {
          setToken(t);
          setUser(me?.user || me || u || null);
          saveSession({ token: t, user: me?.user || me || u || null });
        }
      } catch {
        // Token invalid or backend not yet implementing /auth/me; keep session but allow UI to proceed
        if (!cancelled) {
          setToken(t);
          setUser(u || null);
        }
      } finally {
        if (!cancelled) setBootstrapping(false);
      }
    }

    bootstrap();
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    bootstrapping,
    isAuthenticated: Boolean(token),
    login,
    register,
    logout
  }), [token, user, bootstrapping, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
