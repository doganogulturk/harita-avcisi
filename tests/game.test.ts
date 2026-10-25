import { describe, expect, it } from "vitest";
import { duelModeLabel, locationLabel, variantFor } from "@/lib/duel";
import {
  BOARDS,
  boardIdFor,
  boardVariantFor,
  choiceForBoard,
  choiceLabel,
  formatPlate,
  formatTime,
  isSameLocation,
  locationName,
  normalizeLocationId,
  playerFromUser,
  turkeyChoice,
  worldChoice,
  type PlayChoice,
} from "@/lib/game";

describe("tur seçimi", () => {
  it("yarışta dünya her zaman 179 ülkelik türdür; kıta yok sayılır", () => {
    expect(worldChoice("ranked", "all", "name")).toEqual({ kind: "ranked", mode: "world", difficulty: "hard" });
    expect(worldChoice("ranked", "europe", "name")).toEqual({ kind: "ranked", mode: "world", difficulty: "hard" });
  });

  it("yarışta bayrak tek bir sıralamaya bağlıdır", () => {
    const choice = worldChoice("ranked", "asia", "flag");
    expect(boardIdFor(choice)).toBe("world-flags");
    expect(boardVariantFor(choice)).toBe("flags");
  });

  it("yarışta başkent kendi sıralamasına bağlıdır", () => {
    const choice = worldChoice("ranked", "europe", "capital");
    expect(choice).toEqual({ kind: "ranked", mode: "world", difficulty: "hard", prompt: "capital" });
    expect(boardIdFor(choice)).toBe("world-capitals");
    expect(boardVariantFor(choice)).toBe("capitals");
  });

  it("antrenmanda kıta ve soru tipi korunur", () => {
    expect(worldChoice("practice", "africa", "flag")).toEqual({ kind: "practice", mode: "world", difficulty: "hard", continent: "africa", prompt: "flag" });
  });

  it("Türkiye'de soru tipi sıralamayı belirler", () => {
    expect(boardIdFor(turkeyChoice("ranked", "name"))).toBe("turkey");
    expect(boardIdFor(turkeyChoice("ranked", "plate"))).toBe("turkey-plates");
    expect(boardVariantFor(turkeyChoice("ranked", "plate"))).toBe("plates");
  });

  it("her sıralamanın turu yine aynı sıralamaya düşer", () => {
    for (const board of BOARDS) expect(boardIdFor(choiceForBoard(board))).toBe(board.id);
  });
});

describe("etiketler", () => {
  it("yarış, antrenman ve günlük meydan okuma ayrı adlandırılır", () => {
    expect(choiceLabel(worldChoice("ranked", "all", "name"))).toBe("Dünya");
    expect(choiceLabel(worldChoice("ranked", "all", "flag"))).toBe("Bayrak");
    expect(choiceLabel(turkeyChoice("practice", "plate"))).toBe("Antrenman · Türkiye · Plaka");
    expect(choiceLabel(worldChoice("practice", "europe", "name"))).toBe("Antrenman · Avrupa");
    expect(choiceLabel(worldChoice("ranked", "all", "capital"))).toBe("Başkent");
    expect(choiceLabel(worldChoice("practice", "asia", "capital"))).toBe("Antrenman · Asya · Başkent");
  });

  it("günlük meydan okumanın adı her modda önekli", () => {
    for (const board of BOARDS) {
      const daily: PlayChoice = { ...choiceForBoard(board), daily: true };
      expect(choiceLabel(daily)).toBe(`Günün meydan okuması · ${board.label}`);
    }
  });

  it("kaldırılan dünya normal modunun eski kayıtları adlandırılır", () => {
    expect(choiceLabel({ kind: "ranked", mode: "world", difficulty: "normal" })).toBe("Dünya · Tanınmış ülkeler");
    expect(duelModeLabel("world", "normal")).toBe("Dünya · Tanınmış ülkeler");
  });
});

describe("düello modu", () => {
  it("geçersiz ya da kaldırılmış mod haritanın ilk moduna düşer", () => {
    expect(variantFor("world", "normal")).toBe("hard");
    expect(variantFor("world", "plates")).toBe("hard");
    expect(variantFor("turkey", "flags")).toBe("normal");
    expect(variantFor("world", "flags")).toBe("flags");
    expect(variantFor("world", "capitals")).toBe("capitals");
    expect(variantFor("turkey", "capitals")).toBe("normal");
  });

  it("başkent düellosunda sorulan yer başkentiyle yazılır", () => {
    expect(duelModeLabel("world", "capitals")).toBe("Dünya · Başkent");
    expect(locationLabel("world", "capitals", "au")).toBe("Kanberra · Avustralya");
    expect(locationLabel("world", "hard", "au")).toBe("Avustralya");
  });
});

describe("yer kimlikleri", () => {
  it("Türkiye'de plaka başında sıfır olmadan tutulur", () => {
    expect(normalizeLocationId("turkey", "06")).toBe("6");
    expect(normalizeLocationId("world", "tr")).toBe("tr");
  });

  it("aynı yer biçimden bağımsız eşleşir", () => {
    expect(isSameLocation("turkey", "06", "6")).toBe(true);
    expect(isSameLocation("turkey", "34", "6")).toBe(false);
    expect(isSameLocation("world", "tr", "fr")).toBe(false);
    expect(isSameLocation("world", null, "fr")).toBe(false);
  });

  it("yer adları ve plaka biçimi", () => {
    expect(locationName("turkey", "62")).toBe("Tunceli");
    expect(locationName("world", "mt")).toBe("Malta");
    expect(locationName("world", "zz")).toBe("ZZ");
    expect(formatPlate(6)).toBe("06");
    expect(formatTime(72)).toBe("01:12");
  });
});

describe("oyuncu", () => {
  it("ad sırası: tam ad, ad, misafir adı, e-posta; yoksa Oyuncu", () => {
    expect(playerFromUser({ id: "1", user_metadata: { full_name: " Ayşe Kaya ", name: "ak" } }).name).toBe("Ayşe Kaya");
    expect(playerFromUser({ id: "1", user_metadata: { display_name: "Avcı 4821" } }).name).toBe("Avcı 4821");
    expect(playerFromUser({ id: "1", email: "a@b.c", user_metadata: {} }).name).toBe("a@b.c");
    expect(playerFromUser({ id: "1", user_metadata: {} })).toEqual({ id: "1", name: "Oyuncu", avatarUrl: null });
  });
});
