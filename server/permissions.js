// Central RBAC definition. Permissions are checked server-side on every
// protected route — the UI only reflects them, it never enforces them.

export const PERMISSIONS = [
  "CREATE_PAGE",
  "EDIT_PAGE",
  "DELETE_PAGE",
  "VIEW_STATS",
  "VIEW_USERS",
  "MANAGE_USERS",
  "MANAGE_PAGES",
];

export const ALL_PERMISSIONS = PERMISSIONS;

export function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === "admin") return true; // admins implicitly have all
  return Array.isArray(user.permissions) && user.permissions.includes(permission);
}

// Express middleware factory: rejects with 401 when unauthenticated and 403
// when the authenticated user lacks the required permission.
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (req.user.status === "suspended")
      return res.status(403).json({ error: "This account is suspended" });
    if (!hasPermission(req.user, permission))
      return res.status(403).json({ error: "Forbidden: missing permission" });
    next();
  };
}

// Mounts req.user onto the request based on the session cookie OR an
// `Authorization: Bearer <token>` header. Supporting the bearer token means
// authentication survives even where cookies are blocked (e.g. sandboxed
// preview iframes) and lets the client persist a session without re-login.
import { parseCookies, getSessionUser, SESSION_COOKIE } from "./auth.js";
export function attachUser(req, _res, next) {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies[SESSION_COOKIE];
  const auth = req.headers.authorization;
  if (!token && auth && auth.startsWith("Bearer ")) token = auth.slice(7).trim();
  req.user = getSessionUser(token);
  req.sessionToken = token;
  next();
}
