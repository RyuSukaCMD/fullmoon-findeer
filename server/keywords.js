// Generates a LARGE, varied pool of Roblox username search keywords, themed
// around Blox Fruits / pirates / the ocean / night. We combine base nouns with
// prefixes and suffixes to produce thousands of distinct search terms, so the
// scraped avatar pool never looks repetitive.
//
// Roblox's /v1/users/search matches a keyword as a substring anywhere in the
// username, so short combined keywords (two+ words) still hit many accounts.

const THEMES = [
  // moon / night
  "moon", "moonlit", "lunar", "lunas", "lunaris", "night", "nightfall", "dusk",
  "midnight", "eclipse", "eclipse", "orbit", "comet", "meteor", "galaxy",
  "nebula", "stellar", "cosmo", "star", "stars", "starlight", "astral", "void",
  "zenith", "twilight", "nightowl", "nocturne", "umbra", "penumbra",
  // ocean / sea
  "sea", "ocean", "oceanic", "tide", "tidal", "wave", "waves", "surge", "current",
  "reef", "lagoon", "coral", "abyss", "abyssal", "deep", "deepsea", "marine",
  "marina", "skiff", "anker", "anchorage", "blue", "azure", "aqua", "aquatic",
  "brine", "salt", "sail", "sailor", "sails", "ship", "ships", "fleet", "galleon",
  "dinghy", "harbor", "harbour", "port", "dock", "jetty", "buoy", "beacon",
  "pearl", "shell", "whale", "shark", "dolphin", "octopus", "squid", "jellyfish",
  "seashell", "seagull", "harborlight",
  // pirate / adventure
  "pirate", "pirates", "buccaneer", "captain", "captainito", "corsair", "privateer",
  "plunder", "plunderer", "booty", "swash", "swashbuckler", "scallywag", "deckhand",
  "helmsman", "firstmate", "quartermaster", "bosun", "steersman", "oarsman",
  "rower", "navigator", "cartographer", "explorer", "voyager", "adventurer",
  "raider", "raider", "marauder", "outlaw", "renegade", "rogue", "bandit",
  "highwayman", "smuggler", "filibuster", "freebooter", "skallywag",
  // combat / fruits / power
  "sword", "swords", "blade", "blades", "dagger", "katana", "saber", "cutter",
  "edge", "fangs", "fang", "talon", "claw", "claws", "venom", "poison", "toxic",
  "venomous", "dragon", "dragons", "wyrm", "serpent", "hydra", "leviathan",
  "kraken", "behemoth", "titan", "colossus", "goliath", "ogre", "giant", "brute",
  "apex", "predator", "hunter", "hunt", "prey", "stalker", "sniper", "marksman",
  "duelist", "fighter", "brawler", "champion", "warlord", "gladiator", "warrior",
  "knight", "paladin", "samurai", "ronin", "shogun", "ninja", "shinobi", "assassin",
  // magic / weather
  "storm", "stormy", "tempest", "thunder", "lightning", "bolt", "thunderbolt",
  "thunderstorm", "cyclone", "hurricane", "typhoon", "gale", "gust", "zephyr",
  "breeze", "wind", "whirlwind", "tornado", "blizzard", "frost", "frozen", "ice",
  "icy", "glacier", "snow", "snowfall", "arctic", "polar", "ember", "flame",
  "flames", "blaze", "inferno", "pyre", "cinder", "ash", "scorch", "burn",
  "shadow", "shadows", "phantom", "ghost", "specter", "wraith", "shade", "gloom",
  "dark", "darkness", "obsidian", "onyx", "noir", "goth", "reaper", "grim",
  "spectral", "ethereal", "phase", "dream", "dreamer",
  // color / gem
  "crimson", "scarlet", "ruby", "garnet", "sangre", "emberred", "vermilion",
  "gold", "golden", "gilded", "aurum", "amber", "brass", "bronze", "copper",
  "silver", "silverwing", "platinum", "iron", "steel", "titanium", "onyx",
  "emerald", "jade", "peridot", "sapphire", "lapis", "azurite", "turquoise",
  "amethyst", "violet", "lavender", "magenta", "crimsonblaze", "cobalt",
  // mystique
  "mystic", "mystic", "arcane", "ancient", "eldritch", "runes", "rune", "sigil",
  "spell", "enchant", "charm", "hex", "curse", "cursed", "witch", "wizard",
  "sorcerer", "mage", "druid", "shaman", "warden", "whisper", "seer", "oracle",
  "prophet", "diviner", "sibyl", "augur", "fortuneteller",
  // place / vibe
  "island", "isles", "isle", "atoll", "cay", "key", "archipelago", "mainland",
  "coast", "coastal", "shore", "shoreline", "beach", "sand", "dunes", "cliff",
  "cove", "inlet", "strait", "gulf", "bay", "fjord", "peninsula", "cape",
  "haven", "retreat", "sanctuary", "hideout", "cove", "camp", "den", "lair",
  "fortress", "bastion", "citadel", "keep", "castle", "turret", "watchtower",
  // mythic creatures
  "phoenix", "griffin", "gryphon", "unicorn", "pegasus", "chimera", "sphinx",
  "cerberus", "hydra", "basilisk", "wyvern", "griffin", "manticore", "hippogriff",
  "kraken", "nemean", "fenrir", "jormungandr", "dragonborn", "dryad", "sylph",
  "selkie", "mermaid", "siren", "neried", "triton", "nymph", "oread", "faun",
  "satyr", "centaur", "minotaur", "cyclops", "gorgon", "banshee", "vampire",
  "werewolf", "lycan", "wolf", "wolves", "fox", "kitsune", "raven", "crow",
  "owl", "hawk", "falcon", "eagle", "gargoyle",
  // verbs / style (as prefixes or standalone)
  "x", "z", "xx", "xX", "o", "ee", "zz", "v", "c", "sy", "ko", "ii", "Yt",
  "yt", "TV", "tv", "real", "plays", "plays", "gamer", "gaming", "legends",
  "legend", "god", "God", "king", "Queen", "prince", "princess", "lord",
  "lady", "sage", "master", "expert", "pro", "elite", "supreme", "ultimate",
  "insane", "epic", "epic", "beast", "boss", "ace", "crown", "royal", "noble",
  "titan", "juggernaut", "warden", "sentinel", "guardian", "protector",
  "wanderer", "nomad", "drifter", "traveler", "pilgrim", "sojourner", "wayfarer",
  "stormbreaker", "moonbreaker", "seafarer", "sailmaker", "shipwright",
];

