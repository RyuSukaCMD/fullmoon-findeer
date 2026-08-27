import { useMemo, useState, useEffect, useCallback } from "react";
import { useServerEngine } from "../server-system/engine";
import { phaseInfo, isFullMoon, nightsToFull, formatMoonStatus } from "../server-system/moon";
import { ServerCard } from "../components/ServerCard";
import { Moon } from "../components/Moon";
import { Button, Input, Badge, EmptyState } from "../components/ui";
import { trackView } from "../services/analytics";
import { useSiteConfig } from "../services/siteconfig";

const REGIONS = ["All", "EU", "Asia", "NA", "AS · EU", "EU · NA"];

export function Home({ onJoin, customConfig }) {
  const globalCfg = useSiteConfig();
  const siteCfg = customConfig ? { ...globalCfg, ...customConfig } : globalCfg;
  const { servers, refresh } = useServerEngine(siteCfg);
  const [region, setRegion] = useState("All");
  const [fullOnly, setFullOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Track the main page once per visit (deduped).
  useEffect(() => {
    trackView(customConfig?.id || "main");
  }, [customConfig?.id]);

  const derived = useMemo(() => {
    const fullCount = (servers || []).filter((s) => isFullMoon(s.phaseKey)).length;
    const totalOnline = (servers || []).reduce((a, s) => a + (s.players ? s.players.length : 0), 0);
    const nearest = (servers || [])
      .slice()
      .sort((a, b) => nightsToFull(a.phaseKey) - nightsToFull(b.phaseKey))[0];
    return {
      fullCount,
      totalOnline,
      nearest,
      nearestNights: nearest ? nightsToFull(nearest.phaseKey) : 0,
      nearestPhase: nearest ? phaseInfo(nearest.phaseKey) : phaseInfo("full"),
    };
  }, [servers]);

  const filtered = useMemo(() => {
    return (servers || []).filter((s) => {
      if (region !== "All" && s.region !== region) return false;
      if (fullOnly && !isFullMoon(s.phaseKey)) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [servers, region, fullOnly, search]);

  const onScan = useCallback(async () => {
    setRefreshing(true);
    refresh();
    // keep the spinner for a natural feel
    await new Promise((r) => setTimeout(r, 700));
    setRefreshing(false);
  }, [refresh]);

  const heroPhase = derived.nearestPhase;
  const titleText = siteCfg?.title || "FULL MOON";
  const brandText = siteCfg?.branding || (derived.fullCount > 0 ? "Full moon active" : "Live moon tracking");

  return (
    <div className="mx-auto max-w-6xl px-5 pb-24">
      {/* HERO */}
      <section className="relative grid items-center gap-10 pt-12 md:grid-cols-2 md:pt-16">
        <div className="animate-rise">
          <span className="chip border-moon/30 bg-moon/10 text-moon">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moon" />
            {brandText}
          </span>
          <h1 className="mt-5 font-display text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
            {customConfig?.title ? (
              <>
                <span className="text-slate-300 text-3xl sm:text-4xl block mb-2">Find a server at</span>
                <span className="title-clip block bg-gradient-to-r from-moon via-amber-300 to-fruit text-moon">
                  {titleText.toUpperCase()}
                </span>
              </>
            ) : (
              <>
                Find a server at
                <span className="title-clip block bg-gradient-to-r from-moon via-amber-300 to-fruit text-moon">
                  FULL MOON
                </span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-md text-slate-300">
            {siteCfg?.description ||
              "Blox Fruits servers that are on the edge of a full moon night — so you can awaken your race. Live phase, players, and countdown on every server. 🌙"}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button onClick={onScan} loading={refreshing}>
              {refreshing ? "Scanning…" : "Scan servers"}
            </Button>
            <div className="relative">
              <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" strokeLinecap="round" />
              </svg>
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search server…" className="pl-9" />
            </div>
          </div>
        </div>

        {/* moon orb */}
        <div className="relative flex items-center justify-center">
          <div className="absolute h-72 w-72 rounded-full bg-moon/20 blur-3xl" />
          <div className="animate-floaty relative">
            <Moon phaseKey={heroPhase.key} size={220} />
          </div>
          <div className="glass absolute bottom-2 w-56 rounded-2xl px-5 py-3 text-center">
            <p className="text-[11px] tracking-[0.2em] text-slate-400 uppercase">Nearest phase</p>
            <p className="font-display text-2xl text-moon">{heroPhase.label}</p>
            <p className={`mt-0.5 text-xs ${derived.fullCount > 0 ? "text-moon font-semibold" : "text-slate-400"}`}>
              {derived.fullCount > 0 ? "FULL MOON Active" : formatMoonStatus(heroPhase.key)}
            </p>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="mt-14 grid gap-3 sm:grid-cols-3">
        <Stat icon="🛰️" label="Servers tracked" value={(servers || []).length} />
        <Stat icon="🌕" label="Full moon now" value={derived.fullCount} accent="text-moon" />
        <Stat icon="👥" label="Players online" value={derived.totalOnline} accent="text-storm" />
      </section>

      {/* FINDER */}
      <section className="mt-16">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="title-clip font-display text-4xl text-white">Live servers</h2>
            <p className="mt-1 text-sm text-slate-400">
              Servers far from the full moon are replaced automatically.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={fullOnly ? "primary" : "ghost"}
              size="sm"
              onClick={() => setFullOnly((v) => !v)}
            >
              {fullOnly ? "🌕 Full moon only" : "Show full moon only"}
            </Button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setRegion(r)}
              className={`chip !px-3.5 !py-1.5 text-xs transition ${
                r === region ? "border-moon/40 bg-moon/10 text-moon" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => (
              <ServerCard key={s.id} server={s} onJoin={onJoin} nameStyle={siteCfg?.playerNameStyle || "display"} />
            ))}
          </div>
          {filtered.length === 0 && (
            <EmptyState icon="🌫️" title="No servers match" message="Try clearing your filters or scan again — a new server may be on the horizon." action={<Button onClick={onScan}>Scan again</Button>} />
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon, label, value, accent = "text-slate-100" }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`font-display text-2xl ${accent}`}>{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </div>
  );
}
