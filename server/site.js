// The site / finder configuration, editable by the owner(s) and read by the
// public finder. Holds the adjustable "everything" knobs: server list bounds,
// update interval, the browser's main page (iframe src), the multi-page
// address bar, logo (image next to the page name) and page name.
//
// The MAIN page value can also be set in `.env` (MAIN_PAGE_URL on the server,
// VITE_MAIN_PAGE_URL on the client) — the DB value takes precedence once
// saved from the Studio.

import { db } from "./db.js";

export function defaultSiteConfig() {
  const main = process.env.MAIN_PAGE_URL || "https://www.roblox.com/games/2753915549/Blox-Fruits";
  return {
    minServers: 6,
    maxServers: 10,
    updateIntervalMin: 30,       // seconds
    updateIntervalMax: 180,      // seconds
    mainPageUrl: main,           // the main page url (env override)
    iframeSrc: main,             // the single iframe url
    logo: "",                    // image next to the page name (e.g. github raw)
    title: "Full Moon Finder",   // page name
    brandLabel: "Full Moon Finder",
    playerNameStyle: "display",  // "display" | "username" | "avatar"
    addressPages: [
      { id: "a1", label: "Page 1", address: main },
      { id: "a2", label: "Page 2", address: "" },
      { id: "a3", label: "Page 3", address: "" },
    ],
    chrome: { topBar: "#0e1526", toolbar: "#0b1120", accent: "#f5c86a" },
    showLockIcon: true,
  };
}

export function getSiteConfig() {
  return db.siteconfig || defaultSiteConfig();
}

export function getTotalServersCount() {
  const c = getSiteConfig();
  return Math.max(1, c.minServers || 6);
}
