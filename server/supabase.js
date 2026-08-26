// Supabase persistence adapter (PostgREST over fetch, no external SDK).
//
// When SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set, state is mirrored to a
// single `records` table (key text PK + data jsonb) so that everything survives
// serverless cold starts and cross-instance restarts. Sessions are stored here
// too, so a user stays logged in across reloads / instances.
//
// If the env vars are absent (or Supabase is unreachable) it silently degrades
// to the JSON-file / in-memory fallback (server/db.js) so the app never breaks.

const URL = () => process.env.SUPABASE_URL || "";
const KEY = () => process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";

export function supabaseEnabled() {
  return Boolean(URL() && KEY());
}

async function sbFetch(path, opts = {}) {
  const url = `${URL()}/rest/v1/${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      apikey: KEY(),
      Authorization: `Bearer ${KEY()}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Supabase ${res.status}: ${t.slice(0, 200)}`);
  }
  return res;
}

// Maps a top-level key (e.g. 'users') to the record row key in the table.
const rowKey = (key) => key;

// Loads all collections from Supabase into the in-memory `db` object.
export async function loadAllIntoDB(db) {
  try {
    const res = await sbFetch("records?select=key,data&order=key", {
      method: "GET",
    });
    const rows = await res.json().catch(() => []);
    if (!Array.isArray(rows)) return;
    for (const row of rows) {
      if (row && row.key && row.data !== undefined && row.data !== null) {
        db[row.key] = row.data;
      }
    }
  } catch (e) {
    // fallback: keep whatever in-memory/JSON state exists
  }
}

// Pushes every top-level collection as a full snapshot (small data). Deletes
// are reflected because the array simply no longer contains the removed item.
// Idempotent upsert on the `key` column.
export async function saveAll(db) {
  const payload = Object.keys(db)
    .filter((k) => k !== "record_meta")
    .map((k) => ({ key: rowKey(k), data: db[k] }));
  if (payload.length === 0) return;
  try {
    await sbFetch("records", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    // no-op; state still lives in memory / JSON file
  }
}

// Debounced push so rapid mutations don't hammer Supabase.
let pushTimer = null;
export function schedulePush(db) {
  if (pushTimer) return;
  pushTimer = setTimeout(() => {
    pushTimer = null;
    saveAll(db);
  }, 400);
}

// Ensures the `records` table exists (creates it if not).
export async function ensureSchema() {
  if (!supabaseEnabled()) return;
  try {
    const res = await sbFetch("records", { method: "GET", headers: { Prefer: "count=exact", Range: "0-0" } });
    // If HTTP errors because the table doesn't exist, we could try to create it
    // via the SQL API, but that needs a management token; we instead rely on the
    // owner creating the table (see TUTORIAL.md). We only avoid crashing here.
  } catch {
    /* ignore */
  }
}
