import { api } from "./api";

// A client-side pool of real Roblox avatars fetched from the backend. The pool
// is shared across all consumers so we avoid duplicate requests and keep a
// stable roster of distinct avatars.

let pool = [];          // [{ id, name, displayName, avatarUrl }]
let loading = false;
const listeners = new Set();

function notify() {
  listeners.forEach((l) => l(pool));
}
export function subscribePool(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
export function getPool() {
  return pool;
}

function merge(newOnes) {
  const seen = new Map(pool.map((p) => [p.id, p]));
  (newOnes || []).forEach((x) => {
    if (x && x.id && !seen.has(x.id)) seen.set(x.id, x);
  });
  pool = [...seen.values()];
}

export async function ensurePool(min = 40) {
  if (pool.length >= min || loading) return;
  loading = true;
  try {
    const { avatars } = await api.roblox.avatars(min);
    merge(avatars);
    notify();
  } catch {
    /* best-effort; monogram fallback covers the gap */
  } finally {
    loading = false;
  }
}

// Pull `count` distinct avatars. `exclude` may contain ids and/or names so
// that no username/display name is ever reused across the roster.
export function takeAvatars(count, exclude = []) {
  if (count <= 0) return [];
  const ex = new Set(exclude);
  const avail = pool.filter(
    (p) => !ex.has(p.id) && !ex.has(p.name) && !ex.has(p.displayName || p.name)
  );
  // shuffle
  for (let i = avail.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [avail[i], avail[j]] = [avail[j], avail[i]];
  }
  return avail.slice(0, count);
}

export function poolSize() {
  return pool.length;
}
