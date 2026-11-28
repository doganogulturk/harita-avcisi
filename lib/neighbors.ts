import { CHOICE_COUNT } from "@/lib/choices";
import { correctLocationId, normalizeLocationId, type GameMode, type Question } from "@/lib/game";
import { shuffle } from "@/lib/shuffle";
import { NEIGHBORS } from "@/lib/turkish-neighbors";
import { WORLD_NEIGHBORS } from "@/lib/world-neighbors";

/** Yer kimliği → komşularının kimlikleri: Türkiye'de başında sıfır olmayan plaka, dünyada ISO kodu. */
type NeighborTable = Readonly<Record<string, readonly string[]>>;

const TABLES: Record<GameMode, NeighborTable> = {
  turkey: Object.fromEntries(Object.entries(NEIGHBORS).map(([plate, list]) => [plate, list.map(String)])),
  world: WORLD_NEIGHBORS,
};

/**
 * Bir yerin kara sınırı komşuları, yer kimlikleriyle. Türkiye'de 81 ilin hepsinin komşusu vardır (lib/turkish-neighbors.ts);
 * dünyada ada ülkelerinin listesi boştur (lib/world-neighbors.ts). Bilinmeyen kimlik boş liste döner.
 */
export function neighborIds(mode: GameMode, locationId: string): readonly string[] {
  return TABLES[mode][normalizeLocationId(mode, locationId)] ?? [];
}

/** İki yer komşu mu? Simetriktir; bir yer kendisiyle komşu değildir. */
export function areNeighbors(mode: GameMode, first: string, second: string): boolean {
  return neighborIds(mode, first).includes(normalizeLocationId(mode, second));
}

/**
 * Komşuluk turunun "evreni": konunun ve şıkların seçilebileceği yerler, yani turun kendi havuzu (kıta antrenmanında yalnızca o
 * kıta, başkent turunda yalnızca başkenti listede olan ülkeler). Konu evrenin dışından gelirse haritada soluk ve tıklanamaz
 * kalırdı; şık başkent turunda başkentsiz olursa gösterilecek bir şey olmazdı.
 */
export function neighborUniverse(mode: GameMode, pool: readonly Question[]): ReadonlySet<string> {
  return new Set(pool.map((question) => normalizeLocationId(mode, correctLocationId(question))));
}

/** Evrende en az bir komşusu olan yerler: komşuluk sorusunun cevabı ancak bunlardan biri olabilir (adalar sorulmaz). */
export function neighborPool<T extends Question>(mode: GameMode, pool: readonly T[]): T[] {
  const universe = neighborUniverse(mode, pool);
  return pool.filter((question) => neighborIds(mode, correctLocationId(question)).some((id) => universe.has(id)));
}

/** Olumsuz soruda şıkların üçü konunun komşusudur; konunun evrende en az bu kadar komşusu olmalı. */
const NEGATIVE_MIN_NEIGHBORS = CHOICE_COUNT - 1;

/**
 * Komşuluk sorusu: konu ("X") ve sorunun biçimi. Olumlu soru "X ile komşu olan hangisi?", olumsuz soru "X ile komşu olmayan
 * hangisi?". İkisinde de soru havuzundaki yer (answerId) doğru cevaptır; böylece tur, cevap denetimi ve sonuç ekranı değişmez.
 */
export type NeighborAsk = { subject: string; isNegative: boolean };

/** Tur numarası ve sorunun sırasından türetilen sayı: rastgele görünür, ama aynı turda aynı soru için hep aynıdır. */
function seedFor(roundKey: number, index: number, salt = 0): number {
  let hash = Math.imul(roundKey + 1, 2654435761) ^ Math.imul(index + 1, 40503) ^ Math.imul(salt + 1, 2246822519);
  // Karıştırma (murmur3 sonu): yakın girdiler (ardışık sorular) birbirinden bağımsız sonuç versin.
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b);
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
  return (hash ^ (hash >>> 16)) >>> 0;
}

/** Evrendeki komşular. */
function neighborsIn(mode: GameMode, id: string, universe?: ReadonlySet<string>): string[] {
  return neighborIds(mode, id).filter((other) => !universe || universe.has(other));
}

/**
 * Sorunun konusu ve biçimi. Soruların yaklaşık üçte biri olumsuzdur; hangisinin olumsuz olacağı ve konu, tur numarası ile
 * sorunun sırasından türetilir, yani aynı turda her zaman aynıdır: sonuç ekranı soru başına yeniden kurabilir, bir yerde saklamak
 * gerekmez.
 *
 * Olumlu soruda konu, cevabın komşularından biridir. Olumsuz soruda cevap konunun komşusu değildir ama ona yakındır: konu, cevabın
 * "komşusunun komşusu" halkasından seçilir (cevapla komşu değil, ortak bir komşuları var) ve evrende en az üç komşusu olmalıdır.
 * Böyle bir konu yoksa soru olumlu sorulur (ör. komşusu az olan ülkelerin çevresi).
 */
export function neighborAsk(mode: GameMode, answerId: string, roundKey: number, index: number, universe?: ReadonlySet<string>): NeighborAsk {
  const answer = normalizeLocationId(mode, answerId);
  const direct = neighborsIn(mode, answer, universe);
  if (seedFor(roundKey, index, 1) % 3 === 0) {
    const ring = new Set<string>();
    for (const neighbor of direct) {
      for (const other of neighborsIn(mode, neighbor, universe)) {
        if (other !== answer && !direct.includes(other) && neighborsIn(mode, other, universe).length >= NEGATIVE_MIN_NEIGHBORS) ring.add(other);
      }
    }
    const candidates = [...ring].sort();
    if (candidates.length > 0) return { subject: candidates[seedFor(roundKey, index) % candidates.length], isNegative: true };
  }
  if (direct.length === 0) return { subject: answer, isNegative: false };
  return { subject: direct[seedFor(roundKey, index) % direct.length], isNegative: false };
}

/**
 * Komşuluk sorusunun şıkları, karışık sırada; konunun kendisi şık olmaz. Şıklardan yalnızca biri soruya uyar:
 *
 * - Olumlu soru: cevap ve konuyla komşu olmayan üç yer. Yanlış şıklar önce "komşunun komşusu" yerlerden seçilir (konunun komşusu
 *   değil ama ona yakın), yetmezse evrenin geri kalanından tamamlanır; uzak bir yeri elemek yetmesin.
 * - Olumsuz soru: cevap (konunun komşusu olmayan yer) ve konunun üç komşusu.
 *
 * Evren verilmezse modun bütün yerleridir.
 */
export function neighborOptions(mode: GameMode, subjectId: string, answerId: string, universe?: ReadonlySet<string>, isNegative = false): string[] {
  const table = TABLES[mode];
  const allowed = universe ?? new Set(Object.keys(table));
  const subject = normalizeLocationId(mode, subjectId);
  const answer = normalizeLocationId(mode, answerId);
  if (isNegative) return shuffle([answer, ...shuffle(neighborsIn(mode, subject, allowed)).slice(0, CHOICE_COUNT - 1)]);
  const direct = new Set(neighborIds(mode, subject));
  const forbidden = new Set([subject, ...direct]);
  const second = new Set<string>();
  for (const neighbor of direct) for (const other of table[neighbor] ?? []) if (!forbidden.has(other) && allowed.has(other)) second.add(other);
  const rest = [...allowed].filter((id) => !forbidden.has(id) && !second.has(id));
  const wrong = [...shuffle([...second]), ...shuffle(rest)].slice(0, CHOICE_COUNT - 1);
  return shuffle([answer, ...wrong]);
}
