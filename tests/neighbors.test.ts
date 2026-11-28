import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isSavedChoice, turkeyChoice, worldChoice } from "@/lib/game";
import { areNeighbors as neighborsInMode, neighborAsk, neighborIds, neighborOptions, type NeighborAsk } from "@/lib/neighbors";
import { type GameMode } from "@/lib/game";
import { neighborPool, neighborUniverse } from "@/lib/neighbors";
import { NEIGHBORS, NEIGHBORS_SOURCE_HASH } from "@/lib/turkish-neighbors";
import { capitalOf } from "@/lib/world-capitals";
import { countries, countriesIn } from "@/lib/world-countries";
import { WORLD_NEIGHBORS, WORLD_NEIGHBORS_SOURCE_HASH } from "@/lib/world-neighbors";
import { provinces } from "@/lib/turkish-plates";

const plate = (city: string) => provinces.find((province) => province.city === city)!.plate;
const areNeighbors = (a: string, b: string) => NEIGHBORS[plate(a)].includes(plate(b));

describe("il komşuluk tablosu", () => {
  it("81 ilin hepsi var, hiçbir il kendisinin komşusu değil, hepsinin en az bir komşusu var", () => {
    expect(Object.keys(NEIGHBORS).map(Number).sort((a, b) => a - b)).toEqual(provinces.map((province) => province.plate).sort((a, b) => a - b));
    for (const [key, list] of Object.entries(NEIGHBORS)) {
      expect(list.length, `plaka ${key}`).toBeGreaterThan(0);
      expect(list, `plaka ${key}`).not.toContain(Number(key));
      expect(new Set(list).size, `plaka ${key} tekrar`).toBe(list.length);
    }
  });

  it("simetrik: A, B'nin komşusuysa B de A'nın komşusu", () => {
    for (const [key, list] of Object.entries(NEIGHBORS)) {
      for (const other of list) expect(NEIGHBORS[other], `${key} → ${other}`).toContain(Number(key));
    }
  });

  it("tablo, üretildiği il haritasıyla güncel (harita değişirse scripts/build-neighbors.mjs yeniden çalıştırılır)", () => {
    const svg = readFileSync(new URL("../public/maps/provinces/all.svg", import.meta.url), "utf8");
    expect(createHash("sha256").update(svg).digest("hex").slice(0, 16)).toBe(NEIGHBORS_SOURCE_HASH);
  });

  /**
   * Bağımsız doğrulama (2026-11): haritadan çıkan 199 çift, Wikidata'nın "ortak sınır" ilişkisiyle karşılaştırıldı; 197'si
   * uyuştu. Ayrışan üç çift OpenStreetMap il sınırlarındaki ortak sınır çizgisiyle çözüldü: harita üçünde de doğru çıktı.
   * Aşağıdakiler bu doğrulanmış çiftlerdir; harita yeniden üretilirse bozulmaları bir hataya işaret eder.
   */
  it("doğrulanmış komşu çiftler", () => {
    const neighbors: [string, string][] = [
      ["Ankara", "Eskişehir"], ["İstanbul", "Kocaeli"], ["İstanbul", "Tekirdağ"], ["Kayseri", "Sivas"], ["Van", "Ağrı"],
      ["Adana", "Mersin"], ["İzmir", "Manisa"], ["Denizli", "Aydın"], ["Diyarbakır", "Malatya"], ["Bursa", "Kütahya"],
      ["Elazığ", "Erzincan"], ["Erzincan", "Malatya"], ["Nevşehir", "Yozgat"], ["Diyarbakır", "Muş"],
      // Harita ile OpenStreetMap uyuştu, Wikidata'da eksik:
      ["İstanbul", "Kırklareli"], ["Bilecik", "Kocaeli"],
    ];
    for (const [a, b] of neighbors) expect(areNeighbors(a, b), `${a} – ${b}`).toBe(true);
  });

  it("doğrulanmış komşu olmayan çiftler", () => {
    const strangers: [string, string][] = [
      ["İstanbul", "Edirne"], ["Antalya", "İstanbul"], ["Balıkesir", "Bilecik"], ["Giresun", "Bayburt"], ["Kayseri", "Malatya"],
      ["Kayseri", "Osmaniye"], ["Muş", "Van"], ["Sivas", "Tunceli"], ["Ankara", "Yozgat"], ["Bingöl", "Batman"],
      // Harita ile OpenStreetMap uyuştu (ortak sınır çizgisi yok), Wikidata komşu diyor:
      ["Bursa", "Sakarya"],
    ];
    for (const [a, b] of strangers) expect(areNeighbors(a, b), `${a} – ${b}`).toBe(false);
  });

  it("kara sınırı az olan iller", () => {
    expect(NEIGHBORS[plate("Kilis")]).toEqual([plate("Gaziantep")]);
    expect([...NEIGHBORS[plate("Yalova")]].sort((a, b) => a - b)).toEqual([plate("Bursa"), plate("Kocaeli")].sort((a, b) => a - b));
    expect([...NEIGHBORS[plate("Iğdır")]].sort((a, b) => a - b)).toEqual([plate("Ağrı"), plate("Kars")].sort((a, b) => a - b));
    expect([...NEIGHBORS[plate("Hakkâri")]].sort((a, b) => a - b)).toEqual([plate("Van"), plate("Şırnak")].sort((a, b) => a - b));
  });
});

