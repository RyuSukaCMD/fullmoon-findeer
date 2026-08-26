import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { trackView } from "../services/analytics";
import { EmptyState, ErrorState, Skeleton, Button } from "../components/ui";
import { BrowserFrame } from "../components/BrowserFrame";
import { buildBrowserConfig } from "../data/config";

export function PublicPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setPage(null);
    api.pages
      .get(slug)
      .then(({ page }) => {
        if (!alive) return;
        setPage(page);
        // track a view per custom page visit (deduped by session)
        trackView(page.id);
      })
      .catch((e) => alive && setError(e.message || "Page not found"))
      .finally(() => alive && setLoading(false));
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

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24">
        <div className="text-center">
          <span className="text-5xl">⛵</span>
          <h1 className="title-clip mt-4 font-display text-5xl text-moon">LOST AT SEA</h1>
          <p className="mt-3 text-sm text-slate-400">{error}</p>
          <Link to="/" className="mt-6 inline-block"><Button>Back home</Button></Link>
        </div>
      </div>
    );
  }

  // Browser-mode pages render the multi-page custom browser instead of a
  // landing page.
  if (page.browser_mode) {
    const cfg = buildBrowserConfig(null, {
      title: page.title,
      logo: page.logo,
      iframeSrc: page.iframe_src || page.login_url,
      addressPages: page.address_pages,
      brandLabel: page.branding || "Full Moon Finder",
    });
    return <BrowserFrame config={cfg} standalone />;
  }

  const c = page.colors || { primary: "#f5c86a", accent: "#38bdf8", bg: "#050914" };
  const actions = page.buttons?.filter((b) => b.label && b.href) || [];
  const sections = page.sections?.filter((s) => s.heading || s.text) || [];

  return (
    <div
      className="min-h-[100dvh]"
      style={{ background: c.bg, ["--pc" /* primary */]: c.primary, color: "#e2e8f0" }}
    >
      <div className="mx-auto max-w-3xl px-5 py-10">
        {/* header */}
        <header>
          {page.branding && (
            <p className="text-xs font-semibold uppercase tracking-[0.3em]" style={{ color: c.primary }}>
              {page.branding}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4">
            {page.logo && (
              <img src={page.logo} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-white/10" onError={(e) => (e.currentTarget.style.display = "none")} />
            )}
            <div>
              <h1 className="font-display text-4xl sm:text-5xl" style={{ color: c.primary }}>{page.title}</h1>
              {page.description && <p className="mt-1 text-sm text-slate-400">{page.description}</p>}
            </div>
          </div>
        </header>

        {/* suspended / private notice */}
        {page.status === "suspended" ? (
          <div className="mt-12 flex flex-col items-center rounded-3xl border border-rose-500/20 bg-rose-500/5 p-10 text-center">
            <span className="text-4xl">🚫</span>
            <p className="mt-3 font-display text-2xl text-white">This page is suspended.</p>
            <p className="mt-1 text-sm text-slate-400">It is temporarily unavailable.</p>
          </div>
        ) : page.visibility === "private" ? (
          <div className="mt-12 flex flex-col items-center rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
            <span className="text-4xl">🔒</span>
            <p className="mt-3 font-display text-2xl text-white">This page is private.</p>
          </div>
        ) : (
          <>
            {/* content */}
            {page.content && (
              <section className="mt-10 whitespace-pre-line rounded-2xl border border-white/10 bg-white/5 p-6 text-slate-200">
                {page.content}
              </section>
            )}

            {/* sections */}
            {sections.length > 0 && (
              <section className="mt-6 space-y-4">
                {sections.map((s, i) => (
                  <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                    {s.heading && <h3 className="font-display text-2xl" style={{ color: c.primary }}>{s.heading}</h3>}
                    {s.text && <p className="mt-1 whitespace-pre-line text-sm text-slate-300">{s.text}</p>}
                  </div>
                ))}
              </section>
            )}

            {/* buttons */}
            {actions.length > 0 && (
              <div className="mt-8 flex flex-wrap gap-3">
                {actions.map((b, i) => (
                  <a
                    key={i}
                    href={b.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold text-ink transition-transform hover:-translate-y-0.5"
                    style={{ background: c.primary }}
                  >
                    {b.label}
                  </a>
                ))}
              </div>
            )}

            {/* display / login url */}
            {(page.display_url || page.login_url) && (
              <div className="mt-8 flex flex-wrap gap-3">
                {page.display_url && (
                  <a href={page.display_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
                    🔗 {page.display_url.replace(/^https?:\/\//, "")}
                  </a>
                )}
              </div>
            )}

            {/* footer */}
            <footer className="mt-14 border-t border-white/10 pt-6 text-center text-[11px] text-slate-500">
              Hosted on Full Moon Finder · view your page from the Studio
            </footer>
          </>
        )}
      </div>
    </div>
  );
}
