import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BADGE_GROUPS, BADGES } from "@/lib/badges";
import { provinces } from "@/lib/turkish-plates";
import { CAPITALS } from "@/lib/world-capitals";
import { CONTINENTS, countries, countriesIn, scopeLocationIds } from "@/lib/world-countries";

const worldMap = readFileSync(new URL("../public/maps/world.svg", import.meta.url), "utf8");
const turkeyMap = readFileSync(new URL("../public/maps/turkey.svg", import.meta.url), "utf8");
const worldIds = new Set([...worldMap.matchAll(/\sid="([a-z]{2})"/g)].map((match) => match[1]));
const turkeyPlates = new Set([...turkeyMap.matchAll(/data-plakakodu="(\d+)"/g)].map((match) => Number(match[1])));

describe("dünya verisi", () => {
  it("179 ülke, her biri haritada var ve kodlar tekrarsız", () => {
    expect(countries).toHaveLength(179);
    expect(new Set(countries.map((country) => country.code)).size).toBe(179);
    for (const country of countries) expect(worldIds, country.code).toContain(country.code);
  });

  it("kıtaların ülkeleri listede var; iki kıtalı ülkeler ikisinde de", () => {
    for (const continent of CONTINENTS) expect(countriesIn(continent.id).length).toBeGreaterThan(0);
    expect(countriesIn("europe").map((country) => country.code)).toContain("tr");
    expect(countriesIn("asia").map((country) => country.code)).toContain("tr");
    expect(scopeLocationIds("all").size).toBe(179);
  });
});

describe("başkentler", () => {
  it("her başkent listedeki bir ülkenin; çıkarılanlar dışında hepsinin başkenti var", () => {
    const codes = new Set(countries.map((country) => country.code));
    for (const code of Object.keys(CAPITALS)) expect(codes, code).toContain(code);
    const missing = countries.filter((country) => !CAPITALS[country.code]).map((country) => country.code).sort();
    expect(missing).toEqual(["fk", "gl", "il", "nc", "pr"]);
    expect(new Set(Object.values(CAPITALS)).size).toBe(Object.keys(CAPITALS).length);
  });
});

describe("Türkiye verisi", () => {
  it("81 il, plakalar 1-81 ve hepsi haritada", () => {
    expect(provinces).toHaveLength(81);
    expect(provinces.map((province) => province.plate).sort((a, b) => a - b)).toEqual(Array.from({ length: 81 }, (_, index) => index + 1));
    for (const province of provinces) expect(turkeyPlates, province.city).toContain(province.plate);
  });
});

describe("rozetler", () => {
  it("rozet kimlikleri tekrarsız, her rozetin grubu var", () => {
    expect(new Set(BADGES.map((badge) => badge.id)).size).toBe(BADGES.length);
    const groups = new Set<string>(BADGE_GROUPS.map((group) => group.id));
    for (const badge of BADGES) expect(groups, badge.id).toContain(badge.group);
  });
});
