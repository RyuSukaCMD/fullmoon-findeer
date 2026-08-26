import { Router } from "express";
import crypto from "crypto";
import { db, persist } from "../db.js";
import { requirePermission, attachUser } from "../permissions.js";

const router = Router();
router.use(attachUser);

const SLUG_RE = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
const MAX_PAGES = 50;

// slug availability (public, no auth needed — but used from the create form)
router.get("/slug-available", (req, res) => {
  const slug = String(req.query.slug || "").toLowerCase().trim();
  const excludeId = String(req.query.exclude || "");
  if (!slug) return res.json({ available: false });
  if (!SLUG_RE.test(slug)) return res.json({ available: false, reason: "invalid" });
  const taken = (db.pages || []).some(
    (p) => p.slug === slug && p.id !== excludeId
  );
  res.json({ available: !taken });
});

// list the authenticated user's own pages (auth only — owners always see theirs)
router.get("/mine", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const mine = (db.pages || [])
    .filter((p) => p.owner_id === req.user.id)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
      views: (db.views || []).filter((v) => v.page_id === p.id).length,
    }));
  res.json({ pages: mine });
});

// create a page — server enforces both permission AND page limit
router.post("/", requirePermission("CREATE_PAGE"), (req, res) => {
  const body = req.body || {};

  const slug = normalizeSlug(body.slug || body.pageSlug);
  if (!slug || !SLUG_RE.test(slug)) {
    return res.status(400).json({ error: "Invalid URL slug. Use lowercase letters, numbers, dashes or underscores." });
  }
  const taken = (db.pages || []).some((p) => p.slug === slug);
  if (taken) return res.status(409).json({ error: "This URL is already taken." });

  countPages(req.user, (err, { count, remaining }) => {
    if (err) return res.status(400).json({ error: err });
    if (remaining <= 0) {
      return res.status(400).json({ error: "Page creation limit reached." });
    }

    const now = Date.now();
    const page = {
      id: crypto.randomUUID(),
      owner_id: req.user.id,
      slug,
      title: body.title || "Untitled Page",
      description: normalizeString(body.description, 300),
      login_url: normalizeUrl(body.login_url),
      display_url: body.display_url,
      branding: body.branding,
      logo: normalizeUrl(body.logo),
      colors: {
        primary: body.colors?.primary || "#f5c86a",
        accent: body.colors?.accent || "#38bdf8",
        bg: body.colors?.bg || "#050914",
      },
      content: body.content || "",
      sections: Array.isArray(body.sections) ? body.sections.slice(0, 20) : [],
      buttons: Array.isArray(body.buttons) ? body.buttons.slice(0, 20) : [],
      browser_mode: !!body.browser_mode,
      iframe_src: normalizeUrl(body.iframe_src),
      address_pages: cleanAddressPages(body.address_pages),
      visibility: body.visibility === "private" ? "private" : "public",
      status: "active",
      created_at: now,
      updated_at: now,
    };
    db.pages.push(page);
    persist();
    res.status(201).json({ page: pageForOwner(page), message: "Page created" });
  });
});

// edit own page
router.put("/:id", requirePermission("EDIT_PAGE"), (req, res) => {
  const page = db.pages.find((p) => p.id === req.params.id);
  if (!page) return res.status(404).json({ error: "Page not found" });
  const isOwner = page.owner_id === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin)
    return res.status(403).json({ error: "Forbidden: not your page" });

  const body = req.body || {};
  if (body.slug !== undefined && body.slug !== page.slug) {
    const slug = normalizeSlug(body.slug);
    if (!slug || !SLUG_RE.test(slug))
      return res.status(400).json({ error: "Invalid URL slug" });
    const taken = (db.pages || []).some((p) => p.slug === slug && p.id !== page.id);
    if (taken) return res.status(409).json({ error: "This URL is already taken." });
    page.slug = slug;
  }
  if (body.title !== undefined) page.title = body.title || "Untitled Page";
  if (body.description !== undefined) page.description = normalizeString(body.description, 300);
  if (body.login_url !== undefined) page.login_url = normalizeUrl(body.login_url);
  if (body.display_url !== undefined) page.display_url = body.display_url;
  if (body.branding !== undefined) page.branding = body.branding;
  if (body.logo !== undefined) page.logo = normalizeUrl(body.logo);
  if (body.colors) page.colors = { ...page.colors, ...body.colors };
  if (body.content !== undefined) page.content = body.content;
  if (body.sections !== undefined) page.sections = body.sections.slice(0, 20);
  if (body.buttons !== undefined) page.buttons = body.buttons.slice(0, 20);
  if (body.browser_mode !== undefined) page.browser_mode = !!body.browser_mode;
  if (body.iframe_src !== undefined) page.iframe_src = normalizeUrl(body.iframe_src);
  if (body.address_pages !== undefined) page.address_pages = cleanAddressPages(body.address_pages);
  if (body.visibility !== undefined) page.visibility = body.visibility === "private" ? "private" : "public";

  page.updated_at = Date.now();
  persist();
  res.json({ page: pageForOwner(page), message: "Page updated" });
});

// delete own page
router.delete("/:id", requirePermission("DELETE_PAGE"), (req, res) => {
  const page = db.pages.find((p) => p.id === req.params.id);
  if (!page) return res.status(404).json({ error: "Page not found" });
  const isOwner = page.owner_id === req.user.id;
  const isAdmin = req.user.role === "admin";
  if (!isOwner && !isAdmin)
    return res.status(403).json({ error: "Forbidden: not your page" });
  db.pages = db.pages.filter((p) => p.id !== page.id);
  persist();
  res.json({ message: "Page deleted" });
});

// public render — no auth required, but must be active + public
router.get("/:slug", (req, res) => {
  const page = (db.pages || []).find((p) => p.slug === req.params.slug);
  if (!page) return res.status(404).json({ error: "Page not found" });
  res.json({ page: pageForPublic(page) });
});

// ---- helpers ----
function normalizeSlug(s) {
  return String(s || "").toLowerCase().trim().replace(/\s+/g, "-");
}
function normalizeString(s, max) {
  return typeof s === "string" ? s.slice(0, max) : "";
}
function normalizeUrl(u) {
  if (!u) return "";
  const s = String(u).trim();
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) return "";
  return s;
}
function cleanAddressPages(pages) {
  const list = Array.isArray(pages)
    ? pages.slice(0, 20).map((p, i) => ({
        id: p.id || `a${i + 1}`,
        label: (p.label || `Page ${i + 1}`).slice(0, 30),
        address: (p.address || "").slice(0, 500),
      }))
    : [];
  return list.length ? list : [{ id: "a1", label: "Page 1", address: "" }];
}
function countPages(user, cb) {
  const limit = user.role === "admin" ? MAX_PAGES : user.page_limit;
  const count = (db.pages || []).filter((p) => p.owner_id === user.id).length;
  cb(null, { count, remaining: Math.max(0, limit - count), limit });
}
function pageForOwner(p) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    status: p.status,
    visibility: p.visibility,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}
function pageForPublic(p) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description,
    branding: p.branding,
    logo: p.logo,
    login_url: p.login_url,
    display_url: p.display_url,
    colors: p.colors,
    content: p.content,
    sections: p.sections,
    buttons: p.buttons,
    browser_mode: p.browser_mode,
    iframe_src: p.iframe_src,
    address_pages: p.address_pages,
    status: p.status,
    visibility: p.visibility,
  };
}

export default router;
