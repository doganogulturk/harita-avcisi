import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RightAnswers, WrongAnswers } from "@/app/components/SessionReview";
import { choiceLabel, turkeyChoice, type AnswerRecord, type PlayChoice } from "@/lib/game";

const flat = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const neighborChoice: PlayChoice = { ...turkeyChoice("practice", "name"), choices: true, neighbors: true };
// Soru 1: Sivas (58) ile komşu olan Kayseri (38) cevap, oyuncu Van (65) dedi. Soru 2: Aydın (9) ile komşu İzmir (35), doğru.
const answers: AnswerRecord[] = [
  { location: "38", selected: "65" },
  { location: "35", selected: "35" },
];
const subjects = ["58", "9"];

describe("komşuluk sorusu: etiket ve sonuç dökümü", () => {
  it("etiket 'Komşuluk' der; olağan etiketler değişmez", () => {
    expect(choiceLabel(neighborChoice)).toBe("Antrenman · Türkiye · Komşuluk");
    expect(choiceLabel({ ...turkeyChoice("practice", "name"), choices: true })).toBe("Antrenman · Türkiye · Şıklı");
    expect(choiceLabel(turkeyChoice("practice", "name"))).toBe("Antrenman · Türkiye");
  });

  it("yanlış cevap satırı konuyu söyler: 'Sivas ile komşu: Kayseri', sağda 'Sen: Van'", () => {
    const text = flat(renderToStaticMarkup(createElement(WrongAnswers, { answers, choice: neighborChoice, subjects })));
    expect(text).toContain("Sivas ile komşu:");
    expect(text).toContain("Kayseri");
    expect(text).toContain("Sen: Van");
    expect(text).not.toContain("Aydın ile komşu:"); // doğru cevap yanlışlar arasında değil
  });

  it("doğru cevaplar açık başlayınca konuyla birlikte yazılır; kapalıyken yalnızca başlık", () => {
    const closed = flat(renderToStaticMarkup(createElement(RightAnswers, { answers, choice: neighborChoice, subjects })));
    expect(closed).toContain("Doğru cevapladıkların · 1");
    expect(closed).not.toContain("Aydın ile komşu:");
    const open = flat(renderToStaticMarkup(createElement(RightAnswers, { answers, choice: neighborChoice, subjects, isOpenByDefault: true })));
    expect(open).toContain("Aydın ile komşu:");
    expect(open).toContain("İzmir");
  });

  it("konu verilmezse (olağan tur) döküm eskisi gibi, 'ile komşu' yazmaz", () => {
    const text = flat(renderToStaticMarkup(createElement(WrongAnswers, { answers, choice: turkeyChoice("practice", "name") })));
    expect(text).not.toContain("ile komşu");
    expect(text).toContain("Kayseri");
  });
});
