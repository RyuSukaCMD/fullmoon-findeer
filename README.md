# 🌕 Blox Fruits — Full Moon Server Finder (Full Stack · Vercel-ready)

A production-ready **Blox Fruits Full Moon Server Finder**: a live server finder
that tracks moon phases, and a complete **admin/studio system** with real
authentication, authorization, page management, and analytics.

> **Deploying to Vercel?** See [`TUTORIAL.md`](./TUTORIAL.md) for the full guide
> (local + Vercel CLI + GitHub integration, env vars, serverless API, persistence
> caveats).

Built as a **React + Vite + Tailwind** frontend and an **Express + JSON-persistence**
backend with real security (scrypt password hashing, httpOnly session cookies,
RBAC enforced server-side). Nothing here is a dummy — every feature works
end-to-end and data persists across restarts.

> ⚠️ This is a **legal** rebuild of the old "Condo-Server" phishing site. The old
> site impersonated Roblox URLs with a fake Chrome address bar. This version
> keeps the *concept* and the custom in-app browser UX, but the address bar is an
> **editable input loading exactly what it shows** (tied to `src/data/config.js`)
> — no spoofing, no anti-theft JS, no hidden deception.

---

## Run it

```bash
# install deps (frontend + backend)
npm install

# run backend (Express API on :5180) + frontend (Vite on :5173) together
npm run dev

# production build + serve from the API
npm run build
npm start        # serves ./dist + the API on :5180
```

The frontend proxies `/api/*` to the backend, so everything is single-origin
(cookies work, no CORS).

**Vercel:** the same Express app runs as a serverless function (`api/index.js`,
catch-all via `vercel.json`). The frontend is served from `dist/`, and the
`/api/*` function handles all API calls. See `TUTORIAL.md`.

