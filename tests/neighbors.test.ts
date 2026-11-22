import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isSavedChoice, turkeyChoice, worldChoice } from "@/lib/game";
import { areNeighbors as neighborsInMode, neighborIds, neighborOptions, neighborSubject } from "@/lib/neighbors";
import { NEIGHBORS, NEIGHBORS_SOURCE_HASH } from "@/lib/turkish-neighbors";
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

  it("dünya için komşu yoktur (harita ülkeler arasında boşluklu); bilinmeyen kimlik boş döner", () => {
    expect(neighborIds("world", "fr")).toEqual([]);
    expect(neighborsInMode("world", "fr", "de")).toBe(false);
    expect(neighborIds("turkey", "999")).toEqual([]);
  });

  it("areNeighbors: komşuluk simetrik ve kendisiyle komşu değil", () => {
    expect(neighborsInMode("turkey", "38", "58")).toBe(true);
    expect(neighborsInMode("turkey", "58", "38")).toBe(true);
    expect(neighborsInMode("turkey", "38", "38")).toBe(false);
    expect(neighborsInMode("turkey", "34", "22")).toBe(false);
  });
});
describe("komşuluk sorusu: konu ve şıklar", () => {
  const plates = provinces.map((province) => province.plate);

  it("konu her zaman cevabın komşusudur ve aynı turda aynı soru için hep aynıdır", () => {
    for (const answer of plates) {
      for (const [roundKey, index] of [[0, 0], [3, 7], [41, 19]] as const) {
        const subject = neighborSubject(String(answer), roundKey, index);
        expect(NEIGHBORS[answer], `${answer} → ${subject}`).toContain(Number(subject));
        expect(neighborSubject(String(answer), roundKey, index)).toBe(subject);
      }
    }
  });

  it("konu, tur ve sıraya göre değişir (her soruda aynı komşu çıkmaz)", () => {
    const seen = new Set<string>();
    for (let index = 0; index < 60; index += 1) seen.add(neighborSubject("6", 2, index)); // Ankara'nın 7 komşusu var
    expect(seen.size).toBeGreaterThan(3);
  });

  it("81 ilin her biri için: dört benzersiz şık, cevap içinde, konu şık değil ve konunun komşusu yalnızca cevap", () => {
    for (const answer of plates) {
      for (const subject of NEIGHBORS[answer]) {
        for (let run = 0; run < 4; run += 1) {
          const options = neighborOptions(String(subject), String(answer));
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
      const wrong = neighborOptions(subject, String(plate("Sivas"))).filter((id) => id !== String(plate("Sivas")));
      for (const id of wrong) expect(secondRing.has(Number(id)), `yanlış şık ${id}`).toBe(true);
    }
  });

  it("kimlikler sunucunun kalıbına uyar (başında sıfır yok)", () => {
    for (const id of neighborOptions("1", "31")) expect(id).toMatch(/^([1-9]|[1-7][0-9]|8[01])$/);
    expect(neighborOptions("01", "031")).toContain("31");
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
