import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Avoid CORS in dev by proxying API requests through Vite
      "/api": {
        target: "https://greetings-generator-backend.onrender.com",
        changeOrigin: true,
        secure: true,
      },
      // Proxy R2 images to avoid CORS issues
      // When images are requested from /r2-proxy/*, they're proxied to the R2 bucket
      // This makes them appear as same-origin requests, avoiding CORS errors
      "/r2-proxy": {
        target: "https://pub-72ca2213966948abad1a223268ee0ac2.r2.dev",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/r2-proxy/, ""),
      },
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