describe("lib/neighbors: oyundaki kullanım", () => {
  it("Türkiye'de komşuları plaka kimliği (başında sıfır yok) olarak verir", () => {
    expect([...neighborIds("turkey", "38")].sort()).toEqual([...NEIGHBORS[38]].map(String).sort());
    expect(neighborIds("turkey", "6")).toContain("26");
    // Haritadaki "06" biçimi de aynı ilin komşularını verir
    expect(neighborIds("turkey", "06")).toEqual(neighborIds("turkey", "6"));
  });

  it("dünyada ISO koduyla komşuları verir; ada ülkelerinin ve bilinmeyen kimliğin listesi boştur", () => {
    expect(neighborIds("world", "fr")).toContain("de");
    expect(neighborsInMode("world", "fr", "de")).toBe(true);
    expect(neighborIds("world", "jp")).toEqual([]);
    expect(neighborIds("world", "zz")).toEqual([]);
    expect(neighborIds("turkey", "999")).toEqual([]);
  });

  it("areNeighbors: komşuluk simetrik ve kendisiyle komşu değil", () => {
    expect(neighborsInMode("turkey", "38", "58")).toBe(true);
    expect(neighborsInMode("turkey", "58", "38")).toBe(true);
    expect(neighborsInMode("turkey", "38", "38")).toBe(false);
    expect(neighborsInMode("turkey", "34", "22")).toBe(false);
  });
});
/**
 * Bir komşuluk sorusunun kuralları: dört benzersiz şık, cevap içinde, konu şık değil. Olumlu soruda konu cevabın komşusudur ve şıklardan
 * yalnızca cevap konuyla komşudur; olumsuz soruda cevap konuyla komşu değildir ve öbür üç şıkkın hepsi konunun komşusudur.
 */
function checkAsk(mode: GameMode, answer: string, ask: NeighborAsk, options: string[]) {
  const label = `${ask.isNegative ? "olumsuz" : "olumlu"}: konu ${ask.subject}, cevap ${answer}`;
  const borders = (id: string) => neighborsInMode(mode, ask.subject, id);
  expect(options, label).toHaveLength(4);
  expect(new Set(options).size, label).toBe(4);
  expect(options, label).toContain(answer);
  expect(options, label).not.toContain(ask.subject);
  if (ask.isNegative) {
    expect(borders(answer), label).toBe(false);
    expect(options.filter((id) => !borders(id)), label).toEqual([answer]);
  } else {
    expect(borders(answer), label).toBe(true);
    expect(options.filter(borders), label).toEqual([answer]);
  }
}

