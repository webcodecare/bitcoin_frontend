import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { cartographer } from "@replit/vite-plugin-cartographer";

export default defineConfig({
  plugins: [react(), cartographer()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@assets": fileURLToPath(new URL("./src/assets", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "ui-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
          ],
          "chart-vendor": ["lightweight-charts", "recharts"],
          "motion-vendor": ["framer-motion"],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "https://swiftlead.site",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://swiftlead.site",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
