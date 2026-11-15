// İller oyununun ("Haritayı tamamla") haritalarını üretir: node scripts/build-province-maps.mjs
//
// Kaynak, ilçe haritalarınınkiyle aynı: HDX cod-ab-tur il sınırları (CC BY-IGO). Ham veri .cache/districts/ altındadır;
// yoksa önce `npm run maps:districts` çalıştırılır (indirir ve açar).
//
// 1. public/maps/provinces/<set>.svg: "all" (81 il) ve yedi bölge (lib/turkish-regions.ts). Oynanan her il
//    <path id="TUR034" data-lx data-ly> olur; data-lx/ly ilin içinde kalan, adının yazılacağı nokta. Bölge haritalarında
//    komşu iller yön bulmak için soluk görünür: <path class="ctx"> (kimliksiz, dokunulmaz). Harita bölgeye odaklanır;
//    komşular bölgenin biraz genişletilmiş çerçevesine kırpılır. Bütün iller birlikte sadeleşir, sınırlar boşluksuz
//    örtüşür.
// 2. public/maps/provinces/regions.json: seçim kartlarının silüetleri. Ortak çerçevede Türkiye'nin dış sınırı ve her
//    bölgenin birleşik sınırı: { viewBox, outline, regions: { marmara: d, … } }.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import mapshaper from "mapshaper";
import { REGIONS } from "../lib/turkish-regions.ts";

const SOURCE = ".cache/districts/tur_admin1.geojson";
const OUT_DIR = "public/maps/provinces";
/**
 * Sadeleştirme aralığı (Mercator metresi): 1000 birimlik genişlikte bütün Türkiye'de bir birim ~2 km, bölgelerde ~0,5 km.
 * Aralık bir iki birim kadar: ekranda fark edilmez, dosyalar küçük kalır (kaynak kıyılarda çok ayrıntılı).
 */
const SIMPLIFY = { all: "interval=2500", region: "interval=900" };
/** Bölge çerçevesinin her yandan genişlemesi (bölgenin boyunun oranı): komşulardan bir şerit görünsün. */
const MARGIN = 0.12;

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

if (!existsSync(SOURCE)) fail(`${SOURCE} yok; önce "npm run maps:districts" çalıştırın.`);
const features = JSON.parse(readFileSync(SOURCE, "utf8")).features.map((feature) => ({
  ...feature,
  properties: { id: feature.properties.adm1_pcode, plate: Number(feature.properties.adm1_pcode.slice(3)) },
}));
if (features.length !== 81) fail(`81 il bekleniyordu, ${features.length} bulundu.`);

/** GeoJSON geometrisinin boylam/enlem sınırları. */
function bounds(geometries) {
  let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
  const visit = (coordinates) => {
    if (typeof coordinates[0] === "number") {
      minX = Math.min(minX, coordinates[0]);
      maxX = Math.max(maxX, coordinates[0]);
      minY = Math.min(minY, coordinates[1]);
      maxY = Math.max(maxY, coordinates[1]);
    } else coordinates.forEach(visit);
  };
  geometries.forEach((geometry) => visit(geometry.coordinates));
  return [minX, minY, maxX, maxY];
}

