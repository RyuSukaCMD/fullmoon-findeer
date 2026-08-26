import { createApp } from "../server/app.js";

// Vercel serverless handler for every /api/* request.
const app = createApp();

export default function handler(req, res) {
  let path = "";

  // 1. Check if forwarded via vercel.json rewrite: ?__path__=...
  if (req.query && req.query.__path__) {
    path = req.query.__path__;
    delete req.query.__path__;
  }
  // 2. Check if forwarded via catch-all [...path].js: req.query.path
  else if (req.query && req.query.path) {
    path = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    delete req.query.path;
  }
  // 3. Check Vercel original request headers
  else if (req.headers["x-forwarded-uri"]) {
    const uri = req.headers["x-forwarded-uri"].split("?")[0];
    if (uri.startsWith("/api/")) {
      path = uri.slice(5);
    }
  } else if (req.headers["x-matched-path"]) {
    const mp = req.headers["x-matched-path"].split("?")[0];
    if (mp.startsWith("/api/")) {
      path = mp.slice(5);
    }
  }

  if (path) {
    const queryIdx = req.url.indexOf("?");
    const originalQs = queryIdx >= 0 ? req.url.slice(queryIdx) : "";
    const remainingQs = req.query && Object.keys(req.query).length > 0
      ? "?" + new URLSearchParams(req.query).toString()
      : originalQs;
    req.url = `/api/${path.replace(/^\/+/, "")}${remainingQs}`;
  } else if (!req.url.startsWith("/api")) {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }

  return app(req, res);
}
