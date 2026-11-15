import { currentLocale } from "@/lib/i18n";
import { CONTINENTS, continentLocationIds, countries, countryName, type Continent, type MapBox } from "@/lib/world-countries";

/** Ülkeler oyununun haritaları: bütün dünya ya da bir kıta. */
export type CountrySetId = "all" | Continent;

export type CountrySet = { id: CountrySetId; codes: ReadonlySet<string> };

/**
 * Seçim sırası: önce bütün dünya, sonra kıtalar. Kıtalar Dünya antrenmanındakilerle aynı (lib/world-countries.ts): iki
 * kıtaya yayılan ülkeler (Türkiye, Rusya, Kafkasya…) Avrupa'da da Asya'da da çıkar; Okyanusya'nın kıta haritası yok,
 * ülkeleri yalnızca bütün dünyada.
 */
export const COUNTRY_SETS: CountrySet[] = [
  { id: "all", codes: new Set(countries.map((country) => country.code)) },
  ...(["europe", "asia", "africa", "america"] as const).map((id) => ({ id, codes: continentLocationIds(id) })),
];

const setOf = (id: CountrySetId) => {
  const set = COUNTRY_SETS.find((candidate) => candidate.id === id);
  if (!set) throw new Error(`Bilinmeyen ülke haritası: ${id}`);
  return set;
};

/** Haritanın ülkeleri, arayüz dilindeki adlarına göre alfabetik. */
export function countriesOf(id: CountrySetId) {
  const { codes } = setOf(id);
  const locale = currentLocale();
  return countries
    .filter((country) => codes.has(country.code))
    .map((country) => ({ id: country.code, name: countryName(country) }))
    .sort((a, b) => a.name.localeCompare(b.name, locale));
}

/** Ülkeler oyununun kaynağı: oyunun dünya haritası. Kıta haritaları ondan tarayıcıda çıkarılır (countryMapMarkup). */
export const WORLD_MAP_URL = "/maps/world.svg";

type Point = [number, number];
type Ring = Point[];

/** Haritadaki yol yalnızca M/L/H/V ve z komutlarından oluşur (eğri yok); her alt yol bir çokgen halkasıdır. */
export function ringsOf(d: string): Ring[] {
  const rings: Ring[] = [];
  const tokens = d.match(/[MmLlHhVvZz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g) ?? [];
  let ring: Ring = [];
  let [x, y] = [0, 0];
  let start: Point = [0, 0];
  let command = "M";
  for (let index = 0; index < tokens.length; ) {
    if (/[A-Za-z]/.test(tokens[index])) command = tokens[index++];
    if (command === "z" || command === "Z") {
      if (ring.length > 2) rings.push(ring);
      ring = [];
      [x, y] = start;
      continue;
    }
    const next = () => Number(tokens[index++]);
    if (command === "M" || command === "m") {
      if (ring.length > 2) rings.push(ring);
      const [dx, dy] = [next(), next()];
      [x, y] = command === "M" ? [dx, dy] : [x + dx, y + dy];
      start = [x, y];
      ring = [[x, y]];
      // M'den sonraki çiftler çizgidir.
      command = command === "M" ? "L" : "l";
      continue;
    }
    if (command === "L") [x, y] = [next(), next()];
    else if (command === "l") [x, y] = [x + next(), y + next()];
    else if (command === "H") x = next();
    else if (command === "h") x += next();
    else if (command === "V") y = next();
    else if (command === "v") y += next();
    else break;
    ring.push([x, y]);
  }
  if (ring.length > 2) rings.push(ring);
  return rings;
}

function boundsOf(rings: Ring[]): MapBox {
  const xs = rings.flat().map(([x]) => x);
  const ys = rings.flat().map(([, y]) => y);
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

const areaOf = (ring: Ring) => Math.abs(ring.reduce((sum, [x1, y1], index) => {
  const [x2, y2] = ring[(index + 1) % ring.length];
  return sum + x1 * y2 - x2 * y1;
}, 0)) / 2;

function contains(ring: Ring, [px, py]: Point) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x1, y1] = ring[index];
    const [x2, y2] = ring[previous];
    if (y1 > py !== y2 > py && px < ((x2 - x1) * (py - y1)) / (y2 - y1) + x1) inside = !inside;
  }
  return inside;
}

function edgeDistance(ring: Ring, [px, py]: Point) {
  let best = Infinity;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index++) {
    const [x1, y1] = ring[previous];
    const [x2, y2] = ring[index];
    const length = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    const t = length ? Math.max(0, Math.min(1, ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / length)) : 0;
    best = Math.min(best, Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1))));
  }
  return best;
}

/**
 * Adın yazılacağı nokta: ülkenin en büyük halkasının içinde, kenarlardan en uzak noktaya yakın (ızgarada arama, sonra
 * en iyi hücrenin çevresinde inceltme). Hilal ya da ince uzun ülkelerde ağırlık merkezi ülkenin dışına düşebiliyordu.
 */
