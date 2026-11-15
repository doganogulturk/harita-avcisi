import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PROVINCE_SETS, provinceMapId, provincesOf } from "@/lib/provinces-puzzle";
import { REGIONS } from "@/lib/turkish-regions";

const read = (file: string) => readFileSync(new URL(`../public/maps/provinces/${file}`, import.meta.url), "utf8");

describe("iller oyunu", () => {
  it("haritalar: bütün Türkiye önce, sonra yedi bölge", () => {
    expect(PROVINCE_SETS.map((set) => set.id)).toEqual(["all", ...REGIONS.map((region) => region.id)]);
    expect(provincesOf("all")).toHaveLength(81);
    expect(provinceMapId(6)).toBe("TUR006");
  });

  it("iller alfabetik (Türkçe sıra)", () => {
    expect(provincesOf("marmara").map((province) => province.name)).toEqual([
      "Balıkesir", "Bilecik", "Bursa", "Çanakkale", "Edirne", "İstanbul", "Kırklareli", "Kocaeli", "Sakarya", "Tekirdağ", "Yalova",
    ]);
  });

  it("her haritada oynanan illerin hepsi ad noktasıyla var; komşular kimliksiz", () => {
    for (const set of PROVINCE_SETS) {
      const map = read(`${set.id}.svg`);
      const drawn = [...map.matchAll(/<path id="(TUR\d{3})" data-lx="[\d.-]+" data-ly="[\d.-]+"/g)].map((match) => match[1]);
      expect(drawn.sort(), set.id).toEqual(provincesOf(set.id).map((province) => province.id).sort());
      expect(map.match(/<path /g)?.length, set.id).toBe(drawn.length + (map.match(/<path class="ctx"/g)?.length ?? 0));
      if (set.id === "all") expect(map, set.id).not.toContain('class="ctx"');
      else expect(map, set.id).toContain('class="ctx"');
    }
  });

  it("kart silüetleri: Türkiye ve yedi bölge", () => {
    const shapes = JSON.parse(read("regions.json")) as { viewBox: string; outline: string; regions: Record<string, string> };
    expect(shapes.outline).toMatch(/^M /);
    for (const region of REGIONS) expect(shapes.regions[region.id], region.id).toMatch(/^M /);
  });
});
