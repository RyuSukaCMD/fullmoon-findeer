import { takeAvatars } from "../services/roblox";
import { monogram } from "./avatar";

// Builds `count` players that are UNIQUE across the whole roster.
// `usedNames` is a Set of strings already in use (usernames + display names of
// every other player). We only pick pool avatars whose username AND display
// name don't clash, and pad with unique monogram names when needed — so no two
// players anywhere in the all-servers list ever share a keyword/username.

export function makePlayers(count, usedNames = new Set()) {
  const list = [];
  const poolItems = takeAvatars(count, [...usedNames]);
  for (const a of poolItems) {
    const display = a.displayName || a.name;
    list.push({ id: a.id, name: a.name, displayName: display, avatar: a.avatarUrl });
    usedNames.add(a.name);
    usedNames.add(display);
  }
  // Pad with unique fallback players if the pool couldn't fill `count`.
  let guard = 0;
  while (list.length < count && guard < 200) {
    const p = uniqueFallbackPlayer(usedNames);
    if (!p) break; // ran out of unique fallback names
    list.push(p);
    usedNames.add(p.name);
    usedNames.add(p.displayName);
    guard++;
  }
  return list;
}

// Deterministic unique fallback (no photo) player.
function uniqueFallbackPlayer(usedNames) {
  for (let attempt = 0; attempt < 120; attempt++) {
    let name = FALLBACK_NAMES[Math.floor(Math.random() * FALLBACK_NAMES.length)];
    if (Math.random() < 0.35) name += SUFFIX[Math.floor(Math.random() * SUFFIX.length)];
    if (usedNames.has(name)) continue;
    return { id: `fb-${Math.random().toString(36).slice(2, 9)}`, name, displayName: name, avatar: null };
  }
  // ensure uniqueness by appending a counter
  const base = "MoonHunter";
  let n = `${base}${100 + Math.floor(Math.random() * 900)}`;
  let guard = 0;
  while (usedNames.has(n) && guard < 100) { n = `${base}${n}`; guard++; }
  return { id: `fb-${Math.random().toString(36).slice(2, 9)}`, name: n, displayName: n, avatar: null };
}

const FALLBACK_NAMES = [
  "ShadowKnight", "MoonHunter", "DarkPirate", "SeaWalker", "GhostBlade",
  "StormRider", "NightReaper", "VoidCaster", "EmberFist", "OceanKing",
  "TideBender", "FrostClaw", "RumbleAce", "FangLord", "MistWalker", "StarDiver",
];
const SUFFIX = ["YT", "X2", "OP", "77", "V2", "99", "PL", "GG", "MLG", "TWO"];

// Resolves the display string for a player based on the configured style.
export function playerLabel(player, style = "display") {
  if (!player) return "?";
  if (style === "avatar") return "";                 // hide name entirely
  if (style === "username") return player.name;       // raw username
  return player.displayName || player.name;           // display name (default)
}

export { monogram };
