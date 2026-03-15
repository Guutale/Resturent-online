import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = String(id).replaceAll("\\", "/");

          if (!normalizedId.includes("/node_modules/")) return undefined;
          if (normalizedId.includes("/react-router-dom/")) return "router-vendor";
          if (
            normalizedId.includes("/react/")
            || normalizedId.includes("/react-dom/")
            || normalizedId.includes("/scheduler/")
          ) {
            return "react-vendor";
          }

          return "vendor";
        },
      },
    },
  },
});
