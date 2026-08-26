import { Link } from "react-router-dom";
import { Moon } from "./Moon";

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-night/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 py-10 sm:flex-row sm:justify-between">
        <div className="flex items-center gap-3">
          <Moon phaseKey="full" size={26} glowing={false} />
          <div className="leading-none">
            <span className="title-clip font-display text-lg text-moon">FULL MOON</span>
            <span className="ml-2 text-[10px] tracking-[0.25em] text-slate-400 uppercase">
              Finder
            </span>
          </div>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
          <Link to="/" className="hover:text-moon">Home</Link>
          <Link to="/find" className="hover:text-moon">Find Server</Link>
          <Link to="/about" className="hover:text-moon">About</Link>
        </nav>

        <p className="text-xs text-slate-500">
          Unofficial fan tool · not affiliated with Roblox or Blox Fruits.
        </p>
      </div>
    </footer>
  );
}
