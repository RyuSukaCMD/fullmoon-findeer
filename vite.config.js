import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    proxy: {
      // Forward API calls to the Express backend so everything stays on one
      // origin (no CORS, no cross-origin cookies).
      "/api": {
        target: "http://127.0.0.1:5180",
        changeOrigin: true,
      },
    },
  },
});
