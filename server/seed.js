import crypto from "crypto";
import { db, persist } from "./db.js";
import { hashPassword } from "./auth.js";
import { ALL_PERMISSIONS } from "./permissions.js";

// Creates the initial admin account (the first user / owner) if none exists.
// Credentials default to Chaeulso / Chaeulkeren67 but can be overridden with
// ADMIN_USERNAME / ADMIN_PASSWORD env vars. The password is only ever worked
// with as a scrypt hash server-side — never shipped to the client bundle.
export function seed() {
  if (!db.users.find((u) => u.role === "admin")) {
    const now = Date.now();
    const username = process.env.ADMIN_USERNAME || "Chaeulso";
    const password = process.env.ADMIN_PASSWORD || "Chaeulkeren67";
    db.users.push({
      id: crypto.randomUUID(),
      username,
      password_hash: hashPassword(password),
      role: "admin",             // admin => implicit all permissions
      status: "active",          // active | suspended
      permissions: [...ALL_PERMISSIONS],
      page_limit: 50,
      created_at: now,
      updated_at: now,
      last_activity: now,
    });
    persist();
  }
}
