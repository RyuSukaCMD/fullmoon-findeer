import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui";

// A Chrome-style in-app browser with an address bar that AUTO-ADVANCES.
//
// - ONE iframe loads ONE url (`config.iframeSrc`).
// - `config.addressPages` is an ordered sequence of display addresses. The
//   address bar shows the active page's address, and each time the iframe
//   navigates (a redirect / new page load) the address bar steps to the NEXT
//   page's address (page 1 → page 2 → page 3 …), and stays on the last one.
// - Navigating NEVER opens a new window — it stays in this single iframe.
// - A logo / image sits next to the page name; the name is configurable.
//
// Because a cross-origin iframe can't expose its real URL, we detect
// navigation with the iframe's load event (the same technique the original
// source used) and advance the display address accordingly.

export function BrowserFrame({ config, onClose, badges, players, standalone = false }) {
  const addressPages = useMemo(() => {
    const list = config.addressPages?.length ? config.addressPages : [{ id: "a1", label: "Page 1", address: config.iframeSrc }];
    return list.map((p) => ({ ...p }));
  }, [config]);

  const [stage, setStage] = useState(0); // which address page is currently shown
  const [edited, setEdited] = useState({}); // per-page address text overrides (for editing)
  const firstLoad = useRef(true);
  const frameRef = useRef(null);
  const ch = config.chrome || {};
  const accent = ch.accent || "#f5c86a";

  const idx = Math.min(stage, addressPages.length - 1);
  const base = addressPages[idx] || addressPages[0] || { label: "Page 1", address: "" };
  const active = { ...base, address: edited[idx] ?? base.address ?? "" };

  // Reset when the iframe source changes (e.g. a different server is joined).
  useEffect(() => {
    firstLoad.current = true;
    setStage(0);
    setEdited({});
  }, [config.iframeSrc]);

  useEffect(() => {
    if (!onClose) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      if (frameRef.current) frameRef.current.src = "about:blank";
    };
  }, [onClose]);

  // Fires once per iframe navigation. First load keeps page 1; each later
  // navigation (a redirect) advances to the next configured address page.
  const handleLoad = () => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    setStage((s) => Math.min(s + 1, addressPages.length - 1));
  };

  const reload = () => {
    if (frameRef.current) {
      frameRef.current.src = config.iframeSrc;
      firstLoad.current = true;
      setStage(0);
    }
  };

  const inner = (
    <div
      className={`relative flex flex-col overflow-hidden shadow-2xl ${standalone ? "h-[100dvh] w-full" : "h-[93dvh] w-full max-w-5xl animate-rise rounded-2xl"}`}
      style={{ background: ch.topBar }}
    >
      {/* ---- tab strip + page name + window controls ---- */}
      <div className="flex items-center px-2 py-2" style={{ background: ch.topBar }}>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-t-lg px-3 py-2" style={{ background: ch.toolbar }}>
          {config.logo ? (
            <img
              src={config.logo}
              alt=""
              className="h-6 w-6 shrink-0 rounded object-cover ring-1 ring-white/10"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          ) : (
            <svg width="16" height="16" viewBox="0 0 64 64" className="shrink-0">
              <circle cx="32" cy="32" r="26" fill={accent} />
              <circle cx="24" cy="22" r="7" fill="#fff" opacity="0.35" />
            </svg>
          )}
          <span className="truncate text-xs font-semibold" style={{ color: "#dbe2f0" }}>
            {config.title}
          </span>
          {onClose && (
            <button onClick={onClose} className="ml-auto rounded px-1.5 hover:bg-white/10 hover:text-white" style={{ color: "#7b8799" }} aria-label="Close tab">✕</button>
          )}
        </div>
        {onClose && (
          <div className="flex items-center gap-1 pl-2">
            <button onClick={onClose} className="h-8 w-10 rounded hover:bg-white/10" style={{ color: "#9aa4b5" }} aria-label="Minimize">–</button>
            <button onClick={onClose} className="h-8 w-10 rounded hover:bg-white/10" style={{ color: "#9aa4b5" }} aria-label="Maximize">▢</button>
            <button onClick={onClose} className="h-8 w-10 rounded hover:bg-rose-500 hover:text-white" style={{ color: "#9aa4b5" }} aria-label="Close window">✕</button>
          </div>
        )}
      </div>

      {/* ---- toolbar + single auto-advancing address bar ---- */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: ch.toolbar }}>
        <div className="hidden items-center gap-1 sm:flex">
          <ToolBtn label="Back"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" /></ToolBtn>
          <ToolBtn disabled label="Forward"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></ToolBtn>
          <ToolBtn label="Reload" onClick={reload}>
            <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </ToolBtn>
        </div>

        <div className="flex flex-1 items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "rgba(255,255,255,0.06)" }}>
          {config.showLockIcon && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="shrink-0" style={{ color: "#6b7686" }}>
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          )}
          <input
            value={active.address || ""}
            onChange={(e) => setEdited((ed) => ({ ...ed, [idx]: e.target.value }))}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            style={{ color: "#d7e0ef" }}
            spellCheck={false}
            placeholder="https://…"
          />
        </div>
      </div>

      {/* ---- context badges ---- */}
      {badges && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2" style={{ background: ch.toolbar }}>
          {badges.map((b, i) => <div key={i}>{b}</div>)}
          {players && players.length > 0 && (
            <div className="ml-auto hidden items-center -space-x-1.5 sm:flex">
              {players.slice(0, 3).map((p) => (
                <img key={p.id} src={p.avatar} alt={p.name} title={p.name}
                  className="h-6 w-6 rounded-full object-cover ring-2 ring-panel"
                  onError={(e) => (e.currentTarget.style.display = "none")} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---- single iframe; load advances the address bar ---- */}
      <div className="relative flex-1 bg-white">
        <iframe
          ref={frameRef}
          src={config.iframeSrc}
          title={config.title}
          className="h-full w-full border-0"
          sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
          onLoad={handleLoad}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-3">
          <span className="rounded-full bg-ink/80 px-3 py-1 text-[11px] text-slate-300 backdrop-blur">
            Join the full moon server
          </span>
        </div>
      </div>

      {/* ---- bottom bar ---- */}
      <div className="flex items-center justify-between border-t border-white/10 px-4 py-2.5" style={{ background: ch.toolbar }}>
          <span className="min-w-0 truncate text-[11px]" style={{ color: "#8a97ac" }}>
            <span style={{ color: accent }}>{config.brandLabel}</span> · {config.title}
          </span>
        <div className="flex items-center gap-2">
          <a href={config.iframeSrc} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-medium hover:opacity-80" style={{ color: "#aab6c9" }}>
            Open in new tab ↗
          </a>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="!px-3 !py-1.5">Close</Button>
          )}
        </div>
      </div>
    </div>
  );

  if (standalone) return inner;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-ink/85 backdrop-blur-sm" onClick={onClose} />
      {inner}
    </div>
  );
}

function ToolBtn({ children, disabled, label, onClick, ...rest }) {
  return (
    <button onClick={onClick} {...rest} title={label} disabled={disabled}
      className="rounded p-1.5 hover:bg-white/10 disabled:opacity-40" style={{ color: "#8a97ac" }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">{children}</svg>
    </button>
  );
}

export default BrowserFrame;
