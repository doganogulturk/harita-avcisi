import { shuffle } from "@/lib/shuffle";
import { correctLocationId, type GameMode, type PlayChoice, type Question } from "@/lib/game";
import { regionOf } from "@/lib/turkish-regions";
import { CONTINENTS, continentLocationIds } from "@/lib/world-countries";

/** Şıklı soruda gösterilen seçenek sayısı: doğru cevap ve üç yanlış. */
export const CHOICE_COUNT = 4;

/**
 * Bir yerin "yakın grubu": Türkiye'de bölgesi, dünyada kıtası. Yanlış şıklar önce aynı gruptan seçilir; haritada işaretli
 * Konya'yı Yozgat ya da Aksaray ile karıştırmak, Edirne ile karıştırmaktan daha öğretici ve daha adil bir sorudur. Hiçbir
 * kıtada olmayan ülkeler (ör. Okyanusya) kendi grubunu oluşturur.
 */
function groupOf(mode: GameMode, locationId: string): string {
  if (mode === "turkey") return regionOf(Number(locationId));
  return CONTINENTS.find((continent) => continentLocationIds(continent.id).has(locationId))?.id ?? "other";
}

/**
 * "Haritada işaretli yer hangisi?" sorusunun şıkları: doğru cevap ve üç yanlış, karışık sırada, yer kimlikleri olarak.
 * Kimlikler haritaya dokunmakla gelenlerle aynı biçimdedir (Türkiye'de başında sıfır olmayan plaka, dünyada ISO kodu); bu
 * yüzden cevap sunucuda mevcut doğrulamadan geçer, sunucuda hiçbir şey değişmez.
 *
 * `pool`, yanlış şıkların seçileceği havuzdur: turun kendi havuzu (kıta antrenmanında yalnızca o kıta, başkent turunda yalnızca
 * başkenti listede olan ülkeler). "Bunları çalış" odağı havuzu daraltmamalı; yoksa şıklar hep aynı birkaç yerden gelirdi.
 */
export function choiceOptions(choice: Pick<PlayChoice, "mode">, question: Question, pool: readonly Question[]): string[] {
  const answer = correctLocationId(question);
  const group = groupOf(choice.mode, answer);
  const others = [...new Set(pool.map(correctLocationId))].filter((id) => id !== answer);
  const near = shuffle(others.filter((id) => groupOf(choice.mode, id) === group));
  const far = shuffle(others.filter((id) => groupOf(choice.mode, id) !== group));
  return shuffle([answer, ...[...near, ...far].slice(0, CHOICE_COUNT - 1)]);
}
