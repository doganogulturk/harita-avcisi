import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Birim testleri (tests/): oyunun saf mantığı ve veri bütünlüğü. Tarayıcı ya da Supabase gerekmez.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
});
