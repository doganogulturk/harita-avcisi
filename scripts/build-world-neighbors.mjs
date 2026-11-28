// Ülkelerin kara sınırı komşuluk tablosunu üretir: node scripts/build-world-neighbors.mjs
//
// Kaynak: public/maps/world.svg (oyunun dünya haritası). İl haritasının tersine bu haritada ülkeler aynı sınır noktalarını
// paylaşmaz, aralarında küçük boşluklar vardır; bu yüzden "ortak köşe" yerine yakınlık ölçülür: bir ülkenin sınırında,
// öbür ülkenin sınırına EPSILON birimden yakın kalan uzunluk iki yönde de ölçülür, küçüğü MIN_LENGTH'i geçiyorsa iki ülke
// komşudur. Harita 784 birim genişliğindedir (bir boylam derecesi ~2,2 birim).
//
// Haritanın kendisi kara sınırı ile dar deniz geçişini (Kızıldeniz, Øresund, Karayip adaları) ayırt edemez; ayrıca bazı
// ülkelerin şekli denizaşırı topraklarını ya da haritada ayrı çizilmeyen bölgeleri (Batı Sahra, Kosova) içerir. Bunlar
// CORRECTIONS'ta tek tek ve nedeniyle düzeltilir. Doğrulama yöntemi ve sonucu: docs/GELISTIRME.md, "Komşuluk (dünya)".
//
// Çıktı: lib/world-neighbors.ts. Dosya elle düzenlenmez; tests/neighbors.test.ts tablonun haritayla güncel olduğunu denetler.

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const SOURCE = "public/maps/world.svg";
const OUT = "lib/world-neighbors.ts";
const EPSILON = 1;
const MIN_LENGTH = 0.5;
/** Sınır uzunluğu bu aralıklarla örneklenir (harita birimi). */
const STEP = 0.25;

/**
 * Haritadan çıkan tabloya elle yapılan düzeltmeler: [kod, kod, "add" | "remove", neden]. Her biri Wikidata'nın "ortak sınır"
 * ilişkisiyle karşılaştırmada ya da tam listenin elle gözden geçirilmesinde bulundu (docs/GELISTIRME.md).
 */
const CORRECTIONS = [
  // Dar deniz geçişleri: haritada kıyılar birbirine çok yakın, ama kara sınırı yok.
  ["dk", "se", "remove", "Øresund; kara sınırı yok"],
  ["dj", "ye", "remove", "Babülmendep; kara sınırı yok"],
  ["er", "ye", "remove", "Kızıldeniz; kara sınırı yok"],
  ["eg", "jo", "remove", "Akabe Körfezi; arada İsrail var"],
  ["eg", "sa", "remove", "Kızıldeniz; kara sınırı yok"],
  ["my", "sg", "remove", "Johor Boğazı; Singapur bir adadır"],
  ["ae", "qa", "remove", "Basra Körfezi; arada Suudi Arabistan var"],
  // Haritanın sadeleştirmesi: Vahan koridoru çok ince çizildiği için Pakistan Tacikistan'a değiyor, Çin'e değmiyor.
  ["pk", "tj", "remove", "Vahan koridoru (Afganistan) araya girer"],
  ["af", "cn", "add", "Vahan koridoru, ~76 km kara sınırı"],
  // Haritada çizilmeyen ya da başka ülkenin şekline katılmış topraklar.
  ["az", "tr", "add", "Nahçıvan; haritada Azerbaycan'ın şekline dahil değil"],
  ["dj", "so", "add", "Somaliland haritada ayrı çizilmiş, oyunda sorulmuyor; uluslararası sınır Somali'dir"],
  ["fr", "br", "remove", "Fransız Guyanası (denizaşırı toprak); oyunda yanıltıcı olur"],
  ["fr", "sr", "remove", "Fransız Guyanası (denizaşırı toprak); oyunda yanıltıcı olur"],
  ["ma", "mr", "remove", "Batı Sahra haritada Fas'ın şekline katılmış; sınır yalnızca Batı Sahra üzerinden"],
  ["al", "rs", "remove", "Kosova haritada Sırbistan'ın şekline katılmış; sınır yalnızca Kosova üzerinden"],
];

/** SVG yolunu halkalara çevirir. Haritada yalnızca M, L, H, V ve Z komutları (büyük ve küçük harf) vardır. */
function parsePath(d) {
  const rings = [];
  const tokens = [...d.matchAll(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g)].map(([token]) => token);
  let ring = null;
  let x = 0, y = 0, startX = 0, startY = 0, command = null, i = 0;
  const next = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) command = tokens[i++];
    switch (command) {
      case "M": case "m":
        x = command === "M" ? next() : x + next();
        y = command === "M" ? next() : y + next();
        ring = [[x, y]];
        rings.push(ring);
        [startX, startY] = [x, y];
        command = command === "M" ? "L" : "l"; // M'den sonraki çiftler çizgidir
        break;
      case "L": x = next(); y = next(); ring.push([x, y]); break;
      case "l": x += next(); y += next(); ring.push([x, y]); break;
      case "H": x = next(); ring.push([x, y]); break;
      case "h": x += next(); ring.push([x, y]); break;
      case "V": y = next(); ring.push([x, y]); break;
      case "v": y += next(); ring.push([x, y]); break;
      case "Z": case "z": [x, y] = [startX, startY]; ring.push([x, y]); break;
      default:
        console.error(`✗ Tanınmayan yol komutu: ${command}`);
        process.exit(1);
    }
  }
  return rings;
}

