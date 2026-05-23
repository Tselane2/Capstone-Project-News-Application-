// @refresh reset
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { UserProfile } from "@workspace/api-client-react";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Shape of the authentication context available to all child components. */
interface AuthContextType {
  /** The currently authenticated user, or null when logged out. */
  currentUser: UserProfile | null;
  /** The raw JWT string stored in localStorage, or null when logged out. */
  token: string | null;
  /** Persist a new session — stores the token and user profile in localStorage. */
  login: (token: string, user: UserProfile) => void;
  /** Clear the current session from state and localStorage. */
  logout: () => void;
  /** True when a valid token is present in state. */
  isAuthenticated: boolean;
  /** True while the initial localStorage hydration is in progress. */
  isLoading: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

/**
 * Wraps the application and makes authentication state available via useAuth().
 *
 * On mount it attempts to restore a previous session from localStorage. The
 * token and serialised user profile are stored under the keys "auth_token" and
 * "auth_user" respectively. If the stored JSON is malformed it is silently
 * discarded so the user is treated as logged out rather than crashing the app.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate auth state from localStorage on first render
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      setToken(storedToken);
      const storedUser = localStorage.getItem("auth_user");
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          // Malformed JSON — discard and treat the user as logged out
        }
      }
    }
    setIsLoading(false);
  }, []);

  /**
   * Persist a new authenticated session.
   * Called by the login and register pages after receiving a JWT from the API.
   */
  const login = (newToken: string, user: UserProfile) => {
    localStorage.setItem("auth_token", newToken);
    localStorage.setItem("auth_user", JSON.stringify(user));
    setToken(newToken);
    setCurrentUser(user);
  };

  /**
   * Clear the current session.
   * The server-side JWT cannot be invalidated, so the client simply discards it.
   */
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Access the authentication context from any component inside AuthProvider.
 * Throws if called outside the provider tree to catch wiring mistakes early.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
