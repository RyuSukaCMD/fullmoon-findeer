import crypto from "crypto";
import { db, persist } from "./db.js";

// Password hashing: scrypt with a per-user random salt. Never store plaintext.
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password, stored) {
  if (typeof stored !== "string" || !stored.includes(":")) return false;
  const [salt, hash] = stored.split(":");
  const expected = Buffer.from(hash, "hex");
  const actual = crypto.scryptSync(String(password), salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.sessions.push({
    token,
    userId,
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_TTL,
  });
  persist();
  return token;
}

export function getSessionUser(token) {
  if (!token) return null;
  const now = Date.now();
  // prune expired
  const valid = db.sessions.filter((s) => s.expiresAt > now);
  if (valid.length !== db.sessions.length) {
    db.sessions = valid;
    persist();
  }
  const sess = db.sessions.find((s) => s.token === token && s.expiresAt > now);
  if (!sess) return null;
  return db.users.find((u) => u.id === sess.userId) || null;
}

export function destroySession(token) {
  db.sessions = db.sessions.filter((s) => s.token !== token);
  persist();
}

// ---- Cookie helpers (no external dep) ----
export function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

export const SESSION_COOKIE = "fm_session";

export function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=Lax`
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
}
