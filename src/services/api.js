// Thin API client. All calls go through the same-origin Vite proxy (local dev)
// or the Vercel serverless API. Auth works via: (a) an httpOnly cookie, and
// (b) a bearer token kept client-side so sessions persist across reloads and
// even where cookies are unavailable (e.g. sandboxed previews).

const ROOT = "/api";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// ---- session token (persisted, with in-memory fallback) ----
let _memToken = "";
const TOKEN_KEY = "fm_auth_token";
export function getToken() {
  if (_memToken) return _memToken;
  try {
    const v = localStorage.getItem(TOKEN_KEY);
    _memToken = v || "";
    return _memToken;
  } catch {
    return _memToken;
  }
}
export function setToken(t) {
  _memToken = t || "";
  try {
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked -> keep in memory */
  }
}

async function request(path, { method = "GET", body, signal } = {}) {
  const token = getToken();
  const res = await fetch(ROOT + path, {
    method,
    credentials: "include", // cookie, when available
    headers: {
      ...(body ? { "Content-Type": "application/json" } : undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const msg = data?.error || data?.message || `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data;
}

export const api = {
  auth: {
    me: () => request("/auth/me"),
    login: (username, password) =>
      request("/auth/login", { method: "POST", body: { username, password } }),
    logout: () => request("/auth/logout", { method: "POST" }),
  },
  admin: {
    users: {
      list: () => request("/admin/users"),
      create: (u) => request("/admin/users", { method: "POST", body: u }),
      update: (id, patch) => request(`/admin/users/${id}`, { method: "PATCH", body: patch }),
      remove: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
    },
    passwords: {
      changeOwn: (current, next) =>
        request("/admin/me/password", { method: "POST", body: { current, next } }),
    },
    pages: {
      list: () => request("/admin/pages"),
      update: (id, patch) => request(`/admin/pages/${id}`, { method: "PATCH", body: patch }),
      remove: (id) => request(`/admin/pages/${id}`, { method: "DELETE" }),
    },
    stats: () => request("/admin/stats"),
  },
  pages: {
    mine: () => request("/pages/mine"),
    slugAvailable: (slug, exclude) =>
      request(`/pages/slug-available?slug=${encodeURIComponent(slug)}&exclude=${encodeURIComponent(exclude || "")}`),
    create: (p) => request("/pages", { method: "POST", body: p }),
    update: (id, p) => request(`/pages/${id}`, { method: "PUT", body: p }),
    remove: (id) => request(`/pages/${id}`, { method: "DELETE" }),
    get: (slug) => request(`/pages/${encodeURIComponent(slug)}`),
  },
  roblox: {
    avatars: (count = 40) => request(`/roblox/avatars?count=${count}`),
  },
  site: {
    get: () => request("/site"),
    update: (config) => request("/site", { method: "PUT", body: config }),
  },
  analytics: {
    view: (target) =>
      request("/analytics/view", {
        method: "POST",
        body: { session_id: getSessionId(), target },
      }),
  },
};

let _sessionId = null;
export function getSessionId() {
  if (_sessionId) return _sessionId;
  try {
    let v = localStorage.getItem("fm_session_id");
    if (!v) {
      v = crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("fm_session_id", v);
    }
    _sessionId = v;
    return v;
  } catch {
    return `anon-${Date.now()}`;
  }
}