**Default owner/admin (first user):** `Chaeulso` / `Chaeulkeren67`
(created on first boot as a hashed credential server-side; change it before
deploying. Override with `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars.)

**Main page URL** is set in `.env` (`VITE_MAIN_PAGE_URL` for the client,
`MAIN_PAGE_URL` for the server). The owner can override it live in the Studio
(Finder settings), which is persisted in the DB.

---

## Architecture

```
├─ server/                     Express backend (API :5180)
│  ├─ app.js                   createApp() — routes (reused by serverless + local)
│  ├─ index.js                 local/long-running server + static serving
│  ├─ db.js                    JSON-file persistence (Vercel-safe: /tmp fallback)
│  ├─ auth.js                  scrypt hashing + cookie sessions
│  ├─ permissions.js           RBAC + server-side guards
│  ├─ analytics.js             view tracking + aggregations
│  ├─ roblox.js                real avatar scraper + resolver + cache
│  ├─ seed.js                  first-boot admin account
│  ├─ data/                    persisted state (gitignored)
│  └─ routes/
│     ├─ auth.js               login / logout / me
│     ├─ admin.js              users + pages management + stats
│     ├─ pages.js              create/edit/delete pages, slug checks, public render
│     ├─ analytics.js          POST /view
│     └─ roblox.js             GET /api/roblox/avatars
│
├─ api/index.js                Vercel serverless handler (catch-all /api/*)
├─ vercel.json                 Vercel build/output + rewrites
└─ .env / TUTORIAL.md          config + deploy guide
│
└─ src/                        React frontend (Vite :5173)
   ├─ services/api.js          same-origin API client
   ├─ services/analytics.js    session-deduped view tracking
   ├─ services/roblox.js       client avatar pool (fetch + take + subscribe)
   ├─ auth/AuthContext.jsx     session state + permission helper
   ├─ components/              Moon, ServerCard, JoinModal, PlayerAvatar, ui kit, …
   ├─ layouts/                 PublicLayout, AdminLayout (guarded)
   ├─ server-system/           moon model, name/player generators, avatar, engine
   └─ pages/                   Home, About, PublicPage, admin/*, CreatePage, MyPages, NotFound
```

---

## Feature map

### Server finder
- **8 moon phases** with accurate icon/illumination (🌕🌖🌗🌘🌑🌒🌓🌔), driven by
  each server's phase — the moon SVG also renders the lit fraction per phase.
- **Natural countdown** `"X more night(s)."` and **"FULL MOON Active"** when a
  server is at full. Never contradictory (derived from the phase).
- **Random server names** (`Moonlit-Harbor-482`…) with **no duplicate actives**.
- **Configurable server count** — the owner sets `minServers` / `maxServers`
  (default 6–10) in Finder settings; the roster is randomized within those
  bounds. The **update interval** is also configurable.
- **Players 1–12** (max 12 absolute, clamped), each with a **real Roblox avatar
  photo** (scraped from the public Roblox search API + headshot thumbnails,
  enriched keyword set). If a photo can't be fetched it degrades to a gradient
  monogram — never a broken image.
- **Randomized update intervals** (30s–3m, per server, not a fixed loop) with
  smooth transitions — no flicker, no per-second re-render.
- **Randomized update intervals** (30s–3m, per server, not a fixed loop) with
  smooth transitions — no flicker, no per-second re-render.
- **Full-moon priority**: servers far from a full moon are **auto-replaced** with
  fresh servers (new id/name/phase/players/schedule) without a blank screen; the
  list count stays stable and cards animate in/out cleanly (Framer Motion).
- Search, region filter, "full moon only" toggle, and a **Scan again** control.

### Admin / Studio (`/starnova`)
- **Hidden route**, gated by **real auth** (no plaintext creds, httpOnly cookie
  session, scrypt hashing). `/starnova` and `/createpage` are protected even if
  the URL is known.
- **Dashboard**: total/active/suspended users, page owners, total/active/suspended
  pages, total views, main-page views, per-user views, per-page views, and a
  14-day views chart.
- **Users**: create (unique username + duplicate rejection), suspend / unsuspend,
  delete (with confirmation). 
- **Pages**: manage/create/suspend/delete all custom pages.

### Custom pages
- `/createpage` builds a fully customizable page: custom slug (live
  **"URL available" / "This URL is already taken."** check, duplicate rejected
  server-side), title, description, branding, logo, colors, content, sections,
  buttons, display URL, login URL, visibility, and status.
- `/u/:slug` renders it live with view tracking. Suspended/private pages show the
  right state; missing pages give a "Lost at sea" 404.
- `/mypages` lets owners view stats, edit, and delete **their own** pages (others'
  pages are rejected server-side).

### Permissions & limits (server-enforced)
`CREATE_PAGE`, `EDIT_PAGE`, `DELETE_PAGE`, `VIEW_STATS`, `VIEW_USERS`,
`MANAGE_USERS`, `MANAGE_PAGES`. Missing a permission returns **403** and a
**page_limit** exceeding returns **"Page creation limit reached."** — the UI only
reflects these; the backend enforces them, so they can't be bypassed by
refreshing or editing the frontend.

### Owner / user management (from the Studio)
- Set each user's **page creation limit** (max number of pages).
- **Change role** (user ↔ admin) and **reset another user's password**.
- **Suspend / activate / delete** any account (with confirmation).
- **Change your own password** via `Account` (`/starnova/account`).
- Safety: you can never demote or delete the **last admin**, so the site can't
  be locked out.

### Sessions & auth persistence
Login uses **both** an httpOnly cookie and a **bearer token** returned on login.
The client keeps the token (localStorage, with in-memory fallback) and sends it
as `Authorization: Bearer …`, so you **stay logged in across reloads** and even
in environments where cookies are blocked (e.g. sandboxed preview iframes — this
fixes the "/starnova login shows nothing" issue). Sessions are stored with the
database (Supabase) so they also survive restarts.

### Source-protection (anti-scrape)
Added deterrents against casual site-copy tools (`web2zip`-style) and devtools
code-hunting: no right-click / drag / select, blocked F12 + DevTools shortcuts, a
best-effort DevTools-open detector, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, and the app logic ships in a **minified, hashed
Vite bundle** (no source maps by default). These raise the effort to scrape — they
are deterrents, not a hard guarantee; the real protections are server-side auth
(secret keys, hashed passwords) which are never in the client bundle.

### Analytics
Main-page, per-user, and per-page views. Counting is **deduped by session** on
both client (one fire per page mount, guards against StrictMode/remounts) and
server (per session+target window), so re-renders and refreshes never inflate
counts.

### Custom browser (Join flow + custom pages)
Clicking **Join Server** opens a full **chrome-style in-app browser** with a
**multi-page address bar**:

- The iframe always loads **ONE URL** (`iframeSrc`).
- The address bar is made of **addable pages** (page 1, 2, 3…), each with its
  own editable custom address. Clicking a page swaps the address bar text
  without touching the iframe.
- Editing the active page's address updates only that page's display text.
- Redirects / navigation inside the frame **never open a new window** — it
  stays in the single iframe; the address bar reflects the active page.
- A **logo image** (e.g. a GitHub raw photo URL) sits next to the page **name**;
  both are configurable.

This is editable in two places:
- **Studio → Finder settings** (`/starnova/settings`) — the owner configures the
  finder's server count (min/max), update interval, main page (default from
  `.env`), single iframe URL, address pages, logo and page name. Persisted.
- **Create/Edit page** (`/createpage`) with **Browser mode** toggled on — each
  custom page can carry its own iframe URL + address pages + logo + name.

The address-bar pages are user-configured display text; the single iframe never
impersonates a different URL (no spoofing / hidden redirects).

### Real Roblox avatar photos
Player avatars come from the **official Roblox APIs**:
- `users.roblox.com/v1/users/search` — the **scraper**; pulls real usernames by
  themed keywords (`moon`, `pirate`, `knight`, …).
- `thumbnails.roblox.com/v1/users/avatar-headshot` — resolves each username to
  its real avatar photo.
- Results are **cached & persisted** (`server/data/db.json`) so repeat loads are
  instant and don't hammer Roblox. Randomize-until-working is handled per batch;
  any failure falls back to a monogram.

### Error handling
Duplicate username, duplicate/invalid URL, unauthorized, forbidden, suspended,
page-limit exceeded, missing/deleted page, and network/db failures all produce
clear, friendly messages — never a blank page.

---

## Security notes
- Passwords hashed with **scrypt + per-user salt** (`timingSafeEqual`).
- Sessions are **httpOnly, SameSite=Lax** cookies; no secrets in the client bundle.
- **Authorization is checked server-side** on every protected route; hidden
  routes are *not* security.
- For real production, swap the JSON-file persistence layer for SQLite/Postgres
  (the repository interface stays the same) and set a strong admin password.

## Legal
Unofficial fan tool. Not affiliated with, endorsed by, or connected to Roblox or
Blox Fruits. All trademarks belong to their owners.
