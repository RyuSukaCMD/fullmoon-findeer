import { Router } from "express";
import { db, persist } from "../db.js";
import { attachUser } from "../permissions.js";
import { getSiteConfig } from "../site.js";

const router = Router();
router.use(attachUser);

// Public read — the finder reads this on load.
router.get("/", (_req, res) => {
  res.json({ config: getSiteConfig() });
});

// Update — available to any authenticated user (the owner). Clamps values so
// the finder can never be misconfigured into an invalid state.
router.put("/", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const body = req.body || {};
  const cur = getSiteConfig();

  const clampInt = (v, d, min, max) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return d;
    return Math.min(max, Math.max(min, Math.round(n)));
  };

  const next = {
    ...cur,
    minServers: clampInt(body.minServers, cur.minServers, 1, 100),
    maxServers: clampInt(body.maxServers, cur.maxServers, 1, 100),
    updateIntervalMin: clampInt(body.updateIntervalMin, cur.updateIntervalMin, 5, 3600),
    updateIntervalMax: clampInt(body.updateIntervalMax, cur.updateIntervalMax, 5, 3600),
  };
  if (next.maxServers < next.minServers) next.maxServers = next.minServers;

  if (["display", "username", "avatar"].includes(body.playerNameStyle)) {
    next.playerNameStyle = body.playerNameStyle;
  }
  if (typeof body.mainPageUrl === "string") next.mainPageUrl = body.mainPageUrl.trim();
  if (typeof body.iframeSrc === "string") next.iframeSrc = body.iframeSrc.trim() || next.mainPageUrl;
  if (typeof body.logo === "string") next.logo = body.logo.trim();
  if (typeof body.title === "string" && body.title.trim()) next.title = body.title.trim().slice(0, 60);
  if (typeof body.brandLabel === "string" && body.brandLabel.trim()) next.brandLabel = body.brandLabel.trim().slice(0, 40);
  if (body.chrome && typeof body.chrome === "object") next.chrome = { ...cur.chrome, ...body.chrome };

  if (Array.isArray(body.addressPages)) {
    next.addressPages = body.addressPages
      .slice(0, 20)
      .map((p, i) => ({
        id: p.id || `a${i + 1}`,
        label: (p.label || `Page ${i + 1}`).slice(0, 30),
        address: (p.address || "").slice(0, 500),
      }));
    if (next.addressPages.length === 0)
      next.addressPages = [{ id: "a1", label: "Page 1", address: next.mainPageUrl }];
  }

  next.updated_at = Date.now();
  db.siteconfig = next;
  persist();

  res.json({ config: next, message: "Settings saved" });
});

export default router;
