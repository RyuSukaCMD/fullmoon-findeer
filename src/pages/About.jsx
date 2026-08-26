import { Link } from "react-router-dom";
import { Moon } from "../components/Moon";

export function About() {
  return (
    <div className="mx-auto max-w-3xl px-5 pb-24">
      <section className="animate-rise pt-12 text-center">
        <div className="mx-auto w-fit animate-floaty">
          <Moon phaseKey="full" size={96} />
        </div>
        <h1 className="title-clip mt-6 font-display text-5xl text-moon">
          FULL MOON FINDER
        </h1>
        <p className="mt-2 text-sm tracking-[0.3em] text-slate-400 uppercase">
          A Blox Fruits companion tool
        </p>
      </section>

      <section className="card mt-10 p-8">
        <h2 className="font-display text-2xl text-white">What is this?</h2>
        <p className="mt-3 leading-relaxed text-slate-300">
          Full Moon Finder tracks the live moon phase and helps you find Blox
          Fruits servers where a full moon night is near — the perfect time to
          awaken your race. It shows each server's capacity, online players,
          and the remaining time until the next full moon, so you can jump in
          at the right moment.
        </p>
      </section>

      <section className="card mt-4 p-8">
        <h2 className="font-display text-2xl text-white">Is this official?</h2>
        <p className="mt-3 leading-relaxed text-slate-300">
          No. This is an unofficial fan-made tool. It is not affiliated with,
          endorsed by, or connected to Roblox or the Blox Fruits developers.
          Joining is done through the official game page. All trademarks belong
          to their respective owners.
        </p>
      </section>

      <section className="card mt-4 p-8">
        <h2 className="font-display text-2xl text-white">Why "Moon Finder"?</h2>
        <ul className="mt-4 space-y-3">
          {[
            "Live moon phase and countdown",
            "Servers ranked by distance to full moon",
            "Capacity & online count at a glance",
            "Simple, honest join links — no tricks",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-slate-300">
              <span className="mt-0.5 text-moon">✦</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex justify-center">
        <Link to="/find" className="btn-fruit px-6 py-3 text-sm">
          Start finding servers →
        </Link>
      </div>
    </div>
  );
}
