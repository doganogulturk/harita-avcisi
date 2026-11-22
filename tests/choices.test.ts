import { describe, expect, it } from "vitest";
import { CHOICE_COUNT, choiceOptions } from "@/lib/choices";
import { correctLocationId, type PlayChoice, type Question } from "@/lib/game";
import { provinces } from "@/lib/turkish-plates";
import { regionOf } from "@/lib/turkish-regions";
import { countries, continentLocationIds } from "@/lib/world-countries";

const turkey: PlayChoice = { kind: "practice", mode: "turkey", difficulty: "normal" };
const world: PlayChoice = { kind: "practice", mode: "world", difficulty: "hard" };
const question = (pool: readonly Question[], id: string): Question => pool.find((item) => correctLocationId(item) === id)!;

describe("şıklı soru: şık üretimi", () => {
  it("dört benzersiz şık, doğru cevap içinde", () => {
    for (let run = 0; run < 50; run += 1) {
      const options = choiceOptions(turkey, question(provinces, "38"), provinces);
      expect(options).toHaveLength(CHOICE_COUNT);
      expect(new Set(options).size).toBe(CHOICE_COUNT);
      expect(options).toContain("38");
    }
  });

  it("Türkiye: yanlış şıklar önce aynı bölgeden gelir", () => {
    const region = regionOf(38);
    for (let run = 0; run < 50; run += 1) {
      const wrong = choiceOptions(turkey, question(provinces, "38"), provinces).filter((id) => id !== "38");
      expect(wrong.every((id) => regionOf(Number(id)) === region)).toBe(true);
    }
  });

  it("dünya: yanlış şıklar önce aynı kıtadan gelir", () => {
    const europe = continentLocationIds("europe");
    for (let run = 0; run < 50; run += 1) {
      const wrong = choiceOptions(world, question(countries, "fr"), countries).filter((id) => id !== "fr");
      expect(wrong.every((id) => europe.has(id))).toBe(true);
    }
  });

  it("aynı gruptan yeterli yer yoksa havuzun geri kalanından tamamlanır", () => {
    // Havuzda yalnızca iki Avrupa ülkesi var; üç yanlışın biri başka kıtadan gelmek zorunda.
    const pool = ["fr", "de", "jp", "br", "eg"].map((code) => question(countries, code));
    const options = choiceOptions(world, question(countries, "fr"), pool);
    expect(options).toHaveLength(CHOICE_COUNT);
    expect(options).toContain("fr");
    expect(options).toContain("de");
  });

  it("havuz dörtten küçükse elindeki kadar şık verir, doğru cevabı kaybetmez", () => {
    const pool = ["fr", "de"].map((code) => question(countries, code));
    const options = choiceOptions(world, question(countries, "fr"), pool);
    expect(options.sort()).toEqual(["de", "fr"]);
  });

  it("doğru cevap her konumda çıkar (şıklar karışık)", () => {
    const seen = new Set<number>();
    for (let run = 0; run < 200; run += 1) seen.add(choiceOptions(turkey, question(provinces, "38"), provinces).indexOf("38"));
    expect([...seen].sort()).toEqual([0, 1, 2, 3]);
  });

  it("kimlikler sunucunun kalıbına uyar: Türkiye 1-81 plaka, dünya iki harf", () => {
    for (const province of provinces) {
      for (const id of choiceOptions(turkey, province, provinces)) expect(id).toMatch(/^([1-9]|[1-7][0-9]|8[01])$/);
    }
    for (const country of countries.slice(0, 40)) {
      for (const id of choiceOptions(world, country, countries)) expect(id).toMatch(/^[a-z]{2}$/);
    }
  });
});
