import { MoonBadge, Moon } from "./Moon";
import { PlayerAvatar } from "./PlayerAvatar";
import { playerLabel } from "../server-system/players";
import { phaseInfo, isFullMoon, formatMoonStatus, nightsToFull } from "../server-system/moon";
import { useNow, timeAgo, Badge, Button } from "./ui";

export function ServerCard({ server, onJoin, nameStyle = "display" }) {
  const now = useNow(15000);
  const phase = phaseInfo(server.phaseKey);
  const full = isFullMoon(server.phaseKey);
  const online = server.players.length;
  const pct = Math.min((online / server.capacity) * 100, 100);
  const showNames = nameStyle !== "avatar";

  return (
    <article
      className={`card group relative overflow-hidden p-5 transition-all duration-300 animate-rise ${
        full
          ? "border-moon/40 shadow-[0_0_40px_-12px_rgba(245,200,106,0.5)]"
          : "hover:border-moon/25"
      }`}
    >
      {/* glow accent */}
      <div
        className={`absolute inset-x-0 top-0 h-1 ${full ? "bg-gradient-to-r from-moon via-amber-300 to-moon" : "bg-gradient-to-r from-fruit via-moon to-storm opacity-60"}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-2xl tracking-wide text-white">
            {server.name}
          </h3>
          <p className="text-xs text-slate-400">Region · {server.region}</p>
        </div>
        <Badge tone={full ? "moon" : "neutral"}>
          {full ? "FULL MOON" : `${nightsToFull(server.phaseKey)} night${nightsToFull(server.phaseKey) === 1 ? "" : "s"}`}
        </Badge>
      </div>

      {/* moon status */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
        <MoonBadge phaseKey={server.phaseKey} size="text-3xl" dim={!full} />
        <div className="min-w-0 flex-1 leading-tight">
          <p className={`truncate text-sm font-semibold ${full ? "text-moon" : "text-slate-200"}`}>
            {phase.label}
          </p>
          <p className="text-[11px] text-slate-400">
            {full ? "Full Moon Active — awaken your race!" : formatMoonStatus(server.phaseKey)}
          </p>
        </div>
        <Moon phaseKey={server.phaseKey} size={34} glowing={full} />
      </div>

      {/* players */}
      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Players · {online}/{server.capacity}
          </span>
          <Badge tone={online === server.capacity ? "rose" : "emerald"}>
            {online === server.capacity ? "Full" : "Open"}
          </Badge>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
          <div
            className={`h-full rounded-full transition-all duration-300 ${online === server.capacity ? "bg-rose-400" : "bg-gradient-to-r from-fruit to-moon"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-3 flex -space-x-1.5">
          {server.players.slice(0, 6).map((p) => (
            <PlayerAvatar key={p.id} player={p} size="h-7 w-7" text="text-[10px]" />
          ))}
          {online > 6 && (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-slate-300 ring-2 ring-panel">
              +{online - 6}
            </span>
          )}
        </div>
        {showNames && server.players.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {server.players.slice(0, 6).map((p) => (
              <span key={p.id} className="text-[10px] text-slate-500">
                {playerLabel(p, nameStyle)}
                <span className="mx-1 text-slate-700">•</span>
              </span>
            ))}
            {online > 6 && (
              <span className="text-[10px] text-slate-500">+{online - 6} more…</span>
            )}
          </div>
        )}
      </div>

      {/* footer */}
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${full ? "bg-moon animate-pulse" : "bg-emerald-400"}`} />
          Updated {timeAgo(server.updatedAt, now)}
        </span>
      </div>

      <Button
        onClick={() => onJoin(server)}
        disabled={online === server.capacity}
        variant={online === server.capacity ? "subtle" : "primary"}
        className="mt-3 w-full"
      >
        {full ? "Join · Full Moon" : online === server.capacity ? "Server Full" : "Join Server"}
      </Button>
    </article>
  );
}
