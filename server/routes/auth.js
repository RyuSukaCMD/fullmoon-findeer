import { Router } from "express";
import crypto from "crypto";
import {
  verifyPassword,
  createSession,
  destroySession,
  setSessionCookie,
  clearSessionCookie,
} from "../auth.js";
import { db, persist } from "../db.js";
import { attachUser } from "../permissions.js";

const router = Router();
router.use(attachUser);

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password are required" });
  }
  const user = db.users.find(
    (u) => u.username.toLowerCase() === String(username).toLowerCase()
  );
  // constant-ish response to avoid user enumeration
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: "Invalid username or password" });
  }
  if (user.status === "suspended") {
    return res.status(403).json({ error: "This account is suspended" });
  }

  const token = createSession(user.id);
  user.last_activity = Date.now();
  setSessionCookie(res, token);
  persist();

  // Return the token so the client can hold it as a bearer token (persists
  // across reloads / where cookies are unavailable).
  res.json({ user: publicUser(user), token });
});

router.post("/logout", (req, res) => {
  if (req.sessionToken) destroySession(req.sessionToken);
  clearSessionCookie(res);
  res.json({ ok: true });
});

router.get("/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: publicUser(req.user) });
});

function publicUser(u) {
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

export default router;
