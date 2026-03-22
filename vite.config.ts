import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    // SPA routing: serve index.html for all routes in `vite preview`
    host: "::",
    port: 8080,
  },
  // Explicit cache location — easy to clear: remove node_modules/.vite
  cacheDir: "node_modules/.vite",
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable code splitting for better caching and smaller initial bundle
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-popover",
          ],
          "query-vendor": ["@tanstack/react-query"],
          "supabase-vendor": ["@supabase/supabase-js"],
          "chart-vendor": ["recharts"],
          "i18n-vendor": ["i18next", "react-i18next", "i18next-browser-languagedetector"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "utils": ["date-fns", "clsx", "tailwind-merge", "class-variance-authority"],
        },
      },
    },
    // Increase chunk size warning limit (optional, since we're now properly chunking)
    chunkSizeWarningLimit: 500,
    // Enable minification
    minify: "esbuild",
    // Enable source maps for production debugging (optional - disable for smaller builds)
    sourcemap: false,
    // Target modern browsers for smaller output
    target: "es2020",
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@tanstack/react-query",
    ],
  },
}));
