import { useState } from "react";
import { monogram } from "../server-system/avatar";

// Renders a real Roblox avatar photo when `player.avatar` is set. If the image
// fails to load (or there's no photo yet) it falls back to a gradient monogram,
// so there is never a broken-image state.
export function PlayerAvatar({ player, size = "h-8 w-8", text = "text-[11px]", ring = true }) {
  const [failed, setFailed] = useState(false);
  const name = player?.name || "?";
  const avatar = player?.avatar;

  const ringCls = ring ? "ring-2 ring-panel" : "";
  if (avatar && !failed) {
    return (
      <img
        src={avatar}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        title={name}
        className={`inline-flex shrink-0 rounded-full object-cover ${size} ${ringCls}`}
      />
    );
  }
  const [c1, c2] = monogram(name, name);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-ink ${size} ${text} ${ringCls}`}
      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
      title={name}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