describe("komşuluk sorusu: konu ve şıklar", () => {
  const plates = provinces.map((province) => province.plate);

  it("81 ilin her biri, olumlu ve olumsuz sorularda: konu kurala uyar, şıklarda soruya yalnızca cevap uyar, aynı soru hep aynıdır", () => {
    for (const answer of plates) {
      for (let index = 0; index < 12; index += 1) {
        const ask = neighborAsk("turkey", String(answer), 5, index);
        expect(neighborAsk("turkey", String(answer), 5, index)).toEqual(ask);
        for (let run = 0; run < 2; run += 1) checkAsk("turkey", String(answer), ask, neighborOptions("turkey", ask.subject, String(answer), undefined, ask.isNegative));
      }
    }
  });

  it("konu, tur ve sıraya göre değişir (her soruda aynı komşu çıkmaz)", () => {
    const seen = new Set<string>();
    for (let index = 0; index < 60; index += 1) seen.add(neighborAsk("turkey", "6", 2, index).subject);
    expect(seen.size).toBeGreaterThan(3);
  });

  it("soruların yaklaşık üçte biri olumsuzdur; bir tur hem olumlu hem olumsuz soru içerir", () => {
    let negatives = 0;
    let total = 0;
    for (const answer of plates) {
      for (let roundKey = 0; roundKey < 20; roundKey += 1) {
        for (let index = 0; index < 10; index += 1) {
          total += 1;
          if (neighborAsk("turkey", String(answer), roundKey, index).isNegative) negatives += 1;
        }
      }
    }
    expect(negatives / total).toBeGreaterThan(0.25);
    expect(negatives / total).toBeLessThan(0.4);
  });

  it("olumsuz soruda cevap konuya yakındır: ortak bir komşuları vardır", () => {
    for (const answer of plates) {
      for (let index = 0; index < 30; index += 1) {
        const ask = neighborAsk("turkey", String(answer), 3, index);
        if (!ask.isNegative) continue;
        const shared = NEIGHBORS[answer].filter((id) => NEIGHBORS[Number(ask.subject)].includes(id));
        expect(shared.length, `konu ${ask.subject}, cevap ${answer}`).toBeGreaterThan(0);
      }
    }
  });

  it("81 ilin her biri için: dört benzersiz şık, cevap içinde, konu şık değil ve konunun komşusu yalnızca cevap", () => {
    for (const answer of plates) {
      for (const subject of NEIGHBORS[answer]) {
        for (let run = 0; run < 4; run += 1) {
          const options = neighborOptions("turkey", String(subject), String(answer));
          const label = `konu ${subject}, cevap ${answer}`;
          expect(options, label).toHaveLength(4);
          expect(new Set(options).size, label).toBe(4);
          expect(options, label).toContain(String(answer));
          expect(options, label).not.toContain(String(subject));
          const neighborsAmongOptions = options.filter((id) => NEIGHBORS[subject].includes(Number(id)));
          expect(neighborsAmongOptions, label).toEqual([String(answer)]);
        }
      }
    }
  });

  it("yanlış şıklar önce konunun komşularının komşularından gelir", () => {
    // Kayseri'nin komşularının komşuları (ikinci halka); konuyla komşu olmayan yanlış şıklar önce buradan seçilir.
    const subject = String(plate("Kayseri"));
    const direct = new Set(NEIGHBORS[Number(subject)]);
    const secondRing = new Set<number>();
    for (const neighbor of direct) for (const other of NEIGHBORS[neighbor]) if (other !== Number(subject) && !direct.has(other)) secondRing.add(other);
    for (let run = 0; run < 30; run += 1) {
      const wrong = neighborOptions("turkey", subject, String(plate("Sivas"))).filter((id) => id !== String(plate("Sivas")));
      for (const id of wrong) expect(secondRing.has(Number(id)), `yanlış şık ${id}`).toBe(true);
    }
  });

  it("kimlikler sunucunun kalıbına uyar (başında sıfır yok)", () => {
    for (const id of neighborOptions("turkey", "1", "31")) expect(id).toMatch(/^([1-9]|[1-7][0-9]|8[01])$/);
    expect(neighborOptions("turkey", "01", "031")).toContain("31");
  });
});
describe("ülke komşuluk tablosu", () => {
  const borders = (a: string, b: string) => WORLD_NEIGHBORS[a].includes(b);

  it("179 ülkenin hepsi var, simetrik, tekrar ve kendisiyle komşuluk yok", () => {
    expect(Object.keys(WORLD_NEIGHBORS).sort()).toEqual(countries.map((country) => country.code).sort());
    for (const [code, list] of Object.entries(WORLD_NEIGHBORS)) {
      expect(list, code).not.toContain(code);
      expect(new Set(list).size, `${code} tekrar`).toBe(list.length);
      for (const other of list) expect(WORLD_NEIGHBORS[other], `${code} → ${other}`).toContain(code);
    }
  });

  it("tablo, üretildiği dünya haritasıyla güncel (harita değişirse scripts/build-world-neighbors.mjs yeniden çalıştırılır)", () => {
    const svg = readFileSync(new URL("../public/maps/world.svg", import.meta.url), "utf8");
    expect(createHash("sha256").update(svg).digest("hex").slice(0, 16)).toBe(WORLD_NEIGHBORS_SOURCE_HASH);
  });

  /**
   * Bağımsız doğrulama (2026-11): haritadan çıkan çiftler Wikidata'nın "ortak sınır" ilişkisiyle karşılaştırıldı ve tam liste
   * elle gözden geçirildi (docs/GELISTIRME.md, "Komşuluk (dünya)"). Elle düzeltilen çiftler burada kalıcı olarak denetlenir.
   */
  it("komşu sayıları bilinen ülkeler", () => {
    expect([...WORLD_NEIGHBORS.tr]).toEqual(["am", "az", "bg", "ge", "gr", "iq", "ir", "sy"]);
    expect(WORLD_NEIGHBORS.ru).toHaveLength(14);
    expect(WORLD_NEIGHBORS.cn).toHaveLength(14);
    expect([...WORLD_NEIGHBORS.de]).toEqual(["at", "be", "ch", "cz", "dk", "fr", "lu", "nl", "pl"]);
  });

  it("elle eklenen kara sınırları: Vahan, Nahçıvan, Cibuti–Somali", () => {
    for (const [a, b] of [["af", "cn"], ["az", "tr"], ["dj", "so"]]) expect(borders(a, b), `${a} – ${b}`).toBe(true);
  });

  it("deniz karşısı, denizaşırı toprak ve haritada ayrı çizilmeyen bölgeler komşu sayılmaz", () => {
    const strangers = [
      ["dk", "se"], ["dj", "ye"], ["er", "ye"], ["eg", "jo"], ["eg", "sa"], ["my", "sg"], ["ae", "qa"], ["pk", "tj"],
      ["fr", "br"], ["fr", "sr"], ["ma", "mr"], ["al", "rs"], ["es", "ma"], ["gb", "fr"], ["it", "tn"],
    ];
    for (const [a, b] of strangers) expect(borders(a, b), `${a} – ${b}`).toBe(false);
  });

  it("ada ülkelerinin kara komşusu yoktur; Haiti–Dominik, İrlanda–Birleşik Krallık, Endonezya–Papua Yeni Gine vardır", () => {
    for (const code of ["jp", "au", "nz", "is", "lk", "mg", "cu", "ph", "tw", "sg"]) expect(WORLD_NEIGHBORS[code], code).toEqual([]);
    for (const [a, b] of [["do", "ht"], ["gb", "ie"], ["id", "pg"], ["bn", "my"]]) expect(borders(a, b), `${a} – ${b}`).toBe(true);
  });
});

