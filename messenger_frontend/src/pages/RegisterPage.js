import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register({ email, password, displayName });
      nav("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Registration failed.");
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
              <div className="subtitle">Create account</div>
            </div>
          </div>
        </div>

        <h1 className="authTitle">Get started</h1>
        <p className="authSubtitle">
          Create an account to join group chats and message in real time.
        </p>

        <form className="formGrid" onSubmit={onSubmit}>
          <div>
            <div className="label">Display name</div>
            <input
              className="input"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Johnson"
              autoComplete="nickname"
              required
            />
          </div>

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
              placeholder="At least 8 characters"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <button className="btn btnPrimary" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>

          {error ? <div className="alert" role="alert">{error}</div> : null}

          <div className="helperRow">
            <div />
            <Link className="link" to="/login">Already have an account?</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
