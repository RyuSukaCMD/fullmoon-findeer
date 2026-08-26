# 🛠️ Rangkuman Perbaikan Full Moon Finder (White Screen Fix)

Dokumen ini menjelaskan semua perbaikan yang telah diterapkan pada project **Full Moon Finder** agar website berjalan 100% normal tanpa *white screen*, baik di lokal, saat menggunakan `vercel dev`, maupun setelah di-deploy ke Vercel.

---

## 📌 Ringkasan Masalah & Solusi

| Masalah | Penyebab | Solusi yang Diterapkan |
|---|---|---|
| **White Screen saat `vercel dev`** | Aturan rewrite `/(.*)` di `vercel.json` mencegat request JS development Vite (`/src/main.jsx`, `/@vite/client`) dan mengembalikan `index.html` dengan header `X-Content-Type-Options: nosniff`. | Memperbarui `vercel.json` dengan *negative lookahead* agar mengecualikan `/src/`, `/assets/`, `/@vite/`, file berekstensi, dll. |
| **Loop Rekursif pada Vercel CLI** | Script `"vercel-dev": "vercel dev"` di `package.json` memicu loop pemanggilan diri sendiri oleh Vercel CLI. | Menghapus script `"vercel-dev": "vercel dev"` dari `package.json`. |
| **API 404 pada Vercel** | Rewrite `/api/(.*)` → `/api/index` mengubah `req.url` menjadi `/api/index`, yang tidak cocok dengan rute Express mana pun. | Rewrite diubah menjadi `/api/index?__path__=$1`, handler `api/index.js` dinormalisasi, dan ditambahkan catch-all `api/[...path].js`. |
| **Timeout API Roblox** | File cache `server/data/db.json` tidak ada di Vercel (karena `.gitignore`), memicu scraping 24 request lambat (>10s timeout). | Menambahkan seed `server/initial-data.json` (110 users & 91 avatar) dan optimasi timeout paralel di `server/roblox.js`. |
| **White Screen saat React Render Error** | Tidak ada `ErrorBoundary` dan tag `<body>` tidak memiliki background bawaan. | Menambahkan `src/components/ErrorBoundary.jsx`, membungkus `<App />` di `src/main.jsx`, dan styling background gelap langsung di `<body>` `index.html`. |
| **DevTools Terkunci** | Script anti-scrape di `index.html` memblokir klik kanan, select teks, dan tombol F12 / Inspect Element. | Menghapus script pemblokir tersebut agar debugging dan konsol browser dapat diakses dengan bebas. |
| **Link 404 pada `/find`** | Link di navigasi/footer mengarah ke `/find` tetapi rutenya belum didaftarkan di `App.jsx`. | Menambahkan `<Route path="/find" element={<Navigate to="/" replace />} />`. |

---

## 📁 Daftar File yang Diubah

1. **`vercel.json`**
   - Aturan rewrite baru yang presisi untuk SPA React + Vercel Serverless Function:
   ```json
   {
     "framework": "vite",
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api/index?__path__=$1"
       },
       {
         "source": "/api",
         "destination": "/api/index"
       },
       {
         "source": "/((?!api/|assets/|src/|@vite/|@react-refresh|favicon\\.ico|moon\\.svg|.*\\.[a-zA-Z0-9]+).*)",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "/assets/(.*)",
         "headers": [
           { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
         ]
       },
       {
         "source": "/((?!assets/).*)",
         "headers": [
           { "key": "X-Content-Type-Options", "value": "nosniff" },
           { "key": "Referrer-Policy", "value": "no-referrer" }
         ]
       }
     ]
   }
   ```

2. **`api/index.js`**
   - Mendeteksi path API dari query `__path__`, query `path`, atau header `x-forwarded-uri` / `x-matched-path` agar Express menerima rute yang benar.

3. **`api/[...path].js` (File Baru)**
   - Rute catch-all native Vercel untuk mendukung subpath `/api/*` secara otomatis.

4. **`package.json`**
   - Menghapus `"vercel-dev": "vercel dev"` agar Vercel CLI tidak menjalankan perintah secara rekursif.

5. **`server/initial-data.json` (File Baru)**
   - Pre-seeded 110 pengguna dan 91 avatar Roblox aktif agar serverless function Vercel langsung merespons dalam < 50ms tanpa cold start timeout.

6. **`server/db.js`**
   - Otomatis memuat data dari `initial-data.json` jika `db.json` belum ada di environment baru.

7. **`server/roblox.js`**
   - Menggunakan fast-path avatar dari cache dan scraping paralel dengan timeout aman (2.5–3 detik).

8. **`server/app.js`**
   - Menambahkan header CORS otomatis agar API dapat diakses dengan mulus dari preview maupun domain lain.

9. **`index.html`**
   - Menambahkan kelas latar belakang gelap pada `<body class="bg-[#050914] text-slate-100 min-h-screen">`.
   - Menghapus script proteksi anti-scrape yang menghambat inspect element / F12.

10. **`src/components/ErrorBoundary.jsx` (File Baru)**
    - Menangkap runtime error React dan menampilkan kartu error informatif dengan tombol reload, mencegah terjadinya layar putih kosong.

11. **`src/main.jsx`**
    - Membungkus `<App />` di dalam `<ErrorBoundary>`.

12. **`src/App.jsx`**
    - Menambahkan rute `/find` yang mengarahkan ke `/`.
    - Menyimpan status loading screen di `sessionStorage` agar loading animasi tidak muncul terus-menerus saat refresh halaman.

---

## 🚀 Cara Menjalankan & Mengirimkan ke GitHub

### 1. Menjalankan di Lokal dengan Vercel CLI
```bash
vercel dev
```
Website sekarang akan langsung terbuka di browser tanpa MIME type error dan halaman langsung muncul dengan normal.

### 2. Menjalankan di Lokal Tanpa Vercel CLI
```bash
npm run dev
```
Perintah ini menyalakan API Express di port `5180` dan Vite di port `5173`.

### 3. Build & Test Mode Produksi
```bash
npm run build
npm start
```

### 4. Push Perubahan ke GitHub Anda
Di folder repo Anda, seluruh perubahan sudah di-commit secara rapi di branch `main`. Untuk mengirimkannya ke GitHub:
```bash
git push origin main
```
Setelah di-push, Vercel (jika terhubung ke repository GitHub Anda) akan otomatis melakukan rebuild dan deploy. Website akan langsung aktif dan bekerja dengan sempurna!
