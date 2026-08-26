import "dotenv/config"; // loads .env in local dev (Vercel injects env vars itself)
import express from "express";
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import pagesRoutes from "./routes/pages.js";
import analyticsRoutes from "./routes/analytics.js";
import robloxRoutes from "./routes/roblox.js";
import siteRoutes from "./routes/site.js";
import { seed } from "./seed.js";

// Builds the Express app (all routes mounted under /api). Reused by:
//   - server/index.js  → the local/long-running server
//   - api/index.js & api/[...path].js → Vercel serverless function (catch-all)
export function createApp() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  // Basic security and CORS headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");

    const origin = req.headers.origin;
    if (origin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    next();
  });

  // Bootstraps the first owner/admin account (Chaeulso by default, or via env).
  seed();

  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/pages", pagesRoutes);
  app.use("/api/analytics", analyticsRoutes);
  app.use("/api/roblox", robloxRoutes);
  app.use("/api/site", siteRoutes);

  // Central error handler so no error ever produces a blank response.
  app.use((err, _req, res, _next) => {
    console.error("[api error]", err);
    res.status(500).json({ error: "Something went wrong on our side." });
  });

  return app;
}
