import { useEffect, useState } from "react";
import { api } from "./api";
import { DEFAULT_MAIN_PAGE_URL, defaultSiteConfig } from "../data/config";

// Fetches and caches the editable site/finder configuration. Config may be
// updated in the Studio; call setSiteConfigCache to refresh in-memory state,
// or force a refetch with getSiteConfig(true).
let cached = null;
let inflight = null;

export async function getSiteConfig(force = false) {
  if (cached && !force) return cached;
  if (inflight) return inflight;
  inflight = api.site
    .get()
    .then(({ config }) => {
      cached = { ...defaultSiteConfig(), ...config };
      return cached;
    })
    .catch(() => {
      cached = defaultSiteConfig();
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function setSiteConfigCache(cfg) {
  cached = cfg;
}

export function useSiteConfig() {
  const [cfg, setCfg] = useState(null);
  useEffect(() => {
    getSiteConfig().then(setCfg);
  }, []);
  return cfg;
}

export function emptySiteConfigForForm() {
  return { ...defaultSiteConfig() };
}

export { DEFAULT_MAIN_PAGE_URL };
