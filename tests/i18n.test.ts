import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { BADGE_GROUPS, BADGES } from "@/lib/badges";
import { duelModeLabel, locationLabel } from "@/lib/duel";
import { BOARDS, choiceLabel, locationName, worldChoice } from "@/lib/game";
import { applyLocale } from "@/lib/i18n";
import { en } from "@/lib/i18n/en";
import { CAPITALS_EN, COUNTRY_NAMES_EN } from "@/lib/i18n/places-en";
import { serverMessage } from "@/lib/i18n/server-messages";
import { tr } from "@/lib/i18n/tr";
import { CAPITALS, capitalOf } from "@/lib/world-capitals";
import { countries } from "@/lib/world-countries";

/** Sözlüğün yaprak anahtarları ("game.finish" gibi); iki dilde aynı olmalı. */
function keysOf(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === "object" && !Array.isArray(child) ? keysOf(child, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

afterEach(() => applyLocale("tr"));

describe("sözlükler", () => {
  it("Türkçe ve İngilizce sözlük aynı anahtarlara sahip", () => {
    expect(keysOf(en).sort()).toEqual(keysOf(tr).sort());
  });

  it("her ülkenin ve başkentin İngilizce adı var", () => {
    for (const country of countries) expect(COUNTRY_NAMES_EN[country.code], country.code).toBeTruthy();
    expect(Object.keys(CAPITALS_EN).sort()).toEqual(Object.keys(CAPITALS).sort());
  });
});

describe("dil değişimi", () => {
  it("yer, başkent ve sıralama adları arayüz dilini izler", () => {
    expect(locationName("world", "de")).toBe("Almanya");
    expect(capitalOf("cn")).toBe("Pekin");
    applyLocale("en");
    expect(locationName("world", "de")).toBe("Germany");
    expect(capitalOf("cn")).toBe("Beijing");
    expect(capitalOf("il")).toBeUndefined();
    // İl adları özel isimdir, çevrilmez.
    expect(locationName("turkey", "34")).toBe("İstanbul");
    expect(BOARDS.map((board) => board.label)).toEqual(["Türkiye", "Plates", "World", "Flags", "Capitals"]);
  });

  it("tur ve düello etiketleri İngilizce", () => {
    applyLocale("en");
    expect(choiceLabel(worldChoice("practice", "asia", "capital"))).toBe("Practice · Asia · Capitals");
    expect(choiceLabel({ ...worldChoice("ranked", "all", "flag"), daily: true })).toBe("Daily challenge · Flags");
    expect(duelModeLabel("world", "capitals")).toBe("World · Capitals");
    expect(locationLabel("world", "capitals", "au")).toBe("Canberra · Australia");
  });

  it("rozetler ve paylaşım metni İngilizce", () => {
    applyLocale("en");
    expect(BADGES.find((badge) => badge.id === "perfect_capitals")?.title).toBe("10/10 in Capitals");
    expect(BADGE_GROUPS[0].title).toBe("Day streak");
    expect(en.result.shareRanked("World", 9, 10, "00:48", 3)).toBe(
      "I scored 9/10 in the World race on Harita Avcısı in 00:48. I'm #3 on the leaderboard. Can you beat it?",
    );
  });
});

describe("sunucu mesajları", () => {
  const schema = readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
  // raise exception mesajları ve oda katılım notları; "%" yerine örnek bir değer konur.
  const serverTexts = [
    ...[...schema.matchAll(/raise exception '([^']+)'/g)].map((match) => match[1]),
    ...[...schema.matchAll(/room_state\(v_room\.id, '([^']+)'\)/g)].map((match) => match[1]),
  ].map((text) => text.replaceAll("%", "3"));

  it("her sunucu mesajının İngilizce karşılığı var", () => {
    expect(serverTexts.length).toBeGreaterThan(30);
    applyLocale("en");
    for (const text of serverTexts) expect(serverMessage(text), text).not.toBe("Something went wrong. Please try again.");
  });

  it("Türkçe arayüzde mesaj olduğu gibi kalır", () => {
    expect(serverMessage("Oda dolu.")).toBe("Oda dolu.");
    applyLocale("en");
    expect(serverMessage("Oda dolu.")).toBe("The room is full.");
    expect(serverMessage("Aynı anda en fazla 3 açık odan olabilir.")).toBe("You can have at most 3 open rooms at a time.");
  });
});
