/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { siteContent } from "./src/content";
import { assertValidContent } from "./src/content.validation";

assertValidContent(siteContent);

export default defineConfig({
  plugins: [react()],
  base: "/",
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.ts"
  }
});
