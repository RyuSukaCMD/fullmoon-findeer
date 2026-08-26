// Renders the moon for a given phase as an accurate SVG: lit side depends on
// waxing (right lit) vs waning (left lit), fraction on the phase.

// lit fraction + lit side per phase key
const PHASE_DRAW = {
  full:              { frac: 1.0 },
  waning_gibbous:    { frac: 0.85, side: "left" },
  third_quarter:     { frac: 0.5,  side: "left" },
  waning_crescent:   { frac: 0.15, side: "left" },
  new:               { frac: 0.0 },
  waxing_crescent:   { frac: 0.15, side: "right" },
  first_quarter:     { frac: 0.5,  side: "right" },
  waxing_gibbous:    { frac: 0.85, side: "right" },
};

const NIGHT = "#0a1122";

export function Moon({ phaseKey = "full", size = 72, glowing = true }) {
  const draw = PHASE_DRAW[phaseKey] || PHASE_DRAW.full;
  const { frac, side } = draw;

  // width of the dark shadow (on the side opposite the lit portion)
  const darkWidth = (1 - frac) * 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={glowing ? "drop-shadow-[0_0_24px_rgba(245,200,106,0.5)]" : ""}
      role="img"
      aria-label={phaseKey}
    >
      <defs>
        <radialGradient id="fmMoong" cx="38%" cy="35%" r="75%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="55%" stopColor="#f5c86a" />
          <stop offset="100%" stopColor="#e39b3b" />
        </radialGradient>
        <clipPath id="fmClip">
          <circle cx="50" cy="50" r="40" />
        </clipPath>
      </defs>

      <g clipPath="url(#fmClip)">
        <circle cx="50" cy="50" r="40" fill="url(#fmMoong)" />

        {/* dark side */}
        {frac < 1 && (
          <rect
            x={side === "left" ? 0 : 100 - darkWidth - 80}
            y="0"
            width={darkWidth + 80}
            height="100"
            fill={NIGHT}
          />
        )}

        {/* craters (only meaningful when lit) */}
        <circle cx="34" cy="32" r="9" fill="#caa04a" opacity={0.4 * frac} />
        <circle cx="60" cy="40" r="5" fill="#caa04a" opacity={0.4 * frac} />
        <circle cx="46" cy="58" r="7" fill="#caa04a" opacity={0.35 * frac} />
        <circle cx="64" cy="66" r="4" fill="#caa04a" opacity={0.4 * frac} />
        <circle cx="28" cy="52" r="4" fill="#caa04a" opacity={0.4 * frac} />
        <circle cx="52" cy="22" r="3" fill="#fff" opacity={0.4 * frac} />
      </g>
      <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
    </svg>
  );
}

// A small glowing moon badge using the phase emoji — used on server cards.
export function MoonBadge({ phaseKey, size = "text-2xl", dim = false }) {
  const icon =
    ({ full: "🌕", waning_gibbous: "🌖", third_quarter: "🌗", waning_crescent: "🌘", new: "🌑", waxing_crescent: "🌒", first_quarter: "🌓", waxing_gibbous: "🌔" }[phaseKey]) || "🌕";
  return <span className={`${size} ${dim ? "opacity-70" : ""} leading-none`}>{icon}</span>;
}
