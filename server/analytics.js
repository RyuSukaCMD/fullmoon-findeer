import crypto from "crypto";
import { db, persist } from "./db.js";

// View tracking with per-(session,target) dedupe so a single visit / remount /
// StrictMode double-effect can't inflate counts. A short window guards against
// double-fires; separate visits still count normally.
const DEDUPE_WINDOW_MS = 45 * 1000;
const seen = new Map(); // key -> lastSeenTs

export function trackView({ sessionId, target }) {
  const sid = String(sessionId || "anon");
  const key = `${sid}::${target}`;

  const last = seen.get(key);
  const now = Date.now();
  if (last && now - last < DEDUPE_WINDOW_MS) return { recorded: false };

  seen.set(key, now);
  // keep the map bounded
  if (seen.size > 5000) {
    for (const [k, ts] of seen) if (now - ts > DEDUPE_WINDOW_MS) seen.delete(k);
  }

  const view = {
    id: crypto.randomUUID(),
    target,             // 'main' or a page_id
    page_id: target === "main" ? null : target,
    session_id: sid,
    timestamp: now,
  };
  db.views.push(view);
  persist();
  return { recorded: true };
}

// ---- Aggregations for the admin dashboard ----
export function computeStats() {
  const views = db.views || [];
  const users = db.users || [];
  const pages = db.pages || [];

  const totalViews = views.length;
  const mainPageViews = views.filter((v) => v.target === "main").length;

  // views per user (sum of views on pages owned by that user)
  const perUser = users.map((u) => {
    const ownedIds = new Set(pages.filter((p) => p.owner_id === u.id).map((p) => p.id));
    const viewsForUser = views.filter((v) => v.page_id && ownedIds.has(v.page_id)).length;
    return { user_id: u.id, username: u.username, role: u.role, views: viewsForUser };
  });

  // views per page
  const perPage = pages.map((p) => ({
    page_id: p.id,
    slug: p.slug,
    title: p.title,
    owner: (users.find((u) => u.id === p.owner_id) || {}).username || "—",
    status: p.status,
    views: views.filter((v) => v.page_id === p.id).length,
  }));

  // views per day (last 14 days) for the chart
  const perDay = [];
  const DAY = 24 * 3600 * 1000;
  const start = Date.now() - 13 * DAY;
  for (let i = 0; i < 14; i++) {
    const from = start + i * DAY;
    const to = from + DAY;
    perDay.push({
      day: new Date(from).toISOString().slice(0, 10),
      views: views.filter((v) => v.timestamp >= from && v.timestamp < to).length,
    });
  }

  return { totalViews, mainPageViews, perUser, perPage, perDay };
}
