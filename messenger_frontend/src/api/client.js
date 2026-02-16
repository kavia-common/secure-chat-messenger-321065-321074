/**
 * Minimal REST client with bearer token support.
 * Uses REACT_APP_API_BASE_URL from environment and falls back to same-origin if not set.
 */

const DEFAULT_TIMEOUT_MS = 20_000;

function getApiBaseUrl() {
  const base = process.env.REACT_APP_API_BASE_URL;
  return (base && base.trim()) ? base.trim().replace(/\/+$/, "") : "";
}

async function request(path, { method = "GET", token, body, headers } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

    const res = await fetch(url, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "");

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && (data.message || data.title || data.error)) ||
        (typeof data === "string" && data) ||
        `Request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } finally {
    clearTimeout(timeout);
  }
}

// PUBLIC_INTERFACE
export function apiGet(path, opts) {
  /** GET request helper. */
  return request(path, { ...opts, method: "GET" });
}

// PUBLIC_INTERFACE
export function apiPost(path, body, opts) {
  /** POST request helper. */
  return request(path, { ...opts, method: "POST", body });
}

// PUBLIC_INTERFACE
export function apiPut(path, body, opts) {
  /** PUT request helper. */
  return request(path, { ...opts, method: "PUT", body });
}

// PUBLIC_INTERFACE
export function apiDelete(path, opts) {
  /** DELETE request helper. */
  return request(path, { ...opts, method: "DELETE" });
}
