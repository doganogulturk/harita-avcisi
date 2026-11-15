import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DISTRICTS } from "@/lib/districts-data";
import { difficultyOf, DISTRICT_PROVINCES, districtsOf } from "@/lib/districts";
import { mapPuzzleScore } from "@/lib/map-puzzle";
import { REGIONS, regionOf } from "@/lib/turkish-regions";
import { provinces } from "@/lib/turkish-plates";

const mapOf = (plate: number) => readFileSync(new URL(`../public/maps/districts/${plate}.svg`, import.meta.url), "utf8");

describe("ilçe verisi", () => {
  it("81 ilin hepsi var ve toplam 973 ilçe", () => {
    expect(Object.keys(DISTRICTS)).toHaveLength(81);
    for (const province of provinces) expect(DISTRICTS[province.plate]?.length, province.city).toBeGreaterThan(0);
    expect(Object.values(DISTRICTS).flat()).toHaveLength(973);
    expect(DISTRICT_PROVINCES).toHaveLength(81);
  });

  it("ilçe kodu ilin plakasıyla başlar ve tekrarsız", () => {
    const ids = Object.values(DISTRICTS).flat().map(([id]) => id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [plate, districts] of Object.entries(DISTRICTS)) {
      for (const [id] of districts) expect(id.slice(0, 6), id).toBe(`TUR${String(plate).padStart(3, "0")}`);
    }
  });

  it("adlar düzgün Türkçe: kaynaktan kalma fazladan nokta yok, bir ilde aynı ad iki kez yok", () => {
    for (const districts of Object.values(DISTRICTS)) {
      const names = districts.map(([, name]) => name);
      for (const name of names) expect(name, name).not.toMatch(/̇|^\s|\s$/);
      expect(new Set(names).size).toBe(names.length);
    }
    expect(districtsOf(6).map((district) => district.name)).toEqual(expect.arrayContaining(["Altındağ", "Kızılcahamam", "Şereflikoçhisar"]));
  });

  it("her ilin haritasında bütün ilçeleri ve ad noktaları var", () => {
    for (const [plate, districts] of Object.entries(DISTRICTS)) {
      const map = mapOf(Number(plate));
      const drawn = [...map.matchAll(/<path id="(TUR\d{6})" data-lx="[\d.-]+" data-ly="[\d.-]+"/g)].map((match) => match[1]);
      expect(drawn.sort(), `plaka ${plate}`).toEqual(districts.map(([id]) => id).sort());
    }
  });

  it("ilçeler alfabetik (Türkçe sıra) gelir; puan hatayla düşer", () => {
    expect(districtsOf(6).slice(-3).map((district) => district.name)).toEqual(["Sincan", "Şereflikoçhisar", "Yenimahalle"]);
    expect(mapPuzzleScore(25, 0)).toBe(25);
    expect(mapPuzzleScore(3, 7)).toBe(0);
  });

  it("yedi bölge 81 ili birer kez kapsar", () => {
    const plates = REGIONS.flatMap((region) => region.plates);
    expect(REGIONS).toHaveLength(7);
    expect(new Set(plates).size).toBe(81);
    expect([...plates].sort((a, b) => a - b)).toEqual(provinces.map((province) => province.plate).sort((a, b) => a - b));
    expect(regionOf(6)).toBe("icAnadolu");
    expect(regionOf(34)).toBe("marmara");
    expect(regionOf(61)).toBe("karadeniz");
  });

  it("zorluk ilçe sayısından; her ilin silüeti var", () => {
    expect([difficultyOf(3), difficultyOf(8), difficultyOf(9), difficultyOf(14), difficultyOf(15)]).toEqual(["easy", "easy", "medium", "medium", "hard"]);
    const shapes = JSON.parse(readFileSync(new URL("../public/maps/districts/provinces.json", import.meta.url), "utf8")) as Record<string, [string, string]>;
    for (const province of provinces) expect(shapes[province.plate]?.[1], province.city).toMatch(/^M /);
  });
});
