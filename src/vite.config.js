import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  build: {
    outDir: "../",
    minify: true,
    cssMinify: true,
  },
  server: {
    port: 4321,
  },
  preview: {
    port: 4321,
  },
});
