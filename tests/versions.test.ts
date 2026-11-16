import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CURRENT_VERSION, VERSIONS } from "@/lib/versions";

const packageVersion = (JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as { version: string }).version;

describe("sürüm geçmişi", () => {
  it("en üstteki sürüm package.json'daki sürüm", () => {
    expect(CURRENT_VERSION).toBe(packageVersion);
  });

  it("sürümler tekrarsız ve yeniden eskiye sıralı; her birinin iki dilde aynı sayıda maddesi var", () => {
    const parts = VERSIONS.map((entry) => entry.version.split(".").map(Number));
    for (let index = 1; index < parts.length; index++) {
      const [a, b] = [parts[index - 1], parts[index]];
      const newer = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
      expect(newer, VERSIONS[index].version).toBeGreaterThan(0);
    }
    for (const entry of VERSIONS) {
      expect(entry.notes.tr.length, entry.version).toBeGreaterThan(0);
      expect(entry.notes.en.length, entry.version).toBe(entry.notes.tr.length);
    }
  });
});
