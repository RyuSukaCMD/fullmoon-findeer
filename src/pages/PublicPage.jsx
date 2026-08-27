import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { trackView } from "../services/analytics";
import { Skeleton, Button } from "../components/ui";
import { BrowserFrame } from "../components/BrowserFrame";
import { JoinModal } from "../components/JoinModal";
import { Home } from "./Home";
import { Footer } from "../components/Footer";
import { Moon } from "../components/Moon";
import { buildBrowserConfig } from "../data/config";

export function PublicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [joinServer, setJoinServer] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setPage(null);
    api.pages
      .get(slug)
      .then(({ page: p }) => {
        if (!alive) return;
        setPage(p);
        trackView(p.id);
      })
      .catch((e) => {
        if (alive) setError(e.message || "Page not found");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <Skeleton className="h-40 rounded-3xl" />
        <Skeleton className="mt-6 h-8 w-2/3 rounded" />
        <Skeleton className="mt-2 h-4 w-1/2 rounded" />
        <Skeleton className="mt-8 h-20 rounded-2xl" />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24 text-center">
        <span className="text-5xl">⛵</span>
        <h1 className="title-clip mt-4 font-display text-5xl text-moon">LOST AT SEA</h1>
        <p className="mt-3 text-sm text-slate-400">{error || "Page not found"}</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Back home</Button>
        </Link>
      </div>
    );
  }

  // Suspended or private notice
  if (page.status === "suspended") {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <span className="text-5xl">🚫</span>
        <h2 className="mt-4 font-display text-3xl text-white">This page is suspended</h2>
        <p className="mt-2 text-sm text-slate-400">It is currently unavailable.</p>
        <Link to="/" className="mt-6 inline-block"><Button>Back home</Button></Link>
      </div>
    );
  }

  if (page.visibility === "private") {
    return (
      <div className="mx-auto max-w-lg px-5 py-24 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="mt-4 font-display text-3xl text-white">This page is private</h2>
        <p className="mt-2 text-sm text-slate-400">Only the owner can view this page.</p>
        <Link to="/" className="mt-6 inline-block"><Button>Back home</Button></Link>
      </div>
    );
  }

  // Standalone Browser Mode: if the creator chose to open the browser frame directly
  if (page.standalone_browser) {
    const cfg = buildBrowserConfig(page, {
      title: page.title,
      logo: page.logo,
      iframeSrc: page.iframe_src || page.login_url || page.display_url,
      addressPages: page.address_pages,
      brandLabel: page.branding || "Full Moon Finder",
    });
    return <BrowserFrame config={cfg} standalone />;
  }

  // Default Custom Page: EXACTLY LIKE THE MAIN PAGE, fully customized by the creator!
  const c = page.colors || { primary: "#f5c86a", accent: "#38bdf8", bg: "#050914" };

  return (
    <div
      className="flex min-h-[100dvh] flex-col"
      style={{
        background: c.bg || "#050914",
        color: "#e2e8f0",
      }}
    >
      {/* Custom Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            {page.logo ? (
              <img
                src={page.logo}
                alt=""
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-white/10"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ) : (
              <Moon phaseKey="full" size={30} glowing={false} />
            )}
            <div className="leading-none">
              <span className="title-clip text-lg font-bold text-moon">
                {page.branding || "FULL MOON"}
              </span>
              <span className="ml-2 text-[10px] tracking-[0.25em] text-slate-400 uppercase">
                Finder
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              Main Finder
            </Link>
            <span className="rounded-full border border-moon/30 bg-moon/10 px-3 py-1 font-mono text-xs font-semibold text-moon">
              /u/{page.slug}
            </span>
          </nav>
        </div>
      </header>

      {/* Main Finder Experience configured with the creator's settings */}
      <main className="flex-1">
        {/* Optional Announcement Banner / Note if provided */}
        {page.content && (
          <div className="mx-auto max-w-6xl px-5 pt-6">
            <div className="rounded-2xl border border-moon/30 bg-moon/5 p-4 text-center text-sm text-slate-200">
              {page.content}
            </div>
          </div>
        )}

        <Home onJoin={setJoinServer} customConfig={page} />
      </main>

      {/* Footer */}
      <Footer />

      {/* Custom Join Modal using this page's custom single iframe and custom address sequence! */}
      {joinServer && (
        <JoinModal
          server={joinServer}
          overrideConfig={page}
          onClose={() => setJoinServer(null)}
        />
      )}
    </div>
  );
}
