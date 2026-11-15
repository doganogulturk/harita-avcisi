import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COUNTRY_SETS, countriesOf, countryMapMarkup, labelPoint, ringsOf } from "@/lib/countries-puzzle";

const world = readFileSync(new URL("../public/maps/world.svg", import.meta.url), "utf8");

describe("ülkeler oyunu", () => {
  it("haritalar: bütün dünya önce, sonra dört kıta; iki kıtalı ülkeler ikisinde de", () => {
    expect(COUNTRY_SETS.map((set) => set.id)).toEqual(["all", "europe", "asia", "africa", "america"]);
    expect(countriesOf("all")).toHaveLength(179);
    for (const code of ["tr", "ru", "cy"]) {
      expect(countriesOf("europe").map((country) => country.id)).toContain(code);
      expect(countriesOf("asia").map((country) => country.id)).toContain(code);
    }
  });

  it("ülkeler arayüz dilinde alfabetik", () => {
    const names = countriesOf("europe").map((country) => country.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "tr")));
    expect(names.slice(0, 2)).toEqual(["Almanya", "Arnavutluk"]);
  });

  it("her haritada oynanan ülkelerin hepsi tek parça ve ad noktasıyla; diğerleri kimliksiz", () => {
    for (const set of COUNTRY_SETS) {
      const map = countryMapMarkup(world, set.id);
      const drawn = [...map.matchAll(/<path id="([a-z]{2})" data-lx="[\d.-]+" data-ly="[\d.-]+" d="/g)].map((match) => match[1]);
      expect(drawn.sort(), set.id).toEqual(countriesOf(set.id).map((country) => country.id).sort());
      expect(map.match(/<path /g)?.length, set.id).toBe(drawn.length + (map.match(/<path class="ctx"/g)?.length ?? 0));
      expect(map, set.id).not.toContain("<g");
    }
  });

  it("kıta haritası kıtanın çerçevesinde; çerçevenin çok dışındaki ülkeler atılır", () => {
    const europe = countryMapMarkup(world, "europe");
    expect(europe).toContain('viewBox="355 322 165 123"');
    expect(europe).not.toMatch(/<path class="ctx" d="[^"]*"\/>[\s\S]*id="au"/);
    expect(europe.length).toBeLessThan(world.length / 2);
  });

  it("ad noktası ülkenin içinde: hilal biçimli halkada da", () => {
    const crescent = ringsOf("M0 0h10v2H2v6h8v2H0z");
    const [x, y] = labelPoint(crescent);
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThanOrEqual(2);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThan(10);
  });

  it("göreli komutlar ve alt yollar doğru çözülür", () => {
    const rings = ringsOf("M10 10l5 0 0 5-5 0zm20 0h5v5h-5z");
    expect(rings).toHaveLength(2);
    expect(rings[1][0]).toEqual([30, 10]);
    expect(rings[1][2]).toEqual([35, 15]);
  });
});
