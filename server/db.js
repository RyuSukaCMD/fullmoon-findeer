import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { supabaseEnabled, schedulePush } from "./supabase.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Storage location + persistence layer that adapts to the environment:
//
//   - Local / Node (default): writes to server/data/db.json (durable).
//   - DATA_DIR env override: use that directory.
//   - Vercel serverless: read-only except /tmp, and /tmp is ephemeral.
//     If SUPABASE_* env vars are set, durable storage goes to Supabase instead.
//
// All writes are wrapped in try/catch so a read-only filesystem never crashes
// the app — it just keeps state in memory.

function resolveDir() {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  if (process.env.VERCEL && !supabaseEnabled()) return path.join(os.tmpdir(), "fm-finder-data");
  return path.join(__dirname, "data");
}

const DATA_DIR = resolveDir();
const DB_FILE = path.join(DATA_DIR, "db.json");

// Load pre-seeded roblox users & avatars for instant availability (e.g. on fresh Vercel serverless deploys)
let initialSeed = { roblox_users: [], roblox_avatars: {} };
try {
  const seedFile = path.join(__dirname, "initial-data.json");
  if (fs.existsSync(seedFile)) {
    initialSeed = JSON.parse(fs.readFileSync(seedFile, "utf8"));
  }
} catch {
  /* fallback to empty */
}

function defaultData() {
  return {
    users: [],
    pages: [],
    views: [],
    sessions: [],
    roblox_users: initialSeed.roblox_users || [],
    roblox_avatars: initialSeed.roblox_avatars || {},
    siteconfig: null,
  };
}

function load() {
  const base = defaultData();
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    return {
      ...base,
      ...(data || {}),
      roblox_users: (data?.roblox_users?.length ? data.roblox_users : base.roblox_users),
      roblox_avatars: { ...base.roblox_avatars, ...(data?.roblox_avatars || {}) },
    };
  } catch {
    return base;
  }
}

export const db = load();

// ---- Supabase hydration (once, asynchronously) ----
let hydrating = false;
async function hydrateFromSupabase() {
  if (!supabaseEnabled() || hydrating) return;
  hydrating = true;
  try {
    const { loadAllIntoDB } = await import("./supabase.js");
    await loadAllIntoDB(db);
    if (!db.users || !Array.isArray(db.users)) db.users = [];
    if (!db.sessions || !Array.isArray(db.sessions)) db.sessions = [];
  } catch {
    /* fallback */
  } finally {
    hydrating = false;
  }
}
// Kick off hydration immediately (no await needed for routes; they use `db`).
hydrateFromSupabase();

// ---- Persistence ----
let writeTimer = null;
export function persist() {
  if (writeTimer) return;
  writeTimer = setTimeout(() => {
    writeTimer = null;
    writeNow();
  }, 120);
}

let pushTimer = null;
function writeNow() {
  // JSON file (local durable / /tmp ephemeral fallback)
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch {
    /* read-only FS: keep in memory */
  }
  // Supabase mirror (durable on serverless)
  if (supabaseEnabled()) {
    schedulePush(db);
  }
}

// Ensures the data directory exists on first write and flushes pending writes.
export function flush() {
  writeNow();
}

export default db;
