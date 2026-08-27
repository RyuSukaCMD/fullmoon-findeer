import { useEffect, useState } from "react";
import { BrowserFrame } from "./BrowserFrame";
import { buildBrowserConfig } from "../data/config";
import { getSiteConfig } from "../services/siteconfig";
import { phaseInfo, isFullMoon, formatMoonStatus } from "../server-system/moon";
import { Badge } from "./ui";

// The custom in-app browser that opens on "Join Server". Loads the editable
// site config (or page overrideConfig) + the selected server, then renders the multi-page BrowserFrame.
export function JoinModal({ server, onClose, overrideConfig }) {
  const [site, setSite] = useState(overrideConfig || null);

  useEffect(() => {
    if (overrideConfig) {
      setSite(overrideConfig);
    } else {
      getSiteConfig().then(setSite);
    }
  }, [overrideConfig]);

  const config = buildBrowserConfig(
    overrideConfig || site,
    server?.browserOverride || {}
  );

  const phase = phaseInfo(server.phaseKey);
  const badges = [
    <Badge key="moon" tone={isFullMoon(server.phaseKey) ? "moon" : "neutral"}>
      {isFullMoon(server.phaseKey) ? "FULL MOON" : formatMoonStatus(server.phaseKey)}
    </Badge>,
    <span key="info" className="flex items-center gap-2 text-xs" style={{ color: "#8a97ac" }}>
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {server.name} · {server.region} · {server.players.length}/{server.capacity} players
    </span>,
  ];

  return (
    <BrowserFrame
      config={config}
      onClose={onClose}
      badges={badges}
      players={server.players}
    />
  );
}

export default JoinModal;
