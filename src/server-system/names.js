// Deterministic, readable server-name generator with no duplicate actives.

const ADJECTIVES = [
  "Moonlit", "Azure", "Frozen", "Nightfall", "Mystic", "Stormy", "Golden",
  "Shadow", "Crimson", "Silent", "Wild", "Deep", "Emerald", "Coral", "Lunar",
  "Foggy", "Abyssal", "Sunken", "Twilight", "Celestial",
];
const NOUNS = [
  "Harbor", "Sea", "Island", "Port", "Ocean", "Bay", "Reef", "Coast",
  "Lagoon", "Cove", "Ship", "Dock", "Marina", "Shoal", "Inlet", "Gulf",
];
const SUFFIX = 100 + Math.floor(Math.random() * 900); // 100-999

let counter = 0;

// Generates a unique name not present in the given set of active names.
export function randomServerName(activeNames = []) {
  const used = new Set(activeNames);
  for (let attempt = 0; attempt < 200; attempt++) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    const num = 100 + Math.floor(Math.random() * 900);
    const candidate = `${adj}-${noun}-${num}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
  // extremely unlikely fallback
  return `${NOUNS[0]}-${SUFFIX}-${counter++}`;
}
