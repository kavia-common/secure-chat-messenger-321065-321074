import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

// PUBLIC_INTERFACE
export function RequireAuth({ children }) {
  /** Protect routes that require authentication. */
  const { isAuthenticated, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return (
      <div className="authShell">
        <div className="authCard">
          <h1 className="authTitle">Loading…</h1>
          <p className="authSubtitle">Preparing your secure session.</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
