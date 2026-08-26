# 🚀 Full Moon Finder — Deploy to Vercel

This guide covers running the project locally **and** deploying it to **Vercel**.

> What runs where on Vercel:
> - **`/`** → your built frontend (`dist/`) served as static files.
> - **`/api/*`** → a single **serverless function** (`api/index.js`) that runs the
>   same Express app, via the rewrite in `vercel.json`.
> - Client-side routes (`/about`, `/starnova`, `/u/...`, …) fall back to
>   `index.html` (SPA) through the catch-all rewrite.

---

## 0. Prerequisites

- Node.js **18+** (20 recommended).
- npm.
- (For CLI deploy) a free [Vercel](https://vercel.com) account + [Vercel CLI](https://vercel.com/docs/cli):
  ```bash
  npm i -g vercel
  ```

---

## 1. Run locally

```bash
# install dependencies
npm install

# ### IMPORTANT ### copy the env file and set your values FIRST
cp .env .env           # (already exists) — or keep .env as-is for the default admin
# edit .env, then:

# run API (:5180) + frontend (:5173) together
npm run dev
# → http://localhost:5173
```

**Default owner/admin:** `Chaeulso` / `Chaeulkeren67`
(created on first boot, stored only as a scrypt hash server-side).

To run the production build locally:
```bash
npm run build
npm start             # serves ./dist + the API on :5180
```

---

## 2. Create an env file for Vercel

`.env` is used for **local** development. For Vercel, add the **same variables**
in **Project → Settings → Environment Variables**. Keep the ones you use:

| Variable | Value | Notes |
|---|---|---|
| `VITE_MAIN_PAGE_URL` | the main game URL | Bundled into the frontend (VITE_ prefix). |
| `ADMIN_USERNAME` | `Chaeulso` | First owner/admin username. |
| `ADMIN_PASSWORD` | `Chaeulkeren67` | **Change before going live.** |
| `MAIN_PAGE_URL` | the main game URL | Server-side mirror (optional). |
| (optional) `DATA_DIR` | `/tmp/fm-finder-data` | Serverless data dir (auto). |
| (optional) `PORT` | `5180` | Only used locally. |

> The frontend reads `VITE_*` at **build time**. If you change `VITE_MAIN_PAGE_URL`
> you must trigger a new build on Vercel (it auto-rebuilds on push).

---

## 3. Deploy with the Vercel CLI (quickest)

```bash
# 1. authenticate
vercel login

# 2. link this directory (answers will be auto-suggested from vercel.json)
vercel link

# 3. set env vars
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD
vercel env add VITE_MAIN_PAGE_URL
# …repeat for any others, choosing production/preview/all.

# 4. preview deploy
vercel

# 5. production deploy
vercel --prod
```

`vercel.json` already declares the framework, build command, output directory and
rewrites — so Vercel builds the Vite app, outputs `dist/`, and routes `/api/*`
to the serverless function.

---

## 4. Deploy via GitHub integration (recommended)

1. Push this repo to GitHub.
2. In Vercel → **Add New Project** → import the repo.
3. Vercel auto-detects Vite + reads `vercel.json`. Confirm:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add the Environment Variables from §2 (Production, Preview, Development).
5. **Deploy.** Every push re-deploys automatically.

---

## 5. How the serverless API works (no separate server needed)

- `api/index.js` builds the Express app (`server/app.js`) and exports one handler.
- `vercel.json` rewrites **`/api/(.*)` → `/api/index`**, so a single function
  receives all API calls, with the original path preserved (`/api/auth/login`…).
- The handler re-adds the `/api` prefix if it ever arrives stripped.
- Cookie sessions (`HttpOnly`, `SameSite=Lax`) work because frontend and API are
  same-origin.

The same Express app is reused by `server/index.js` for local/long-running use —
zero duplicated routing logic.

---

## 5b. Durable persistence with Supabase (recommended)

The app ships with a **Supabase adapter** (`server/supabase.js`) that mirrors
all state (users, pages, views, sessions, avatar cache, site config) to a
hosted database — so it survives serverless cold starts and **you stay logged
in across reloads and instances**.

Set it up:

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the **Project URL**.
3. **Settings → API** → copy the **`service_role`** key (server-side only).
4. In the **SQL Editor**, run:
   ```sql
   create table if not exists records (
     key text primary key,
     data jsonb,
     updated_at timestamptz default now()
   );
   alter table records enable row level security;
   ```
5. Add these to your **Vercel Environment Variables** (and/or your local `.env`):
   ```
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
   ```

When **both** are set, the app writes to Supabase instead of the ephemeral
filesystem. If either is missing or Supabase is unreachable, it silently
degrades to the local/JSON fallback (never crashes).

> 🔒 Keep the `service_role` key **server-side only**. It is only read inside
> `server/` (never bundled into the browser). The frontend talks to your API,
> not Supabase directly.

---

## 6. Persistence on Vercel — READ THIS

The app persists to a **JSON file** by default. Locally this writes to
`server/data/` and is fully durable.

**On Vercel serverless, that file is NOT durable** unless you use Supabase (§5b):
- Serverless filesystems are read-only except `/tmp`, and `/tmp` resets across
  cold starts / scaling. So users, pages, views and sessions may reset over time.

How the code handles it (`server/db.js`):
- On Vercel without Supabase it writes to `/tmp/fm-finder-data` so the app
  **keeps working** (no crashes), with state persisted per warm instance.
- On a read-only sandbox it silently keeps state **in memory**.

**For durable data on Vercel → use the built-in Supabase adapter (see §5b).**
Just set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` and create the `records`
table. No code changes needed — the same route handlers keep working.

---

## 7. Customize the main page & browser

Everything is configurable from the app (no code edit needed):

1. Sign in at **`/starnova`** (`Chaeulso` / `Chaeulkeren67`).
2. **Studio → Finder settings** (`/starnova/settings`): set the main page URL,
   the **address sequence** (shown in order as the frame redirects — page 1 → 2 → 3…),
   min/max servers, update interval, logo (a GitHub raw photo URL) and page name.
3. That page also lives at **`/createpage`** (Browser mode) for per-page iframe
   URL + address sequence + logo + name.

The default main page comes from `.env` (`VITE_MAIN_PAGE_URL` / `MAIN_PAGE_URL`);
the DB value overrides it once you save from the Studio.

---

## 8. After deploying — verification checklist

- [ ] `https://<your-app>.vercel.app/` loads the finder.
- [ ] Server cards appear with random names, moon phases & real Roblox avatars.
- [ ] Clicking **Join Server** opens the custom browser (iframe) with **"Join the full moon server"** text.
- [ ] The address bar shows Page 1, then advances to Page 2/3 on iframe redirects (stays in the same frame).
- [ ] `/starnova` shows the login; `Chaeulso`/`Chaeulkeren67` signs in.
- [ ] `/starnova/settings` saves and persists the site config.
- [ ] `/createpage` creates a page reachable at `/u/<slug>` (slug conflict rejected).
- [ ] `/api/site` returns JSON (200).

Quick API sanity check:
```bash
curl https://<your-app>.vercel.app/api/site
curl -X POST https://<your-app>.vercel.app/api/analytics/view \
  -H 'Content-Type: application/json' \
  -d '{"session_id":"test","target":"main"}'
```

---

## 9. Troubleshooting

| Problem | Cause / fix |
|---|---|
| Roblox game won't render inside the frame | Roblox sends `X-Frame-Options: DENY`, which forbids embedding. This is expected. Iframe pages that allow embedding render; a **"Open in new tab ↗"** button is provided as a fallback. You can also point `iframeSrc` at a page that permits framing. |
| `/api/*` returns 404 | The rewrite in `vercel.json` must be present; redeploy after editing it. |
| Admin login resets on Vercel | Sessions live in `/tmp` (ephemeral). See §6 for durable storage. |
| Preview host blocked locally | Only affects the sandbox live preview; real Vercel domains are fine. |
| `vite: not found` | Run `npm install` first (node_modules isn't persisted between sandbox sessions). |

---

## 10. Legal

Unofficial fan tool. Not affiliated with, endorsed by, or connected to Roblox or
Blox Fruits. All trademarks belong to their owners.
