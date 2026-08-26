import { api } from "./api";

// Tracks a view exactly once per component mount, guarding against React
// StrictMode double-effecting and re-renders. The server also dedupes by
// session+target, so a single visit never inflates the count.
const sent = new Set();

export function trackView(target, { once = true } = {}) {
  const key = `${target}`;
  if (once && sent.has(key)) return;
  if (once) sent.add(key);
  api.analytics.view(target).catch(() => {
    // best-effort tracking; never block the UI on a network hiccup
  });
}
