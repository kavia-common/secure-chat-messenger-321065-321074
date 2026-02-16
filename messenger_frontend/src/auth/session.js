const STORAGE_KEY = "scm_session_v1";

// PUBLIC_INTERFACE
export function loadSession() {
  /** Load persisted session from localStorage. */
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { token: null, user: null };
    const parsed = JSON.parse(raw);
    return {
      token: parsed?.token || null,
      user: parsed?.user || null
    };
  } catch {
    return { token: null, user: null };
  }
}

// PUBLIC_INTERFACE
export function saveSession({ token, user }) {
  /** Persist session to localStorage. */
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
}

// PUBLIC_INTERFACE
export function clearSession() {
  /** Clear session from localStorage. */
  localStorage.removeItem(STORAGE_KEY);
}
