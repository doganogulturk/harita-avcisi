import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ModeList } from "@/app/components/intro/ModeList";
import { type ModeBoard } from "@/app/components/intro/ModeTiles";
import { type BoardId } from "@/lib/game";

const flat = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const none: (board: ModeBoard) => void = () => {};
const title = createElement("span", null, "Başlık");
const render = (map: "turkey" | "world", ids: BoardId[], extra: Partial<Parameters<typeof ModeList>[0]> = {}) =>
  renderToStaticMarkup(createElement(ModeList, { map, ids, onPick: none, title, ...extra }));

describe("mod listesi (Oyna ve Antrenman)", () => {
  it("yalnızca verilen modları çizer; sırayı korur", () => {
    const html = render("turkey", ["turkey", "turkey-plates"], { countFor: (id) => (id === "turkey" ? 81 : 81) });
    const text = flat(html);
    expect(text.indexOf("İller")).toBeLessThan(text.indexOf("Plakalar"));
    expect((html.match(/<li/g) ?? []).length).toBe(2);
    expect(text).toContain("81 il");
    expect(text).toContain("81 plaka");
  });

  it("komşulukta olduğu gibi tek modla çizilince Plakalar satırı yoktur ve ayırıcı çizgi eklenmez", () => {
    const html = render("turkey", ["turkey"]);
    expect(flat(html)).not.toContain("Plakalar");
    expect((html.match(/<li/g) ?? []).length).toBe(1);
    expect(html).not.toContain("border-t border-white/10");
  });

  it("birden fazla satırda ince çizgi ayırır", () => {
    const html = render("world", ["world-hard", "world-flags", "world-capitals"]);
    expect((html.match(/border-t border-white\/10/g) ?? []).length).toBe(2);
  });

  it("tek renk: Türkiye kırmızı (rose), Dünya mavi (sky); mod başına ayrı renk yok", () => {
    const turkey = render("turkey", ["turkey", "turkey-plates"]);
    expect(turkey).toContain("bg-rose-500");
    expect(turkey).not.toContain("bg-sky-500");
    const world = render("world", ["world-hard", "world-flags", "world-capitals"]);
    expect(world).toContain("bg-sky-500");
    expect(world).not.toContain("bg-rose-500");
    // Eski karoların beş ayrı rengi (çivit, camgöbeği, mavi...) satırlarda kullanılmaz
    for (const old of ["bg-indigo-500", "bg-teal-500", "bg-blue-600"]) expect(world + turkey).not.toContain(old);
  });

  it("her satırda Başla tuşu ve oynat simgesi var; satırın tamamı bir düğmedir", () => {
    const html = render("world", ["world-hard", "world-flags"]);
    expect((html.match(/<button/g) ?? []).length).toBe(2);
    expect(flat(html)).toContain("Başla");
  });

  it("kapalı satır (harita yükleniyor) nedenini yazar ve Başla göstermez", () => {
    const html = render("world", ["world-hard"], { disabledReasonFor: () => "Harita hazırlanıyor..." });
    expect(html).toContain("disabled");
    expect(flat(html)).toContain("Harita hazırlanıyor");
    expect(flat(html)).not.toContain("Başla");
  });

  it("başlığın altındaki ek (kıta seçimi) başlıktan sonra, listeden önce çizilir", () => {
    const html = render("world", ["world-hard"], { belowTitle: createElement("span", null, "KITA-SECIMI") });
    const text = flat(html);
    expect(text).toContain("KITA-SECIMI");
    expect(text.indexOf("Başlık")).toBeLessThan(text.indexOf("KITA-SECIMI"));
    expect(text.indexOf("KITA-SECIMI")).toBeLessThan(text.indexOf("Ülkeler"));
  });
});
