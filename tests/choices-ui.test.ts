import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnswerChoices } from "@/app/components/AnswerChoices";
import { choiceLabel, turkeyChoice, worldChoice, type AnswerState, type PlayChoice } from "@/lib/game";

const none = () => {};
const render = (choice: PlayChoice, options: string[], correct: string, selected: string | null, answerState: AnswerState) =>
  renderToStaticMarkup(createElement(AnswerChoices, { choice, options, correctLocation: correct, selectedLocation: selected, answerState, onPick: none }));
const flat = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const turkey = { ...turkeyChoice("practice", "name"), choices: true };

describe("şıklı soru: etiket", () => {
  it("şıklı tur etiketin sonuna 'Şıklı' ekler; olağan etiketler değişmez", () => {
    expect(choiceLabel(turkey)).toBe("Antrenman · Türkiye · Şıklı");
    expect(choiceLabel({ ...worldChoice("ranked", "all", "flag"), choices: true })).toBe("Bayrak · Şıklı");
    expect(choiceLabel({ ...worldChoice("practice", "europe", "name"), choices: true })).toBe("Antrenman · Avrupa · Şıklı");
    expect(choiceLabel(turkeyChoice("practice", "plate"))).toBe("Antrenman · Türkiye · Plaka");
    expect(choiceLabel(worldChoice("ranked", "all", "name"))).toBe("Dünya");
  });
});

describe("şıklı soru: şık paneli", () => {
  it("cevaptan önce dört şık da etkin ve numaralı; ad modunda yer adı yazar", () => {
    const html = render(turkey, ["38", "58", "6", "34"], "38", null, null);
    expect((html.match(/<button/g) ?? []).length).toBe(4);
    expect(html).not.toContain('disabled=""');
    expect(flat(html)).toContain("Kayseri");
    expect(html).not.toContain("bg-emerald-300");
    expect(html).not.toContain("bg-rose-300");
  });

  it("cevaptan sonra doğru şık yeşil, yanlış seçilen kırmızı, hepsi kilitli", () => {
    const html = render(turkey, ["38", "58", "6", "34"], "38", "58", "incorrect");
    expect((html.match(/disabled=""/g) ?? []).length).toBe(4);
    expect(html).toContain("bg-emerald-300");
    expect(html).toContain("bg-rose-300");
    // Doğru cevap seçilmişse kırmızı yok
    const right = render(turkey, ["38", "58", "6", "34"], "38", "38", "correct");
    expect(right).toContain("bg-emerald-300");
    expect(right).not.toContain("bg-rose-300");
  });

  it("bayrak modunda şıklar yalnızca bayrak; ad cevaptan sonra altta görünür", () => {
    const flag = { ...worldChoice("practice", "all", "flag"), choices: true };
    const before = render(flag, ["fr", "de", "it", "es"], "fr", null, null);
    expect(before).toContain("flags/fr");
    expect(flat(before)).not.toContain("Fransa");
    const after = render(flag, ["fr", "de", "it", "es"], "fr", "fr", "correct");
    expect(flat(after)).toContain("Fransa");
  });

  it("başkent modunda şıklar başkent, plaka modunda plaka rozeti", () => {
    const capital = { ...worldChoice("practice", "all", "capital"), choices: true };
    const capitals = flat(render(capital, ["au", "nz", "ca", "br"], "au", null, null));
    expect(capitals).toContain("Kanberra");
    expect(capitals).not.toContain("Avustralya");
    const plate = { ...turkeyChoice("practice", "plate"), choices: true };
    const plates = flat(render(plate, ["38", "6", "34", "35"], "38", null, null));
    expect(plates).toContain("38");
    expect(plates).not.toContain("Kayseri");
  });
});
