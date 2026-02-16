import { apiGet, apiPost } from "./client";

/**
 * NOTE: Backend swagger currently only exposes GET `/` in this environment.
 * These endpoints are implemented as the expected contract for the full app.
 * If backend paths differ, only this file should need adjustments.
 */

// PUBLIC_INTERFACE
export async function login({ email, password }) {
  /** Log in and return { token, user }. */
  // Expected backend shape (common): { token, user }
  return apiPost("/auth/login", { email, password });
}

// PUBLIC_INTERFACE
export async function register({ email, password, displayName }) {
  /** Register a new user and return { token, user }. */
  return apiPost("/auth/register", { email, password, displayName });
}

// PUBLIC_INTERFACE
export async function getMe(token) {
  /** Fetch current user profile from backend. */
  return apiGet("/auth/me", { token });
}

// PUBLIC_INTERFACE
export async function healthCheck() {
  /** Basic health check (uses current backend GET `/`). */
  return apiGet("/");
}
