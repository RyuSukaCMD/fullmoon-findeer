// Gradient monogram avatar used only as a fallback when a real Roblox photo
// isn't available. Deterministic from a seed so the same player keeps its
// color across re-renders.

const PALETTES = [
  ["#ff6d3d", "#f5c86a"],
  ["#38bdf8", "#6366f1"],
  ["#34d399", "#14b8a6"],
  ["#f472b6", "#a855f7"],
  ["#f5c86a", "#fb923c"],
];

export function monogram(name, seed) {
  const i = Math.abs(hash(seed || name || "?")) % PALETTES.length;
  return PALETTES[i];
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) h = (h * 31 + String(str).charCodeAt(i)) | 0;
  return h;
}
