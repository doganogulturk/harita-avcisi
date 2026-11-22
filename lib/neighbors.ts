import { CHOICE_COUNT } from "@/lib/choices";
import { type GameMode } from "@/lib/game";
import { shuffle } from "@/lib/shuffle";
import { NEIGHBORS } from "@/lib/turkish-neighbors";

/**
 * Bir yerin komşuları, yer kimlikleriyle (Türkiye'de başında sıfır olmayan plaka). Yalnızca Türkiye illeri için vardır:
 * dünya haritasında ülkeler arasında boşluk olduğu için komşuluk haritadan çıkarılamaz ve ülkeler için dış veri
 * kaynağı gerekir (docs/GELISTIRME.md). Dünya için boş liste döner.
 */
export function neighborIds(mode: GameMode, locationId: string): readonly string[] {
  if (mode !== "turkey") return [];
  return (NEIGHBORS[Number(locationId)] ?? []).map(String);
}

/** İki yer komşu mu? Türkiye dışında her zaman false. */
export function areNeighbors(mode: GameMode, first: string, second: string): boolean {
  return mode === "turkey" && (NEIGHBORS[Number(first)] ?? []).includes(Number(second));
}

/**
 * Komşuluk sorusunun konusu: "X ile komşu olan hangisi?" sorusundaki X. Cevap (answerId) konunun komşusudur; konu, cevabın
 * komşuları arasından seçilir. Seçim rastgele görünür ama tur numarasından ve sorunun sırasından türetilir, yani aynı turda
 * her zaman aynıdır: sonuç ekranı soru başına konuyu yeniden kurabilir, ayrıca bir yerde saklamak gerekmez.
 */
export function neighborSubject(answerId: string, roundKey: number, index: number): string {
  const candidates = neighborIds("turkey", answerId);
  if (candidates.length === 0) return answerId;
  const seed = (Math.imul(roundKey + 1, 2654435761) ^ Math.imul(index + 1, 40503)) >>> 0;
  return candidates[seed % candidates.length];
}

/**
 * Komşuluk sorusunun şıkları: cevap ve konuyla komşu olmayan üç il, karışık sırada. Yanlış şıklar önce "komşunun komşusu"
 * illerden seçilir (konunun komşusu değil ama ona yakın), yetmezse kalan illerden tamamlanır. Böylece cevap tek ve açıktır:
 * şıklardan yalnızca biri konunun komşusudur, ama uzak bir ili elemek de yetmez. Konunun kendisi şık olmaz.
 */
export function neighborOptions(subjectId: string, answerId: string): string[] {
  const subject = Number(subjectId);
  const direct = new Set<number>(NEIGHBORS[subject] ?? []);
  const forbidden = new Set<number>([subject, ...direct]);
  const second = new Set<number>();
  for (const neighbor of direct) for (const other of NEIGHBORS[neighbor] ?? []) if (!forbidden.has(other)) second.add(other);
  const rest = Object.keys(NEIGHBORS).map(Number).filter((plate) => !forbidden.has(plate) && !second.has(plate));
  const wrong = [...shuffle([...second]), ...shuffle(rest)].slice(0, CHOICE_COUNT - 1).map(String);
  return shuffle([String(Number(answerId)), ...wrong]);
}
