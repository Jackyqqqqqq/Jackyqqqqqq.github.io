import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { contentWriter } from "./vite-plugin-content";

export default defineConfig({
  plugins: [react(), contentWriter()],
  base: "./",
});