const ADJECTIVES = [
  "shadow", "dark", "night", "moon", "sea", "storm", "frost", "ember", "frosty",
  "icy", "umbras", "stellar", "lunar", "cosmic", "sky", "azure", "crimson",
  "golden", "silver", "emerald", "mystic", "arcane", "ancient", "wild", "fierce",
  "savage", "shadowy", "silent", "stormy", "glacial", "volcanic", "colossal",
  "mighty", "mystic", "sacred", "heroic", "furious", "anguish", "dread",
  "dreadful", "gloomy", "haunted", "lustrous", "blazing", "razor", "steel",
  "iron", "ebony", "obsidian", "cursed", "holy", "blessed", "radiant", "brilliant",
  "luminous", "shimmering", "glowing", "shining", "sparkling", "twinkling",
  "molten", "frozen", "crystal", "jewel", "prismatic", "sequin", "neon", "chrome",
  "void", "rift", "gravity", "quantum", "plasma", "solar", "solaris", "nova",
  "supernova", "pulsar", "quasar", "eclipse", "aurora", "polar", "blizzard",
  "tempest", "gale", "monsoon", "downpour", "drizzle", "hailstone",
];

const SUFFIXES = [
  "x", "z", "yx", "zx", "xx", "ix", "ux", "nx", "ux", "zz", "zzz", "yy",
  "tv", "yt", "of", "on", "in", "y", "ie", "ey", "zzz", "king", "win", "pro",
  "god", "jr", "jr.", "ii", "iii", "4", "7", "9", "0", "0", "00", "000",
  "1", "2", "3", "5", "8", "99", "123", "666", "777", "900",
];

// Builds a big, deterministic-ish pool of search keywords from combos.
export function buildKeywordPool(seedWord = "") {
  const set = new Set();
  const add = (w) => {
    const s = String(w || "").toLowerCase();
    if (s.length >= 2 && s.length <= 24) set.add(s);
  };

  // base themes + adjectives
  THEMES.forEach(add);
  ADJECTIVES.forEach(add);
  SUFFIXES.forEach(add);

  // theme+theme, adj+theme, theme+adj combos (thousands)
  const themes = THEMES.slice();
  const adjs = ADJECTIVES.slice();
  for (const a of adjs) {
    for (const t of themes) {
      add(a + t);
      add(t + a);
    }
  }
  // theme + suffix, suffix + theme
  for (const t of themes) {
    for (const s of SUFFIXES) {
      add(t + s);
      add(s + t);
    }
  }
  // prefix (seedWord) + theme combos for extra uniqueness
  if (seedWord) {
    for (const t of themes) add(seedWord + t);
    for (const a of adjs) add(seedWord + a);
  }

  return [...set];
}

// Deterministic-ish shuffle seeded by a string, so the subset we scrape changes
// but is reproducible per seed.
function seededShuffle(arr, seed) {
  const a = arr.slice();
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = ((h ^ seed.charCodeAt(i)) * 16777619) >>> 0;
  let s = h || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getKeywords(limit = 4000, seed = "") {
  const pool = buildKeywordPool(seed);
  return seededShuffle(pool, seed).slice(0, limit);
}