describe("komşuluk sorusu: dünya", () => {
  it("havuzdan kara komşusu olmayan ülkeler çıkar; kıta havuzunda komşu kıta içinden olmalı", () => {
    const all = neighborPool("world", countries).map((country) => country.code);
    expect(all).toContain("fr");
    expect(all).not.toContain("jp");
    expect(all.length).toBe(Object.values(WORLD_NEIGHBORS).filter((list) => list.length > 0).length);
    // Avrupa'da Kıbrıs adadır; Türkiye ise Avrupa'da da sorulur ve komşuları Avrupa'dadır
    const europe = neighborPool("world", countriesIn("europe")).map((country) => country.code);
    expect(europe).not.toContain("cy");
    expect(europe).toContain("tr");
  });

  it("konu evrenin içinden seçilir; şıklarda yalnızca cevap konunun komşusudur", () => {
    for (const scope of ["all", "europe", "africa", "asia", "america"] as const) {
      const pool = scope === "all" ? countries : countriesIn(scope);
      const universe = neighborUniverse("world", pool);
      for (const country of neighborPool("world", pool)) {
        for (const index of [0, 1, 2, 3, 4, 5]) {
          const ask = neighborAsk("world", country.code, 7, index, universe);
          const options = neighborOptions("world", ask.subject, country.code, universe, ask.isNegative);
          expect(universe.has(ask.subject), `${scope}: konu ${ask.subject}`).toBe(true);
          for (const id of options) expect(universe.has(id), `${scope}: şık ${id}`).toBe(true);
          checkAsk("world", country.code, ask, options);
        }
      }
    }
  });

  it("başkent turunda şıkların hepsinin başkenti vardır", () => {
    const pool = countries.filter((country) => capitalOf(country.code));
    const universe = neighborUniverse("world", pool);
    for (const country of neighborPool("world", pool)) {
      for (const index of [0, 1, 2]) {
        const ask = neighborAsk("world", country.code, 1, index, universe);
        for (const id of neighborOptions("world", ask.subject, country.code, universe, ask.isNegative)) expect(capitalOf(id), id).toBeTruthy();
      }
    }
  });
});

describe("hangi turlar kaydedilir", () => {
  it("Oyna ve günlük kaydedilir; antrenman ve komşuluk turu (Oyna'da bile) kaydedilmez", () => {
    expect(isSavedChoice(turkeyChoice("ranked", "name"))).toBe(true);
    expect(isSavedChoice(worldChoice("ranked", "all", "flag"))).toBe(true);
    expect(isSavedChoice({ ...turkeyChoice("ranked", "name"), daily: true })).toBe(true);
    // Şıklı Oyna turu kaydedilir (cevap bir yerin adını bulmaktır)
    expect(isSavedChoice({ ...turkeyChoice("ranked", "name"), choices: true })).toBe(true);
    // Komşuluk turu Oyna'da da kaydedilmez
    expect(isSavedChoice({ ...turkeyChoice("ranked", "name"), choices: true, neighbors: true })).toBe(false);
    expect(isSavedChoice(turkeyChoice("practice", "name"))).toBe(false);
    expect(isSavedChoice({ ...turkeyChoice("practice", "name"), choices: true, neighbors: true })).toBe(false);
  });
});
