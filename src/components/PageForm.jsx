import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { Button, Field, Input, Textarea, Select, Toggle } from "./ui";
import { ApiError } from "../services/api";
import { DEFAULT_MAIN_PAGE_URL } from "../data/config";

const emptySection = { heading: "", text: "" };
const emptyButton = { label: "", href: "" };
const defaultColors = { primary: "#f5c86a", accent: "#38bdf8", bg: "#050914" };
const defaultAddressPage = (i) => ({ id: `a${i}`, label: `Page ${i}`, address: "" });

export function PageForm({ initial, submitLabel = "Save page", onSubmit, submitting }) {
  // `initial` is the object to prefill when editing; null when creating.
  const [form, setForm] = useState(
    initial || {
      slug: "", title: "", description: "", branding: "", logo: "",
      login_url: "", display_url: "", content: "", visibility: "public",
      colors: { ...defaultColors },
      sections: [emptySection],
      buttons: [emptyButton],
      browser_mode: false,
      iframe_src: DEFAULT_MAIN_PAGE_URL,
      address_pages: [defaultAddressPage(1), defaultAddressPage(2), defaultAddressPage(3)],
    }
  );
  const [slugAvail, setSlugAvail] = useState(null); // true | false | null(unknown)
  const [slugCheck, setSlugCheck] = useState(false);
  const [error, setError] = useState("");
  const deb = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setColor = (k, v) => setForm((f) => ({ ...f, colors: { ...f.colors, [k]: v } }));

  // debounced slug-availability check
  useEffect(() => {
    clearTimeout(deb.current);
    const slug = form.slug.trim().toLowerCase();
    if (!slug) { setSlugAvail(null); setSlugCheck(false); return; }
    setSlugCheck(true);
    deb.current = setTimeout(async () => {
      try {
        const { available } = await api.pages.slugAvailable(slug, initial?.id || "");
        setSlugAvail(available);
      } catch {
        setSlugAvail(null);
        setSlugCheck(false);
      }
    }, 350);
    return () => clearTimeout(deb.current);
  }, [form.slug, initial?.id]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (slugAvail === false) {
      setError("This URL is already taken.");
      return;
    }
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  };

  const slugWarning =
    form.slug && /\s|[^a-z0-9_-]/i.test(form.slug)
      ? "Use lowercase letters, numbers, dashes or underscores."
      : null;

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div>
      )}

      {/* identity */}
      <section className="card space-y-4 p-5">
        <h3 className="font-display text-lg text-white">Identity</h3>
        <Field label="Custom URL" hint="Slug appears as /u/<slug>." error={slugWarning}>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">/u/</span>
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="moonlit-harbor" className="flex-1" />
            {slugCheck && slugAvail !== null && (
              <span className={`shrink-0 text-xs font-semibold ${slugAvail ? "text-emerald-300" : "text-rose-300"}`}>
                {slugAvail ? "URL available" : "This URL is already taken."}
              </span>
            )}
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Display URL" hint="Shown on the page.">
            <Input value={form.display_url} onChange={(e) => set("display_url", e.target.value)} placeholder="https://roblox.com" />
          </Field>
          <Field label="Login URL" hint="Buttons use this if set.">
            <Input value={form.login_url} onChange={(e) => set("login_url", e.target.value)} placeholder="https://www.roblox.com/games/2753915549/Blox-Fruits" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Moonlit Harbor" />
          </Field>
          <Field label="Branding" hint="Small label above the title.">
            <Input value={form.branding} onChange={(e) => set("branding", e.target.value)} placeholder="Full Moon Finder" />
          </Field>
        </div>
        <Field label="Description">
          <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="A short description of this page." />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Logo URL (optional)">
            <Input value={form.logo} onChange={(e) => set("logo", e.target.value)} placeholder="https://…/logo.png" />
          </Field>
          <Field label="Visibility">
            <Select value={form.visibility} onChange={(e) => set("visibility", e.target.value)}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </Select>
          </Field>
        </div>
      </section>

      {/* appearance */}
      <section className="card space-y-4 p-5">
        <h3 className="font-display text-lg text-white">Appearance</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Primary color"><ColorInput value={form.colors.primary} onChange={(v) => setColor("primary", v)} /></Field>
          <Field label="Accent color"><ColorInput value={form.colors.accent} onChange={(v) => setColor("accent", v)} /></Field>
          <Field label="Background"><ColorInput value={form.colors.bg} onChange={(v) => setColor("bg", v)} /></Field>
        </div>
        <Field label="Main content">
          <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Rich text shown on the page." className="min-h-[120px]" />
        </Field>
      </section>

      {/* browser mode */}
      <section className="card space-y-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg text-white">Browser mode</h3>
            <p className="text-xs text-slate-400">
              Render this page as the custom browser (multi-page address bar + one iframe) and edit its URLs.
            </p>
          </div>
          <Toggle checked={form.browser_mode} onChange={(v) => set("browser_mode", v)} />
        </div>

        {form.browser_mode && (
          <div className="space-y-4">
            <Field label="Single iframe URL" hint="The one URL the frame always loads.">
              <Input value={form.iframe_src || ""} onChange={(e) => set("iframe_src", e.target.value)} placeholder="https://…" />
            </Field>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Address sequence (in order shown as the frame redirects)</span>
                <Button type="button" variant="ghost" size="sm" onClick={addAddressPage}>+ Add</Button>
              </div>
              <p className="mb-2 text-[11px] text-slate-500">
                The address bar shows page 1, then steps to page 2, 3… each time the
                single iframe navigates. Tip: use URLs the site actually redirects through.
              </p>
              <div className="space-y-2">
                {form.address_pages.map((p, i) => (
                  <div key={p.id || i} className="grid items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-2.5 sm:grid-cols-[150px_1fr_auto]">
                    <Input value={p.label} placeholder={`Page ${i + 1}`} onChange={(e) => setAddressPage(i, "label", e.target.value)} />
                    <Input value={p.address} placeholder="https://…" onChange={(e) => setAddressPage(i, "address", e.target.value)} />
                    <Button type="button" variant="subtle" size="sm" onClick={() => removeAddressPage(i)}>Remove</Button>
                  </div>
                ))}
                {form.address_pages.length === 0 && (
                  <p className="text-xs text-slate-500">No address pages. Add one to get started.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* sections */}
      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-white">Sections</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => set("sections", [...form.sections, emptySection])}>+ Add</Button>
        </div>
        {form.sections.map((sec, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-slate-500">Section {i + 1}</span>
              <Button type="button" variant="subtle" size="sm" onClick={() => set("sections", form.sections.filter((_, j) => j !== i))}>Remove</Button>
            </div>
            <div className="mt-2 grid gap-2">
              <Input value={sec.heading} placeholder="Heading" onChange={(e) => setSection(i, "heading", e.target.value)} />
              <Textarea value={sec.text} placeholder="Body text" className="min-h-[60px]" onChange={(e) => setSection(i, "text", e.target.value)} />
            </div>
          </div>
        ))}
      </section>

      {/* buttons */}
      <section className="card space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-white">Buttons</h3>
          <Button type="button" variant="ghost" size="sm" onClick={() => set("buttons", [...form.buttons, emptyButton])}>+ Add</Button>
        </div>
        {form.buttons.map((b, i) => (
          <div key={i} className="grid items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:grid-cols-[1fr_1.5fr_auto]">
            <Input value={b.label} placeholder="Label" onChange={(e) => setButton(i, "label", e.target.value)} />
            <Input value={b.href} placeholder="https://…" onChange={(e) => setButton(i, "href", e.target.value)} />
            <Button type="button" variant="subtle" size="sm" onClick={() => set("buttons", form.buttons.filter((_, j) => j !== i))}>Remove</Button>
          </div>
        ))}
      </section>

      <div className="flex justify-end">
        <Button type="submit" loading={submitting} className="px-8">{submitLabel}</Button>
      </div>
    </form>
  );

  function setSection(i, k, v) {
    set("sections", form.sections.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  }
  function setButton(i, k, v) {
    set("buttons", form.buttons.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  }
  function setAddressPage(i, k, v) {
    set("address_pages", form.address_pages.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  }
  function addAddressPage() {
    set("address_pages", [...form.address_pages, defaultAddressPage(form.address_pages.length + 1)]);
  }
  function removeAddressPage(i) {
    set("address_pages", form.address_pages.filter((_, j) => j !== i));
  }
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1" />
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 font-mono text-xs text-white outline-none" />
    </div>
  );
}
