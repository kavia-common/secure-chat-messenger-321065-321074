import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const redirectTo = useMemo(() => location.state?.from || "/", [location.state]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login({ email, password });
      nav(redirectTo, { replace: true });
    } catch (err) {
      setError(err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="authShell">
      <div className="authCard">
        <div className="authHeader">
          <div className="brand">
            <div className="brandMark" aria-hidden="true" />
            <div className="brandText">
              <div className="title">Secure Messenger</div>
              <div className="subtitle">Sign in</div>
            </div>
          </div>
        </div>

        <h1 className="authTitle">Welcome back</h1>
        <p className="authSubtitle">
          Sign in to continue to your conversations.
        </p>

        <form className="formGrid" onSubmit={onSubmit}>
          <div>
            <div className="label">Email</div>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <div className="label">Password</div>
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="btn btnPrimary" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>

          {error ? <div className="alert" role="alert">{error}</div> : null}

          <div className="helperRow">
            <div className="kbdHint">Tip: backend endpoints may be added in later steps.</div>
            <Link className="link" to="/register">Create account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