export function labelPoint(rings: Ring[]): Point {
  const ring = rings.reduce((largest, candidate) => (areaOf(candidate) > areaOf(largest) ? candidate : largest));
  const box = boundsOf([ring]);
  let best: Point = [box.x + box.width / 2, box.y + box.height / 2];
  let bestDistance = contains(ring, best) ? edgeDistance(ring, best) : -1;
  let [cellX, cellY] = [box.width / 16, box.height / 16];
  let [originX, originY] = [box.x, box.y];
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i <= 16; i++) {
      for (let j = 0; j <= 16; j++) {
        const point: Point = [originX + i * cellX, originY + j * cellY];
        if (!contains(ring, point)) continue;
        const distance = edgeDistance(ring, point);
        if (distance > bestDistance) [best, bestDistance] = [point, distance];
      }
    }
    // İkinci tur: en iyi noktanın çevresindeki iki hücrelik alanda daha sık ızgara.
    [originX, originY] = [best[0] - cellX, best[1] - cellY];
    [cellX, cellY] = [cellX / 8, cellY / 8];
  }
  return best;
}

/**
 * Küçük ülkelerin işaret dairesi, çerçeve genişliğine oranla: bundan küçük ülkeler (small) bir daireyle işaretlenir
 * (radius). Kıtada telefon genişliğinde (~390 px) ~10 px'ten küçükler ~12 px'lik daire alır: parmakla dokunulur.
 * Bütün dünyada Avrupa zaten yakınlaştırmadan oynanamaz; daireler küçük kalır, büyük olsalar komşuları örterdi.
 */
const MARKER = { all: { small: 1 / 90, radius: 1 / 150 }, continent: { small: 1 / 39, radius: 1 / 65 } };

/** Yuvarlağa yakın on altı köşeli halka; ülkenin yoluna eklenir, ülkeyle birlikte boyanır ve dokunulur. */
function markerRing([cx, cy]: Point, radius: number) {
  const points = Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join("L")}z`;
}

const overlaps = (a: MapBox, b: MapBox) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Dünya haritasından Haritayı tamamla haritası: oynanan her ülke tek <path id="tr"> (birden çok parçalı ülkelerin
 * parçaları birleşir), ad noktası data-lx/ly'de. Haritanın dışındaki ülkeler kimliksiz "ctx" (soluk, dokunulmaz);
 * kıtada çerçeve Dünya antrenmanının kıta görünümüdür ve çerçevenin dışında kalan ülkeler atılır. Çok küçük ülkelere
 * (Malta, Karayip adaları…) dokunulabilir bir daire eklenir.
 */
export function countryMapMarkup(worldSvg: string, id: CountrySetId): string {
  const { codes } = setOf(id);
  const fullView = worldSvg.match(/viewBox="([^"]+)"/)?.[1]?.split(/\s+/).map(Number) ?? [0, 0, 1000, 500];
  const view: MapBox = id === "all" ? { x: fullView[0], y: fullView[1], width: fullView[2], height: fullView[3] } : CONTINENTS.find((continent) => continent.id === id)!.view;

  // Ülke → yolları; parçalı ülkelerde <g id> içindeki "mainland" sınıflı yol ad noktası için ayrılır.
  const shapes: { code: string; paths: string[]; mainland: string | null }[] = [];
  const body = worldSvg.replace(/<g id="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g, (_, code: string, inner: string) => {
    const paths = [...inner.matchAll(/<path([^>]*?) d="([^"]+)"/g)];
    shapes.push({ code, paths: paths.map((match) => match[2]), mainland: paths.find((match) => match[1].includes("mainland"))?.[2] ?? null });
    return "";
  });
  for (const [, code, d] of body.matchAll(/<path id="([^"]+)" d="([^"]+)"/g)) shapes.push({ code, paths: [d], mainland: null });

  const markerSize = id === "all" ? MARKER.all : MARKER.continent;
  const context: string[] = [];
  const played: string[] = [];
  for (const { code, paths, mainland } of shapes) {
    const rings = paths.flatMap(ringsOf);
    if (rings.length === 0 || !overlaps(boundsOf(rings), view)) continue;
    const d = paths.join("");
    if (!codes.has(code)) {
      context.push(`<path class="ctx" d="${d}"/>`);
      continue;
    }
    const [lx, ly] = labelPoint(mainland ? ringsOf(mainland) : rings);
    const box = boundsOf(mainland ? ringsOf(mainland) : rings);
    const marker = Math.max(box.width, box.height) < view.width * markerSize.small ? markerRing([lx, ly], view.width * markerSize.radius) : "";
    played.push(`<path id="${code}" data-lx="${lx.toFixed(1)}" data-ly="${ly.toFixed(1)}" d="${d}${marker}"/>`);
  }
  const viewBox = [view.x, view.y, view.width, view.height].join(" ");
  // Komşular önce çizilir: oynanan ülkelerin kenarı üstte kalır.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n${[...context, ...played].join("\n")}\n</svg>\n`;
}
