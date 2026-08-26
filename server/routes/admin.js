import { Router } from "express";
import crypto from "crypto";
import { db, persist } from "../db.js";
import { hashPassword, verifyPassword } from "../auth.js";
import { requirePermission, attachUser, PERMISSIONS } from "../permissions.js";
import { computeStats } from "../analytics.js";

const router = Router();
router.use(attachUser);

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,24}$/;

// ---- Users ----
router.get("/users", requirePermission("VIEW_USERS"), (_req, res) => {
  res.json({ users: listUsers() });
});

router.post("/users", requirePermission("MANAGE_USERS"), (req, res) => {
  const { username, password, status, permissions, page_limit } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  if (!USERNAME_RE.test(username)) {
    return res
      .status(400)
      .json({ error: "Username must be 3-24 characters (letters, numbers, ._-)" });
  }
  if (String(password).length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters" });
  }
  const exists = db.users.some(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  if (exists) return res.status(409).json({ error: "Username already exists" });

  const now = Date.now();
  const user = {
    id: crypto.randomUUID(),
    username: String(username),
    password_hash: hashPassword(password),
    role: "user",
    status: status === "suspended" ? "suspended" : "active",
    permissions: normalizePerms(permissions),
    page_limit: clampLimit(page_limit, 50),
    created_at: now,
    updated_at: now,
    last_activity: now,
  };
  db.users.push(user);
  persist();

  res.status(201).json({ user: userRow(user), message: "User created" });
});

router.patch("/users/:id", requirePermission("MANAGE_USERS"), (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  const otherAdmins = db.users.filter((u) => u.role === "admin" && u.id !== user.id);

  const { status, permissions, page_limit, role, password } = req.body || {};

  // An admin may edit any user (including other admins) — but never remove the
  // LAST admin, so the site can't be locked out.
  if (role !== undefined && user.role === "admin" && role === "user" && otherAdmins.length === 0) {
    return res.status(400).json({ error: "Cannot demote the last admin" });
  }
  if (status !== undefined) {
    if (!["active", "suspended"].includes(status))
      return res.status(400).json({ error: "Invalid status" });
    user.status = status;
  }
  if (permissions !== undefined) user.permissions = normalizePerms(permissions);
  if (page_limit !== undefined) user.page_limit = clampLimit(page_limit, 50);

  // Owner can change a user's role (e.g. grant/revoke admin) and reset a
  // password. The current account's password is changed via /me/password.
  if (role !== undefined) {
    if (!["user", "admin"].includes(role))
      return res.status(400).json({ error: "Invalid role" });
    user.role = role;
  }
  if (password !== undefined) {
    if (String(password).length < 4)
      return res.status(400).json({ error: "Password must be at least 4 characters" });
    user.password_hash = hashPassword(password);
  }

  user.updated_at = Date.now();
  persist();
  res.json({ user: userRow(user), message: "User updated" });
});

// Change your OWN password (requires being logged in; no special permission).
router.post("/me/password", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { current, next } = req.body || {};
  if (!next || String(next).length < 4)
    return res.status(400).json({ error: "New password must be at least 4 characters" });
  if (!verifyPassword(current || "", req.user.password_hash))
    return res.status(400).json({ error: "Current password is incorrect" });
  req.user.password_hash = hashPassword(next);
  req.user.updated_at = Date.now();
  persist();
  res.json({ message: "Password changed" });
});

router.delete("/users/:id", requirePermission("MANAGE_USERS"), (req, res) => {
  const user = db.users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  // never delete the last admin, or we lock ourselves out
  if (user.role === "admin") {
    const otherAdmins = db.users.filter((u) => u.role === "admin" && u.id !== user.id);
    if (otherAdmins.length === 0)
      return res.status(400).json({ error: "Cannot delete the last admin" });
  }

  // also remove their sessions and pages
  db.users = db.users.filter((u) => u.id !== user.id);
  db.sessions = db.sessions.filter((s) => s.userId !== user.id);
  db.pages = db.pages.filter((p) => p.owner_id !== user.id);
  persist();
  res.json({ message: "User deleted" });
});

// ---- Pages (management) ----
router.get("/pages", requirePermission("MANAGE_PAGES"), (_req, res) => {
  res.json({ pages: listPages() });
});

router.patch("/pages/:id", requirePermission("MANAGE_PAGES"), (req, res) => {
  const page = db.pages.find((p) => p.id === req.params.id);
  if (!page) return res.status(404).json({ error: "Page not found" });
  const { status, settings } = req.body || {};
  if (status !== undefined) {
    if (!["active", "suspended"].includes(status))
      return res.status(400).json({ error: "Invalid status" });
    page.status = status;
  }
  if (settings && typeof settings === "object") {
    page.settings = { ...page.settings, ...settings };
  }
  page.updated_at = Date.now();
  persist();
  res.json({ page: pageRow(page) });
});

router.delete("/pages/:id", requirePermission("MANAGE_PAGES"), (req, res) => {
  const page = db.pages.find((p) => p.id === req.params.id);
  if (!page) return res.status(404).json({ error: "Page not found" });
  db.pages = db.pages.filter((p) => p.id !== page.id);
  persist();
  res.json({ message: "Page deleted" });
});

// ---- Stats ----
router.get("/stats", requirePermission("VIEW_STATS"), (_req, res) => {
  const users = db.users || [];
  res.json({
    stats: {
      total_users: users.length,
      active_users: users.filter((u) => u.status === "active").length,
      suspended_users: users.filter((u) => u.status === "suspended").length,
      total_pages: (db.pages || []).length,
      active_pages: (db.pages || []).filter((p) => p.status === "active").length,
      suspended_pages: (db.pages || []).filter((p) => p.status === "suspended").length,
      ...computeStats(),
    },
  });
});

router.get("/meta", requirePermission("VIEW_STATS"), (_req, res) => {
  res.json({ permissions: PERMISSIONS });
});

// ---- helpers ----
function normalizePerms(perms) {
  if (!Array.isArray(perms)) return [];
  return [...new Set(perms.filter((p) => PERMISSIONS.includes(p)))];
}
function clampLimit(n, max) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 5;
  return Math.min(Math.max(1, Math.floor(v)), max);
}
function listUsers() {
  return db.users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    status: u.status,
    permissions: u.role === "admin" ? ["*"] : (u.permissions || []),
    page_limit: u.page_limit,
    created_at: u.created_at,
    last_activity: u.last_activity,
    pages_count: (db.pages || []).filter((p) => p.owner_id === u.id).length,
  }));
}
function userRow(u) {
  return {
    id: u.id,
    username: u.username,
    role: u.role,
    status: u.status,
    permissions: u.role === "admin" ? ["*"] : (u.permissions || []),
    page_limit: u.page_limit,
    created_at: u.created_at,
    last_activity: u.last_activity,
  };
}
function listPages() {
  return (db.pages || []).map(pageRow);
}
function pageRow(p) {
  const owner = (db.users || []).find((u) => u.id === p.owner_id);
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    description: p.description || "",
    status: p.status,
    owner_id: p.owner_id,
    owner: owner ? owner.username : "—",
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export default router;