/** mapshaper'ın SVG çıktısı: oynanan iller kimlik ve ad noktasıyla, komşular "ctx" sınıfıyla; sarmalayıcılar atılır. */
function compactSvg(svg, playable) {
  const labels = new Map();
  for (const [, x, y, id] of svg.matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)"[^>]*id="([^"]+)"\/>/g)) labels.set(id, [x, y]);
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  const context = [];
  const played = [];
  for (const [, d, attributes, id] of svg.matchAll(/<path d="([^"]+)"([^>]*?) id="([^"]+)"\/>/g)) {
    const fillRule = attributes.includes("evenodd") ? ' fill-rule="evenodd"' : "";
    const path = d.replace(/\s+/g, " ").trim();
    if (!playable.has(id)) {
      context.push(`<path class="ctx"${fillRule} d="${path}"/>`);
      continue;
    }
    const [x, y] = labels.get(id) ?? [];
    if (x === undefined) fail(`${id} için etiket noktası yok.`);
    played.push(`<path id="${id}" data-lx="${x}" data-ly="${y}"${fillRule} d="${path}"/>`);
  }
  // Komşular önce çizilir: oynanan illerin kenarı üstte kalır.
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n${[...context, ...played].join("\n")}\n</svg>\n`, count: played.length };
}

async function buildMap(name, plates) {
  const playable = new Set(features.filter((feature) => plates.includes(feature.properties.plate)).map((feature) => feature.properties.id));
  let clip = "";
  if (plates.length < 81) {
    const [minX, minY, maxX, maxY] = bounds(features.filter((feature) => playable.has(feature.properties.id)).map((feature) => feature.geometry));
    const margin = Math.max(maxX - minX, maxY - minY) * MARGIN;
    clip = `-clip bbox=${minX - margin},${minY - margin},${maxX + margin},${maxY + margin} `;
  }
  const output = await mapshaper.applyCommands(
    `-i provinces.json name=provinces ${clip}-proj +proj=merc -simplify ${plates.length < 81 ? SIMPLIFY.region : SIMPLIFY.all} keep-shapes ` +
      `-filter '${JSON.stringify([...playable])}.includes(id)' + name=played -points target=played inner + name=labels -style target=labels r=1 ` +
      `-o out.svg format=svg id-field=id width=1000 precision=0.1 target=provinces,labels`,
    { "provinces.json": JSON.stringify({ type: "FeatureCollection", features }) },
  );
  const { svg, count } = compactSvg(output["out.svg"].toString(), playable);
  if (count !== plates.length) fail(`${name}: ${plates.length} il bekleniyordu, haritada ${count} çizildi.`);
  writeFileSync(`${OUT_DIR}/${name}.svg`, svg);
  return svg.length;
}

mkdirSync(OUT_DIR, { recursive: true });
const sizes = { all: await buildMap("all", features.map((feature) => feature.properties.plate)) };
for (const region of REGIONS) sizes[region.id] = await buildMap(region.id, region.plates);

// Kart silüetleri: bölgeler birleşik, Türkiye'nin dış sınırıyla aynı çerçevede; kartta küçük göründükleri için kaba.
const regionOf = new Map(REGIONS.flatMap((region) => region.plates.map((plate) => [plate, region.id])));
const silhouettes = await mapshaper.applyCommands(
  "-i provinces.json name=provinces -proj +proj=merc -simplify 1% keep-shapes " +
    "-dissolve region + name=regions -dissolve target=provinces + name=outline " +
    "-o out.svg format=svg id-field=region width=200 precision=1 target=outline,regions",
  {
    "provinces.json": JSON.stringify({
      type: "FeatureCollection",
      features: features.map((feature) => ({ ...feature, properties: { region: regionOf.get(feature.properties.plate) } })),
    }),
  },
);
const silhouetteSvg = silhouettes["out.svg"].toString();
const viewBox = silhouetteSvg.match(/viewBox="([^"]+)"/)?.[1];
const pathsOf = (pattern) => [...silhouetteSvg.matchAll(pattern)].map((match) => match.slice(1));
const regions = Object.fromEntries(pathsOf(/<path d="([^"]+)"[^>]*? id="([^"]+)"\/>/g).map(([d, id]) => [id, d.replace(/\s+/g, " ").trim()]));
const outline = pathsOf(/<g id="outline"[^>]*>\s*<path d="([^"]+)"/g)[0]?.[0] ?? pathsOf(/<path d="([^"]+)"(?![^>]*id=)[^>]*\/>/g)[0]?.[0];
if (!viewBox || !outline || Object.keys(regions).length !== 7) fail("Kart silüetleri üretilemedi.");
const regionsJson = JSON.stringify({ viewBox, outline: outline.replace(/\s+/g, " ").trim(), regions });
writeFileSync(`${OUT_DIR}/regions.json`, regionsJson);

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
console.log(`✓ ${Object.entries(sizes).map(([name, bytes]) => `${name} ${kb(bytes)}`).join(", ")}; regions.json ${kb(regionsJson.length)}`);
