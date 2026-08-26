import { Link } from "react-router-dom";
import { Moon } from "../components/Moon";

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="relative">
        <Moon phaseKey="crescent" size={140} glowing={false} />
        <span className="absolute -right-6 top-2 text-2xl animate-floaty">⛵</span>
      </div>

      <h1 className="title-clip mt-6 font-display text-7xl text-moon">404</h1>
      <p className="mt-2 font-display text-xl tracking-wide text-white">
        LOST AT SEA
      </p>
      <p className="mt-3 max-w-sm text-slate-400">
        This page has drifted off the map. The moon is still out there — let's
        get you back on course. 🌙
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-fruit px-6 py-3 text-sm">
          Back home
        </Link>
        <Link to="/find" className="btn-ghost px-6 py-3 text-sm">
          Find a server
        </Link>
      </div>
    </div>
  );
}
