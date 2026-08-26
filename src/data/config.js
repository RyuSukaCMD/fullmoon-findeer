// Central browser / site configuration.
//
// The MAIN page is set in `.env` (VITE_MAIN_PAGE_URL on the client,
// MAIN_PAGE_URL on the server). Everything below is the editable site config,
// persisted server-side and changeable from the Studio (Site settings).
//
// LEGITIMATE USE: the custom browser embeds your own server / a real game page
// in a single iframe. The address bar AUTO-ADVANCES: it shows the first
// address page, and each time the iframe navigates (a redirect) it steps to
// the next address page. It never impersonates a different URL (no spoofing,
// no hidden redirects).

export const DEFAULT_MAIN_PAGE_URL =
  import.meta.env.VITE_MAIN_PAGE_URL || "https://www.roblox.com/games/2753915549/Blox-Fruits";

export const BROWSER = {
  src: import.meta.env.VITE_MAIN_PAGE_URL || DEFAULT_MAIN_PAGE_URL, // the single iframe URL
  brandLabel: "Full Moon Finder",
  chrome: { topBar: "#0e1526", toolbar: "#0b1120", accent: "#f5c86a", theme: "dark" },
  showLockIcon: true,
  showBackForward: true,
  showReload: true,
};

export function defaultSiteConfig() {
  const main = DEFAULT_MAIN_PAGE_URL;
  return {
    minServers: 6,
    maxServers: 10,
    updateIntervalMin: 30,
    updateIntervalMax: 180,
    mainPageUrl: main,
    iframeSrc: main,
    logo: "",
    title: "Full Moon Finder",
    brandLabel: "Full Moon Finder",
    // How player names appear: "display" (Roblox display name), "username"
    // (raw username), or "avatar" (hide name, photo only).
    playerNameStyle: "display",
    addressPages: [
      { id: "a1", label: "Page 1", address: main },
      { id: "a2", label: "Page 2", address: "" },
      { id: "a3", label: "Page 3", address: "" },
    ],
    chrome: { topBar: "#0e1526", toolbar: "#0b1120", accent: "#f5c86a", theme: "dark" },
    showLockIcon: true,
    showBackForward: true,
    showReload: true,
  };
}

// Resolves a browser config from a site config (and optional per-server
// override) into the shape BrowserFrame consumes.
export function buildBrowserConfig(site, override = {}) {
  const s = site || defaultSiteConfig();
  const o = override || {};
  return {
    iframeSrc: o.iframeSrc || s.iframeSrc || s.mainPageUrl,
    addressPages:
      o.addressPages && o.addressPages.length
        ? o.addressPages
        : s.addressPages && s.addressPages.length
        ? s.addressPages
        : [{ id: "a1", label: "Page 1", address: s.mainPageUrl }],
    logo: o.logo !== undefined ? o.logo : s.logo,
    title: o.title || s.title || "Full Moon Finder",
    brandLabel: o.brandLabel || s.brandLabel || "Full Moon Finder",
    chrome: { ...(s.chrome || {}), ...(o.chrome || {}) },
    showLockIcon: o.showLockIcon ?? s.showLockIcon ?? true,
    showBackForward: o.showBackForward ?? s.showBackForward ?? true,
    showReload: o.showReload ?? s.showReload ?? true,
    key: o.key || s.key || "",
  };
}