const svg = readFileSync(SOURCE, "utf8");
const shapes = new Map();
for (const match of svg.matchAll(/<(path|g) id="([^"]+)"([^>]*)>/g)) {
  const [, tag, id, rest] = match;
  const paths = tag === "path" ? [rest.match(/ d="([^"]+)"/)[1]] : [...svg.slice(match.index, svg.indexOf("</g>", match.index)).matchAll(/ d="([^"]+)"/g)].map(([, d]) => d);
  shapes.set(id, paths.flatMap(parsePath));
}
// Oyunda sorulan ülkeler ISO kodlu olanlardır; "_somaliland" gibi kodsuz parçalar tabloya girmez.
const codes = [...shapes.keys()].filter((id) => /^[a-z]{2}$/.test(id)).sort();
if (codes.length !== 179) {
  console.error(`✗ 179 ülke bekleniyordu, ${codes.length} bulundu.`);
  process.exit(1);
}

function boxOf(rings) {
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const ring of rings) for (const [x, y] of ring) [box[0], box[1], box[2], box[3]] = [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)];
  return box;
}
const boxes = new Map(codes.map((code) => [code, boxOf(shapes.get(code))]));
const isNear = (box, x, y) => x >= box[0] - EPSILON && x <= box[2] + EPSILON && y >= box[1] - EPSILON && y <= box[3] + EPSILON;

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const dx = bx - ax, dy = by - ay, length = dx * dx + dy * dy;
  const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length)) : 0;
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/** A'nın sınırında, B'nin sınırına EPSILON'dan yakın kalan toplam uzunluk. */
function closeLength(a, b, boxB) {
  let total = 0;
  for (const ring of a) {
    for (let i = 1; i < ring.length; i += 1) {
      const [ax, ay] = ring[i - 1], [bx, by] = ring[i];
      const length = Math.hypot(bx - ax, by - ay);
      const samples = Math.max(1, Math.ceil(length / STEP));
      for (let k = 0; k < samples; k += 1) {
        const t = (k + 0.5) / samples, px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
        if (!isNear(boxB, px, py)) continue;
        let best = Infinity;
        for (const other of b) for (let j = 1; j < other.length && best > EPSILON; j += 1) best = Math.min(best, distanceToSegment(px, py, other[j - 1], other[j]));
        if (best <= EPSILON) total += length / samples;
      }
    }
  }
  return total;
}

const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
const edges = new Set();
for (let i = 0; i < codes.length; i += 1) {
  for (let j = i + 1; j < codes.length; j += 1) {
    const [a, b] = [codes[i], codes[j]];
    const [boxA, boxB] = [boxes.get(a), boxes.get(b)];
    if (boxA[0] > boxB[2] + EPSILON || boxB[0] > boxA[2] + EPSILON || boxA[1] > boxB[3] + EPSILON || boxB[1] > boxA[3] + EPSILON) continue;
    const shared = Math.min(closeLength(shapes.get(a), shapes.get(b), boxB), closeLength(shapes.get(b), shapes.get(a), boxA));
    if (shared >= MIN_LENGTH) edges.add(pairKey(a, b));
  }
}

for (const [a, b, action, reason] of CORRECTIONS) {
  const key = pairKey(a, b);
  if (action === "add" ? edges.has(key) : !edges.has(key)) {
    console.error(`✗ Düzeltme artık gereksiz (${a}–${b}, ${action}: ${reason}); haritada zaten öyle. CORRECTIONS'tan çıkar.`);
    process.exit(1);
  }
  if (action === "add") edges.add(key);
  else edges.delete(key);
}

const neighbors = Object.fromEntries(codes.map((code) => [code, []]));
for (const key of edges) {
  const [a, b] = key.split("-");
  neighbors[a].push(b);
  neighbors[b].push(a);
}
for (const list of Object.values(neighbors)) list.sort();

const hash = createHash("sha256").update(svg).digest("hex").slice(0, 16);
const rows = codes.map((code) => `  ${code}: [${neighbors[code].map((other) => `"${other}"`).join(", ")}],`).join("\n");
writeFileSync(
  OUT,
  `// Bu dosya scripts/build-world-neighbors.mjs tarafından üretilir; elle düzenlenmez (düzeltme gerekirse betikteki CORRECTIONS'a).
// Kaynak: ${SOURCE} (sha256 ${hash}); sınırları ${EPSILON} birimden yakın, en az ${MIN_LENGTH} birim boyunca uzanan ülkeler komşudur,
// ${CORRECTIONS.length} elle düzeltmeyle.

/**
 * ISO kodu → kara sınırı komşularının ISO kodları (alfabetik). Yalnızca haritadaki 179 ülke arasında; haritada olmayan
 * küçük ülkeler (Andorra, Vatikan, Lihtenştayn…) sayılmaz. Kara komşusu olmayan ülkelerin (adalar) listesi boştur.
 */
export const WORLD_NEIGHBORS: Readonly<Record<string, readonly string[]>> = {
${rows}
};

/** Tablonun üretildiği haritanın özeti; harita değişince tests/neighbors.test.ts uyarır. */
export const WORLD_NEIGHBORS_SOURCE_HASH = "${hash}";
`,
);
const counts = codes.map((code) => neighbors[code].length);
const isolated = codes.filter((code) => neighbors[code].length === 0);
console.log(`✓ ${edges.size} komşu çifti, ${codes.length - isolated.length} ülkenin kara komşusu var (en çok ${Math.max(...counts)}), kaynak ${hash}`);
console.log(`  Kara komşusu olmayan ${isolated.length} ülke: ${isolated.join(" ")}`);
