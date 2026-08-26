import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { getSiteConfig, setSiteConfigCache } from "../../services/siteconfig";
import { Button, Field, Input, Textarea, Select, Skeleton, ErrorState, useToast } from "../../components/ui";

const emptyPage = (i) => ({ id: `a${i}`, label: `Page ${i}`, address: "" });

// The owner-facing "everything" settings for the finder: server list bounds,
// update interval, the main page (iframe url — default from .env), the
// multi-page address bar, the logo image (e.g. a GitHub raw photo) next to the
// page name, and the page name itself. Saved to the backend and persisted.
export function SiteSettings() {
  const toast = useToast();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const cfg = await getSiteConfig(true);
      setForm({
        minServers: cfg.minServers,
        maxServers: cfg.maxServers,
        updateIntervalMin: cfg.updateIntervalMin,
        updateIntervalMax: cfg.updateIntervalMax,
        mainPageUrl: cfg.mainPageUrl,
        iframeSrc: cfg.iframeSrc,
        logo: cfg.logo,
        title: cfg.title,
        brandLabel: cfg.brandLabel,
        playerNameStyle: cfg.playerNameStyle || "display",
        chrome: { ...(cfg.chrome || {}) },
        showLockIcon: cfg.showLockIcon !== false,
        addressPages: (cfg.addressPages || []).map((p) => ({ ...p })),
      });
    } catch (e) {
      setError(e.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (loading)
    return <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>;
  if (error || !form) return <ErrorState message={error} onRetry={load} />;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setAddressPage = (i, k, v) =>
    setForm((f) => ({ ...f, addressPages: f.addressPages.map((p, j) => (j === i ? { ...p, [k]: v } : p)) }));
  const addAddressPage = () =>
    setForm((f) => ({ ...f, addressPages: [...f.addressPages, emptyPage(f.addressPages.length + 1)] }));
  const removeAddressPage = (i) =>
    setForm((f) => ({ ...f, addressPages: f.addressPages.filter((_, j) => j !== i) }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const cleaned = {
        ...form,
        addressPages: form.addressPages.filter((p) => p.label || p.address),
      };
      const { config, message } = await api.site.update(cleaned);
      setSiteConfigCache(config);
      toast.success(message || "Settings saved");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const numProps = {
    type: "number",
    className: "!w-28",
  };

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-white">Finder settings</h2>
          <p className="text-sm text-slate-400">Server list, update speed, browser & page branding.</p>
        </div>
        <Button type="submit" loading={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div>
      )}

      {/* server list */}
      <section className="card space-y-4 p-5">
        <h3 className="font-display text-lg text-white">Server finder</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Min servers" hint="Minimum live servers in the list.">
            <Input {...numProps} min="1" max="100" value={form.minServers} onChange={(e) => set("minServers", Number(e.target.value))} />
          </Field>
          <Field label="Max servers" hint="Maximum live servers in the list.">
            <Input {...numProps} min="1" max="100" value={form.maxServers} onChange={(e) => set("maxServers", Number(e.target.value))} />
          </Field>
          <Field label="Update interval (min, seconds)">
            <Input {...numProps} min="5" max="3600" value={form.updateIntervalMin} onChange={(e) => set("updateIntervalMin", Number(e.target.value))} />
          </Field>
          <Field label="Update interval (max, seconds)">
            <Input {...numProps} min="5" max="3600" value={form.updateIntervalMax} onChange={(e) => set("updateIntervalMax", Number(e.target.value))} />
          </Field>
        </div>
      </section>

      {/* browser */}
      <section className="card space-y-4 p-5">
        <h3 className="font-display text-lg text-white">Browser</h3>
        <Field label="Main page URL" hint="Default from .env; the single iframe loads this.">
          <Input value={form.mainPageUrl} onChange={(e) => set("mainPageUrl", e.target.value)} />
        </Field>
        <Field label="Single iframe URL" hint="The one URL the frame always loads.">
          <Input value={form.iframeSrc} onChange={(e) => set("iframeSrc", e.target.value)} />
        </Field>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Address sequence (shown in order as the frame redirects)</span>
            <Button type="button" variant="ghost" size="sm" onClick={addAddressPage}>+ Add</Button>
          </div>
          <p className="mb-2 text-[11px] text-slate-500">
            The address bar shows page 1, then steps to page 2, 3… each time the single
            iframe navigates. Use the URLs the site actually redirects through.
          </p>
          <div className="space-y-2">
            {form.addressPages.map((p, i) => (
              <div key={p.id || i} className="grid items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 sm:grid-cols-[150px_1fr_auto]">
                <Input value={p.label} placeholder={`Page ${i + 1}`} onChange={(e) => setAddressPage(i, "label", e.target.value)} />
                <Input value={p.address} placeholder="https://…" onChange={(e) => setAddressPage(i, "address", e.target.value)} />
                <Button type="button" variant="subtle" size="sm" onClick={() => removeAddressPage(i)}>Remove</Button>
              </div>
            ))}
            {form.addressPages.length === 0 && <p className="text-xs text-slate-500">No address pages.</p>}
          </div>
        </div>
      </section>

      {/* branding */}
      <section className="card space-y-4 p-5">
        <h3 className="font-display text-lg text-white">Page branding</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Page name">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Brand label">
            <Input value={form.brandLabel} onChange={(e) => set("brandLabel", e.target.value)} />
          </Field>
        </div>
        <Field label="Player name display" hint="Controls how player names appear on every server card.">
          <Select
            value={form.playerNameStyle}
            onChange={(e) => set("playerNameStyle", e.target.value)}
          >
            <option value="display">Display name (recommended)</option>
            <option value="username">Username</option>
            <option value="avatar">Avatar only (hide names)</option>
          </Select>
        </Field>
        <Field label="Logo image URL" hint="Shown next to the page name. Use a GitHub raw photo URL (e.g. raw.githubusercontent.com/…/logo.png).">
          <Textarea value={form.logo} onChange={(e) => set("logo", e.target.value)} placeholder="https://raw.githubusercontent.com/user/repo/main/logo.png" className="min-h-[46px]" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Accent color"><ColorInput value={form.chrome.accent || "#f5c86a"} onChange={(v) => set("chrome", { ...form.chrome, accent: v })} /></Field>
          <Field label="Top bar"><ColorInput value={form.chrome.topBar || "#0e1526"} onChange={(v) => set("chrome", { ...form.chrome, topBar: v })} /></Field>
          <Field label="Toolbar"><ColorInput value={form.chrome.toolbar || "#0b1120"} onChange={(v) => set("chrome", { ...form.chrome, toolbar: v })} /></Field>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" loading={saving} className="px-8">{saving ? "Saving…" : "Save settings"}</Button>
      </div>
    </form>
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 font-mono text-xs text-white outline-none" />
    </div>
  );
}
