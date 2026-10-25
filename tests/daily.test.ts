import { describe, expect, it } from "vitest";
import { boardOf, dailyChoice, dailyDateLabel, dailyShareText, msUntilNextDaily } from "@/lib/daily";
import { boardIdFor } from "@/lib/game";

const HOUR = 60 * 60 * 1000;

describe("günlük meydan okumanın günü (Türkiye saati, UTC+3)", () => {
  it("gün Türkiye'de gece yarısı değişir", () => {
    // 2026-10-25 20:59 UTC = 23:59 Türkiye: yeni güne bir dakika.
    expect(msUntilNextDaily(Date.UTC(2026, 9, 25, 20, 59))).toBe(60 * 1000);
    // 21:00 UTC = 00:00 Türkiye: yeni gün tam başladı.
    expect(msUntilNextDaily(Date.UTC(2026, 9, 25, 21, 0))).toBe(24 * HOUR);
  });

  it("tarih Türkiye saatiyle yazılır", () => {
    expect(dailyDateLabel(Date.UTC(2026, 9, 25, 20, 59))).toBe("25 Ekim");
    expect(dailyDateLabel(Date.UTC(2026, 9, 25, 21, 0))).toBe("26 Ekim");
  });
});

describe("paylaşım metni", () => {
  it("tarih, mod, kareler, skor ve süre", () => {
    const text = dailyShareText("world-hard", [true, true, false, true], 3, 72000, Date.UTC(2026, 9, 25, 12));
    expect(text).toBe("Harita Avcısı · 25 Ekim · Dünya\n🟩🟩🟥🟩 3/10 · 01:12\n");
  });
});

describe("günlük modlar", () => {
  it("günlük tur aynı sıralamaya bağlıdır ve işaretlidir", () => {
    const choice = dailyChoice("turkey-plates");
    expect(choice.daily).toBe(true);
    expect(boardIdFor(choice)).toBe("turkey-plates");
  });

  it("sunucudaki mod adları sıralamaya çevrilir", () => {
    expect(boardOf({ game_mode: "world", variant: "flags" })).toBe("world-flags");
    expect(boardOf({ game_mode: "world", variant: "normal" })).toBeUndefined();
  });
});
