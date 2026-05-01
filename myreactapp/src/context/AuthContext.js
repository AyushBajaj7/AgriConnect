import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  getSession,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setAuthLoading(true);
    const session = await getSession();
    setAuthUser(session.authenticated ? session.user : null);
    setAuthLoading(false);
    return session;
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const signIn = useCallback(async (username, password) => {
    const result = await loginRequest(username, password);
    if (result.success) {
      setAuthUser(result.user);
    }
    return result;
  }, []);

  const registerUser = useCallback(async (username, password) => {
    const result = await registerRequest(username, password);
    if (result.success) {
      setAuthUser(result.user);
    }
    return result;
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setAuthUser(null);
  }, []);

  const value = useMemo(
    () => ({
      authLoading,
      authUser,
      isAuthenticated: Boolean(authUser),
      refreshSession,
      signIn,
      registerUser,
      signOut,
    }),
    [authLoading, authUser, refreshSession, signIn, registerUser, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }
  return context;
}
