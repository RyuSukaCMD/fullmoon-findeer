import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Moon } from "./Moon";
import { useAuth } from "../auth/AuthContext";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const links = [
    { to: "/", label: "Find Servers" },
    { to: "/about", label: "About" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all ${
        scrolled ? "bg-ink/85 backdrop-blur-md border-b border-white/5" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Moon phaseKey="full" size={30} glowing={false} />
          <div className="leading-none">
            <span className="title-clip text-lg font-bold text-moon">FULL MOON</span>
            <span className="ml-2 text-[10px] tracking-[0.25em] text-slate-400 uppercase">
              Finder
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-moon/10 text-moon" : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {user && (
            <NavLink
              to="/starnova"
              className="rounded-full px-4 py-2 text-sm font-medium text-storm hover:bg-white/5"
            >
              {user.role === "admin" ? "Admin" : "Studio"}
            </NavLink>
          )}
        </nav>

        <button
          className="sm:hidden rounded-lg p-2 text-slate-200"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d={open ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"} strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <nav className="px-4 pb-4 sm:hidden">
          <div className="flex flex-col gap-1 rounded-2xl border border-white/5 bg-panel p-2">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-medium ${isActive ? "bg-moon/10 text-moon" : "text-slate-300"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            {user && (
              <NavLink
                to="/starnova"
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-storm"
              >
                {user.role === "admin" ? "Admin Panel" : "Studio"}
              </NavLink>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
