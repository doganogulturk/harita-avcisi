// Türkiye'nin il komşuluk tablosunu üretir: node scripts/build-neighbors.mjs
//
// Kaynak: public/maps/provinces/all.svg (scripts/build-province-maps.mjs üretir). Bu haritada bütün iller aynı sınır
// noktalarını paylaşır ("sınırlar boşluksuz örtüşür"), yani iki il aynı köşe noktalarında buluşuyorsa komşudur. En az
// MIN_SHARED ortak köşe aranır: tek bir köşede değen iller (dörtlü kavşak) kenar paylaşmaz, komşu sayılmaz.
//
// Çıktı: lib/turkish-neighbors.ts. Dosya elle düzenlenmez; elle düzeltme gerekirse CORRECTIONS'a yazılır ve nedeni açıklanır.
// tests/neighbors.test.ts tablonun haritayla güncel olduğunu denetler (haritayı yenileyip bu betiği çalıştırmayı unutma).

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const SOURCE = "public/maps/provinces/all.svg";
const OUT = "lib/turkish-neighbors.ts";
const MIN_SHARED = 2;

/**
 * Haritadan çıkan tabloya elle yapılan düzeltmeler: [plaka, plaka, "add" | "remove", neden]. Boş bırakılmıştır;
 * bağımsız doğrulamada (docs/GELISTIRME.md) bulunan bir hata olursa buraya eklenir.
 */
const CORRECTIONS = [];

const svg = readFileSync(SOURCE, "utf8");
const provinces = [...svg.matchAll(/<path id="TUR(\d+)"[^>]* d="([^"]+)"/g)].map(([, id, d]) => ({
  plate: Number(id),
  points: new Set([...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(([, x, y]) => `${x},${y}`)),
}));
if (provinces.length !== 81) {
  console.error(`✗ 81 il bekleniyordu, ${provinces.length} bulundu.`);
  process.exit(1);
}

// Her köşe noktası hangi illerde geçiyor?
const owners = new Map();
for (const { plate, points } of provinces) for (const point of points) (owners.get(point) ?? owners.set(point, new Set()).get(point)).add(plate);

const shared = new Map();
for (const set of owners.values()) {
  const list = [...set].sort((a, b) => a - b);
  for (let i = 0; i < list.length; i += 1) for (let j = i + 1; j < list.length; j += 1) shared.set(`${list[i]}-${list[j]}`, (shared.get(`${list[i]}-${list[j]}`) ?? 0) + 1);
}

const edges = new Set([...shared].filter(([, count]) => count >= MIN_SHARED).map(([key]) => key));
for (const [a, b, action] of CORRECTIONS) {
  const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
  if (action === "add") edges.add(key);
  else edges.delete(key);
}

const neighbors = Object.fromEntries(provinces.map(({ plate }) => [plate, []]));
for (const key of edges) {
  const [a, b] = key.split("-").map(Number);
  neighbors[a].push(b);
  neighbors[b].push(a);
}
for (const list of Object.values(neighbors)) list.sort((x, y) => x - y);
const isolated = Object.entries(neighbors).filter(([, list]) => list.length === 0).map(([plate]) => plate);
if (isolated.length) {
  console.error(`✗ Komşusu olmayan il: ${isolated.join(", ")}`);
  process.exit(1);
}

const hash = createHash("sha256").update(svg).digest("hex").slice(0, 16);
const rows = Object.entries(neighbors).map(([plate, list]) => `  ${plate}: [${list.join(", ")}],`).join("\n");
writeFileSync(
  OUT,
  `// Bu dosya scripts/build-neighbors.mjs tarafından üretilir; elle düzenlenmez (düzeltme gerekirse betikteki CORRECTIONS'a).
// Kaynak: ${SOURCE} (sha256 ${hash}); iki il en az ${MIN_SHARED} ortak sınır köşesi paylaşıyorsa komşudur.

/** Plaka kodu → komşu illerin plaka kodları (artan sırada). Yalnızca kara sınırı sayılır. */
export const NEIGHBORS: Readonly<Record<number, readonly number[]>> = {
${rows}
};

/** Tablonun üretildiği haritanın özeti; harita değişince tests/neighbors.test.ts uyarır. */
export const NEIGHBORS_SOURCE_HASH = "${hash}";
`,
);
const counts = Object.values(neighbors).map((list) => list.length);
console.log(`✓ ${edges.size} komşu çifti, il başına ${Math.min(...counts)}–${Math.max(...counts)} komşu (ortalama ${(counts.reduce((a, b) => a + b, 0) / 81).toFixed(2)}), kaynak ${hash}`);
