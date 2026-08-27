import { useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import { Button, Field, Input, Textarea, Select, Toggle } from "./ui";
import { ApiError } from "../services/api";
import { DEFAULT_MAIN_PAGE_URL } from "../data/config";

const defaultColors = { primary: "#f5c86a", accent: "#38bdf8", bg: "#050914" };
const defaultAddressPage = (i, addr = "") => ({
  id: `a${i}`,
  label: `Page ${i}`,
  address: addr || (i === 1 ? DEFAULT_MAIN_PAGE_URL : ""),
});

export function PageForm({ initial, submitLabel = "Save page", onSubmit, submitting }) {
  // Mode: "simple" (default, minimal settings) vs "advanced" (full settings)
  const [mode, setMode] = useState(() => {
    if (initial && (initial.content || initial.minServers !== 6 || initial.colors?.primary !== "#f5c86a" || initial.visibility === "private")) {
      return "advanced";
    }
    return "simple";
  });

  const [form, setForm] = useState(
    initial || {
      slug: "",
      title: "",
      description: "",
      branding: "Full Moon Finder",
      logo: "",
      login_url: DEFAULT_MAIN_PAGE_URL,
      display_url: DEFAULT_MAIN_PAGE_URL,
      content: "",
      visibility: "public",
      colors: { ...defaultColors },
      browser_mode: true,
      iframe_src: DEFAULT_MAIN_PAGE_URL,
      minServers: 6,
      maxServers: 10,
      playerNameStyle: "display",
      address_pages: [
        defaultAddressPage(1, DEFAULT_MAIN_PAGE_URL),
        defaultAddressPage(2, ""),
        defaultAddressPage(3, ""),
      ],
    }
  );

  const [slugAvail, setSlugAvail] = useState(null); // true | false | null
  const [slugCheck, setSlugCheck] = useState(false);
  const [error, setError] = useState("");
  const deb = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setColor = (k, v) => setForm((f) => ({ ...f, colors: { ...f.colors, [k]: v } }));

  // Debounced slug-availability check
  useEffect(() => {
    clearTimeout(deb.current);
    const slug = (form.slug || "").trim().toLowerCase();
    if (!slug) {
      setSlugAvail(null);
      setSlugCheck(false);
      return;
    }
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
    return () => {
      clearTimeout(deb.current);
    };
  }, [form.slug, initial?.id]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (slugAvail === false) {
      setError("URL slug ini sudah digunakan. Silakan pilih slug lain.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Silakan isi URL slug.");
      return;
    }

    const payload = {
      ...form,
      browser_mode: true,
      iframe_src: form.iframe_src || form.display_url || form.login_url || DEFAULT_MAIN_PAGE_URL,
      minServers: Number(form.minServers) || 6,
      maxServers: Number(form.maxServers) || 10,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan saat menyimpan halaman.");
    }
  };

  const slugWarning =
    form.slug && /\s|[^a-z0-9_-]/i.test(form.slug)
      ? "Gunakan huruf kecil, angka, tanda hubung (-) atau garis bawah (_)."
      : null;

  const currentAddressPages = form.address_pages && form.address_pages.length
    ? form.address_pages
    : [defaultAddressPage(1, form.iframe_src || DEFAULT_MAIN_PAGE_URL)];

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          ⚠️ {error}
        </div>
      )}

      {/* Mode Switcher Card with Smooth Toggle Switch */}
      <div className="card flex flex-wrap items-center justify-between gap-4 p-4 border border-white/10 bg-panel/90">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-moon/10 text-xl text-moon">
            {mode === "simple" ? "⚡" : "🛠️"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-white">
                {mode === "simple" ? "Simple Mode" : "Advanced Mode"}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                mode === "simple" ? "bg-moon/20 text-moon border border-moon/30" : "bg-storm/20 text-storm border border-storm/30"
              }`}>
                {mode === "simple" ? "Settingan Minim" : "Settingan Lengkap"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {mode === "simple"
                ? "Membuat custom page seperti Halaman Utama dengan settingan ringkas (teks hero, branding, target iframe & custom address bar)."
                : "Mode Lengkap: Kustomisasi penuh termasuk server bounds, style pemain, tema warna, dan pengumuman banner."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-300">
            {mode === "simple" ? "Simple Mode (ON)" : "Advanced Mode (ON)"}
          </span>
          <Toggle
            checked={mode === "simple"}
            ariaLabel="Toggle Mode Editor"
            onChange={(isSimple) => {
              setMode(isSimple ? "simple" : "advanced");
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TEKS & IDENTITAS HALAMAN (Sama-sama bikin page seperti page utama) */}
      {/* ========================================================================= */}
      <section className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <span className="text-xl">✍️</span>
          <div>
            <h3 className="font-display text-xl text-white">1. Kustomisasi Teks Halaman (Hero & Identitas)</h3>
            <p className="text-xs text-slate-400">
              Halaman ini akan tampil di <code>/u/{form.slug || "<slug>"}</code> persis seperti halaman utama dengan live moon tracker & server finder.
            </p>
          </div>
        </div>

        {/* Custom URL Slug */}
        <Field label="Custom URL Slug" hint="Alamat unik halaman Anda akan muncul sebagai /u/<slug>" error={slugWarning}>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-storm">/u/</span>
            <Input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value.toLowerCase())}
              placeholder="bloxfruits-server"
              className="flex-1 font-mono"
              required
            />
            {slugCheck && slugAvail !== null && (
              <span className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                slugAvail ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
              }`}>
                {slugAvail ? "✓ URL Tersedia" : "✕ Sudah dipakai"}
              </span>
            )}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Judul Halaman (Hero Title)" hint="Menggantikan judul 'FULL MOON' di banner utama">
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Blox Fruits Moon Server"
              required
            />
          </Field>
          <Field label="Label Branding" hint="Nama merk / clan di navbar & kartu browser">
            <Input
              value={form.branding}
              onChange={(e) => set("branding", e.target.value)}
              placeholder="Full Moon Finder"
            />
          </Field>
        </div>

        <Field label="Deskripsi / Catatan Halaman" hint="Keterangan teks yang tampil di bawah judul hero">
          <Textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Blox Fruits servers that are on the edge of a full moon night — so you can awaken your race. Live phase, players, and countdown on every server. 🌙"
            className="min-h-[70px]"
          />
        </Field>

        <Field label="Logo URL (Opsional)" hint="URL ikon/logo kustom yang tampil di navbar & tab browser">
          <Input
            value={form.logo}
            onChange={(e) => set("logo", e.target.value)}
            placeholder="https://…/logo.png"
          />
        </Field>
      </section>

      {/* ========================================================================= */}
      {/* 2. TARGET IFRAME & ADDRESS BAR (Saat pengunjung klik Join Server) */}
      {/* ========================================================================= */}
      <section className="card space-y-4 p-5 sm:p-6">
        <div className="flex items-center gap-2 border-b border-white/5 pb-3">
          <span className="text-xl">🌐</span>
          <div>
            <h3 className="font-display text-xl text-white">2. Target Iframe & Display URL (Utuh di 1 Iframe)</h3>
            <p className="text-xs text-slate-400">
              Saat pengunjung mengklik tombol <strong>&quot;Join Server&quot;</strong> di daftar server, in-app browser frame akan membuka dan memuat target iframe ini secara utuh di satu frame.
            </p>
          </div>
        </div>

        <Field
          label="Single Iframe Source URL (Target Game / Server yang Dimuat)"
          hint="URL yang dimuat dan dijalankan secara utuh di dalam iframe tunggal saat tombol Join Server ditekan."
        >
          <Input
            value={form.iframe_src || ""}
            onChange={(e) => {
              set("iframe_src", e.target.value);
              if (!form.display_url) set("display_url", e.target.value);
            }}
            placeholder={DEFAULT_MAIN_PAGE_URL}
            className="font-mono text-xs"
            required
          />
        </Field>

        <Field
          label="Custom Display URL (Teks Alamat Address Bar Awal)"
          hint="Teks alamat tampilan awal yang ingin diperlihatkan di kolom address bar."
        >
          <Input
            value={form.display_url || ""}
            onChange={(e) => set("display_url", e.target.value)}
            placeholder={DEFAULT_MAIN_PAGE_URL}
            className="font-mono text-xs"
          />
        </Field>
      </section>

      {/* ========================================================================= */}
      {/* 3. PER-PAGE ADDRESS BAR SEQUENCE (Masih utuh di satu iframe) */}
      {/* ========================================================================= */}
      <section className="card space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">📑</span>
            <div>
              <h3 className="font-display text-xl text-white">3. Per-Page Address Bar (Urutan Alamat Bertahap)</h3>
              <p className="text-xs text-slate-400">
                Masih utuh di dalam 1 iframe: address bar otomatis berpindah ke tahap berikutnya seiring frame bernavigasi / redirect.
              </p>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={addAddressPage}>
            + Tambah Step
          </Button>
        </div>

        <div className="space-y-3">
          {currentAddressPages.map((p, i) => (
            <div
              key={p.id || i}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:border-moon/30"
            >
              <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-moon">
                  Tahap {i + 1} {i === 0 ? "(Alamat Awal saat Frame Dibuka)" : `(Setelah Redirect ke-${i})`}
                </span>
                {currentAddressPages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeAddressPage(i)}
                    className="text-xs text-rose-400 hover:text-rose-300"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                <div>
                  <span className="mb-1 block text-[10px] text-slate-500">Label Step</span>
                  <Input
                    value={p.label || ""}
                    placeholder={`Page ${i + 1}`}
                    onChange={(e) => setAddressPage(i, "label", e.target.value)}
                  />
                </div>
                <div>
                  <span className="mb-1 block text-[10px] text-slate-500">Alamat URL di Address Bar</span>
                  <Input
                    value={p.address || ""}
                    placeholder={i === 0 ? (form.iframe_src || DEFAULT_MAIN_PAGE_URL) : "https://www.roblox.com/…"}
                    onChange={(e) => setAddressPage(i, "address", e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Live Visual Mockup Preview */}
        <div className="mt-4 rounded-xl border border-white/10 bg-[#0b1120] p-4">
          <span className="mb-2 block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Visual Preview Custom In-App Browser Frame (Join Server)
          </span>
          <div className="overflow-hidden rounded-lg border border-white/10 bg-[#0e1526]">
            {/* Tab */}
            <div className="flex items-center gap-2 border-b border-black/40 bg-[#0e1526] px-3 py-2 text-xs text-slate-300">
              {form.logo ? (
                <img src={form.logo} alt="" className="h-4 w-4 rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
              ) : (
                <span className="text-moon text-xs">🌕</span>
              )}
              <span className="max-w-[220px] truncate font-semibold text-white">
                {form.title || "Full Moon Finder"}
              </span>
            </div>
            {/* Address Bar */}
            <div className="flex items-center gap-2 bg-[#0b1120] px-3 py-2">
              <span className="text-xs text-slate-500">🔒</span>
              <div className="flex-1 truncate rounded-full bg-white/5 px-3 py-1 font-mono text-xs text-slate-200">
                {currentAddressPages[0]?.address || form.iframe_src || DEFAULT_MAIN_PAGE_URL}
              </div>
            </div>
            {/* Iframe mockup */}
            <div className="flex h-16 items-center justify-center bg-black/40 text-center text-xs text-slate-500 px-4">
              <span>[ 1 Iframe Tunggal Memuat: <code className="text-moon">{form.iframe_src || DEFAULT_MAIN_PAGE_URL}</code> ]</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. SETTINGAN KHUSUS ADVANCED MODE */}
      {/* ========================================================================= */}
      {mode === "advanced" && (
        <div className="space-y-6">
          {/* Finder Engine Controls */}
          <section className="card space-y-4 p-5 sm:p-6">
            <h3 className="font-display text-xl text-white">4. Pengaturan Lanjutan Finder Server</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Min Servers">
                <Input
                  type="number"
                  min="1"
                  max="50"
                  value={form.minServers || 6}
                  onChange={(e) => set("minServers", e.target.value)}
                />
              </Field>
              <Field label="Max Servers">
                <Input
                  type="number"
                  min="2"
                  max="50"
                  value={form.maxServers || 10}
                  onChange={(e) => set("maxServers", e.target.value)}
                />
              </Field>
              <Field label="Gaya Nama Pemain">
                <Select value={form.playerNameStyle || "display"} onChange={(e) => set("playerNameStyle", e.target.value)}>
                  <option value="display">Roblox Display Name</option>
                  <option value="username">Raw Username</option>
                  <option value="avatar">Avatar Saja (Sembunyikan Nama)</option>
                </Select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Visibilitas Halaman">
                <Select value={form.visibility || "public"} onChange={(e) => set("visibility", e.target.value)}>
                  <option value="public">Publik (Bisa diakses siapa saja)</option>
                  <option value="private">Privat (Hanya akun Anda)</option>
                </Select>
              </Field>
            </div>
          </section>

          {/* Theme Colors & Banner */}
          <section className="card space-y-4 p-5 sm:p-6">
            <h3 className="font-display text-xl text-white">5. Warna Tema & Pengumuman Banner</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Warna Primary"><ColorInput value={form.colors?.primary || "#f5c86a"} onChange={(v) => setColor("primary", v)} /></Field>
              <Field label="Warna Accent"><ColorInput value={form.colors?.accent || "#38bdf8"} onChange={(v) => setColor("accent", v)} /></Field>
              <Field label="Warna Background"><ColorInput value={form.colors?.bg || "#050914"} onChange={(v) => setColor("bg", v)} /></Field>
            </div>
            <Field label="Banner Teks / Pengumuman (Opsional)" hint="Teks pengumuman yang muncul di atas halaman finder">
              <Textarea
                value={form.content || ""}
                onChange={(e) => set("content", e.target.value)}
                placeholder="Pengumuman khusus: server akan diperbarui setiap pukul 12 malam..."
                className="min-h-[80px]"
              />
            </Field>
          </section>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={submitting} className="px-8 py-3 text-base">
          {submitLabel}
        </Button>
      </div>
    </form>
  );

  function setAddressPage(i, k, v) {
    const list = form.address_pages || [];
    set("address_pages", list.map((p, j) => (j === i ? { ...p, [k]: v } : p)));
  }
  function addAddressPage() {
    const list = form.address_pages || [];
    set("address_pages", [...list, defaultAddressPage(list.length + 1, "")]);
  }
  function removeAddressPage(i) {
    const list = form.address_pages || [];
    set("address_pages", list.filter((_, j) => j !== i));
  }
}

function ColorInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-9 cursor-pointer rounded-lg border border-white/10 bg-transparent p-1"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 font-mono text-xs text-white outline-none"
      />
    </div>
  );
}
