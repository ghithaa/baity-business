import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// The API is the Baity backend. In development Vite proxies /api to it, so the
// site and the API share an origin exactly as they will behind the production
// reverse proxy.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.VITE_PORT || "5174");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:3001";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { "@": path.resolve(import.meta.dirname, "src") },
      dedupe: ["react", "react-dom"],
    },
    build: {
      outDir: path.resolve(import.meta.dirname, "dist"),
      emptyOutDir: true,
    },
    server: {
      port,
      host: "0.0.0.0",
      proxy: {
        "/api": { target: apiProxyTarget, changeOrigin: true, secure: false },
      },
    },
    preview: { port, host: "0.0.0.0" },
  };
});
