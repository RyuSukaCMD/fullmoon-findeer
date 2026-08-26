import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { createApp } from "./app.js";
import { flush } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5180;
const app = createApp();

// In production (npm run build && npm start) also serve the built frontend and
// fall back to index.html for the client-side routes.
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir)); // eslint-disable-line
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err)
      res
        .status(200)
        .send("Full Moon Finder server is running. Build the frontend with `npm run build`.");
  });
});

app.listen(PORT, "0.0.0.0", () => {
  flush();
  console.log(`\n🌕 Full Moon Finder API running on http://localhost:${PORT}`);
  console.log(`   Default owner/admin → username: ${process.env.ADMIN_USERNAME || "Chaeulso"}`);
});
