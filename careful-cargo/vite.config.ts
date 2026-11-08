import { defineConfig } from "vite";

// Relative base path so the build works from any folder (Poki hosts games in a subfolder).
export default defineConfig({
  base: "./",
  build: {
    target: "es2020",
    assetsInlineLimit: 0,
    sourcemap: false,
  },
});
