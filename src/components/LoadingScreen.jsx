import { useEffect, useState } from "react";
import { Moon } from "./Moon";

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress((p) => Math.min(p + Math.floor(Math.random() * 9) + 4, 100));
    }, 160);
    const ph = setInterval(() => setPhase((x) => x + 1), 700);
    return () => {
      clearInterval(t);
      clearInterval(ph);
    };
  }, []);

  const done = progress >= 100;
  const messages = ["Finding the moon…", "Scanning servers…", "Checking phases…"];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-[12%] h-40 w-40 rounded-full bg-moon/10 blur-3xl" />
        <div className="absolute bottom-[14%] right-[10%] h-52 w-52 rounded-full bg-fruit/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="animate-breathe">
          <Moon phaseKey="full" size={92} />
        </div>

        <h1 className="title-clip mt-7 text-2xl sm:text-3xl font-bold text-moon">
          FULL MOON FINDER
        </h1>
        <p className="mt-1 text-xs tracking-[0.3em] text-slate-400 uppercase">
          Blox Fruits
        </p>

        <div className="mt-8 h-1.5 w-64 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fruit to-moon transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-4 flex w-64 items-center justify-between text-[11px] text-slate-400">
          <span className="animate-pulse">{messages[phase % messages.length]}</span>
          <span className="tabular-nums">{progress}%</span>
        </div>

        {done && (
          <p className="mt-4 text-xs text-moon/80">The night sky is clear. Entering…</p>
        )}
      </div>
    </div>
  );
}
