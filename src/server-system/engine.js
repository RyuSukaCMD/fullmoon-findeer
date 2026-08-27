import { useCallback, useEffect, useRef, useState } from "react";
import { randomServerName } from "./names";
import { makePlayers } from "./players";
import { ensurePool, takeAvatars, subscribePool } from "../services/roblox";
import { PHASES, nightsToFull, isFullMoon, FAR_NIGHTS } from "./moon";

// Engine for the live server finder. Every player name (username + display
// name) is guaranteed UNIQUE across the ENTIRE roster (all servers), so no two
// servers ever share the same keyword/username. Servers far from a full moon
// are replaced automatically; a single lightweight interval advances the sim,
// and all timers are cleaned up on unmount.

const MIN_PLAYERS = 1;
const MAX_PLAYERS = 12;
const REGIONS = ["EU", "Asia", "NA", "AS · EU", "EU · NA"];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomRegion() {
  return REGIONS[Math.floor(Math.random() * REGIONS.length)];
}

function weightedPhaseKey() {
  const r = Math.random();
  if (r < 0.4) return "full";
  if (r < 0.7) return PHASES[randInt(6, 7)].key;
  return PHASES[randInt(0, 7)].key;
}

// Collects every already-used player name across `servers` (optionally skipping
// the server being refreshed, so it can re-pick new names).
function usedPlayerNames(servers, skipId) {
  const set = new Set();
  for (const s of servers) {
    if (skipId && s.id === skipId) continue;
    for (const p of s.players) {
      if (p.name) set.add(p.name);
      if (p.displayName) set.add(p.displayName);
    }
  }
  return set;
}

function randomInterval(cfg) {
  const min = (cfg?.updateIntervalMin || 30) * 1000;
  const max = (cfg?.updateIntervalMax || 180) * 1000;
  return min + Math.random() * Math.max(1000, max - min);
}

function randomTargetCount(cfg) {
  const min = Math.max(1, cfg?.minServers || 6);
  const max = Math.max(min, cfg?.maxServers || 10);
  return randInt(min, max);
}

function createServer(cfg, allServers) {
  const used = usedPlayerNames(allServers);
  const phaseKey = weightedPhaseKey();
  const count = randInt(MIN_PLAYERS, MAX_PLAYERS);
  const server = {
    id: `srv-${Math.random().toString(36).slice(2, 11)}`,
    name: randomServerName(allServers.map((s) => s.name)),
    phaseKey,
    region: randomRegion(),
    capacity: MAX_PLAYERS,
    players: makePlayers(count, used), // globally unique names
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nextUpdateAt: Date.now() + randomInterval(cfg),
  };
  return server;
}

function buildPool(cfg) {
  const count = randomTargetCount(cfg);
  const list = [];
  for (let i = 0; i < count; i++) {
    const s = createServer(cfg, list);
    if (i === 0) s.phaseKey = "full";
    if (i === 1) s.phaseKey = "waxing_gibbous";
    list.push(s);
  }
  return list;
}

function fillPlayers(server, allServers) {
  const missing = server.players.filter((p) => !p.avatar);
  if (missing.length === 0) return server;
  const used = usedPlayerNames(allServers, server.id);
  const got = takeAvatars(missing.length, [...used]);
  let i = 0;
  const players = server.players.map((p) => {
    if (p.avatar) return p;
    const a = got[i++];
    return a
      ? { id: a.id, name: a.name, displayName: a.displayName || a.name, avatar: a.avatarUrl }
      : p;
  });
  return { ...server, players };
}

function advance(prev, cfg) {
  if (!prev || prev.length === 0) return buildPool(cfg);
  const now = Date.now();
  let changed = false;

  const next = prev.map((s) => {
    if (now < s.nextUpdateAt) return s;

    const far = nightsToFull(s.phaseKey) >= FAR_NIGHTS && !isFullMoon(s.phaseKey);
    if (far) {
      changed = true;
      return createServer(cfg, prev.filter((x) => x.id !== s.id));
    }

    changed = true;
    const delta = randInt(-1, 2);
    const count = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, s.players.length + delta));
    const players =
      count !== s.players.length || Math.random() < 0.2
        ? makePlayers(count, usedPlayerNames(prev, s.id))
        : s.players;
    return {
      ...s,
      players,
      updatedAt: now,
      nextUpdateAt: now + randomInterval(cfg),
    };
  });

  return changed ? next : prev;
}

export function useServerEngine(cfg) {
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  const initial = useRef(null);
  if (initial.current === null) initial.current = buildPool(cfg);
  const [servers, setServers] = useState(initial.current);

  // Rebuild the roster when the configurable min/max server bounds change.
  const [boundsKey, setBoundsKey] = useState(0);
  useEffect(() => {
    setBoundsKey((k) => k + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.minServers, cfg?.maxServers]);
  useEffect(() => {
    if (boundsKey > 0) setServers(buildPool(cfgRef.current));
  }, [boundsKey]);

  // Fetch a pool of real Roblox avatars and upgrade placeholders as they land.
  useEffect(() => {
    ensurePool(Math.max(40, (cfg?.maxServers || 10) * 12));
    const unsub = subscribePool(() => {
      setServers((prev) => prev.map((s) => fillPlayers(s, prev)));
    });
    return () => {
      if (typeof unsub === "function") {
        unsub();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Simulation tick — advance returns the same reference when nothing changed.
  useEffect(() => {
    const id = setInterval(() => setServers((prev) => advance(prev, cfgRef.current)), 1000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    setServers((prev) => {
      const now = Date.now();
      return prev.map((s) => {
        const far = nightsToFull(s.phaseKey) >= FAR_NIGHTS && !isFullMoon(s.phaseKey);
        if (far) return createServer(cfgRef.current, prev.filter((x) => x.id !== s.id));
        return { ...s, updatedAt: now, nextUpdateAt: now + randomInterval(cfgRef.current) };
      });
    });
  }, []);

  return { servers, refresh };
}
