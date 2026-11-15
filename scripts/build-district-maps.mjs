// İlçe haritalarını ve ilçe adlarını üretir: node scripts/build-district-maps.mjs
//
// 1. Türkiye'nin resmî idari sınırlarını indirir: HDX "Türkiye - Subnational Administrative Boundaries" (cod-ab-tur;
//    BM OCHA, kaynak Harita Genel Komutanlığı). Lisans CC BY-IGO: atıf Kullanım Koşulları'nda.
// 2. Verideki Türkçe adlar bozuk ("Kizilcahamam", i harfinin üstünde fazladan nokta): doğru yazımlar Wikipedia'nın
//    "Districts of Turkey" sayfasındaki il tablolarından alınır ve il bazında, harf farkları yok sayılarak eşleştirilir.
//    Eşleşmeyen ilçe kalırsa betik durur.
// 3. Her il için ilçeleri sadeleştirip (mapshaper, komşu sınırlar arasında boşluk bırakmadan) public/maps/districts/
//    altına plaka numarasıyla bir SVG yazar. Her ilçe <path id="TUR006007" data-lx data-ly> olur; data-lx/ly ilçenin
//    içinde kalan, adının yazılacağı nokta.
// 4. İlçe adlarını lib/districts-data.ts'e yazar (plaka → [kod, ad]).
// 5. İl seçim kartlarındaki silüetler için il sınırlarını çok sadeleştirip tek dosyaya yazar:
//    public/maps/districts/provinces.json (plaka → [viewBox, yol]).
// 6. Açılış ekranının arkasındaki silik Türkiye haritası için ülkenin dış sınırını yazar: public/maps/turkey-outline.svg.
//
// İndirilen ham veri .cache/districts/ altında tutulur (depoya girmez); yeniden çalıştırınca tekrar indirilmez.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import mapshaper from "mapshaper";

const CACHE = ".cache/districts";
const HDX_ZIP =
  "https://data.humdata.org/dataset/d74086a0-f398-4474-9e12-1b9a70907bd0/resource/470bd810-2240-4ce0-b5c4-17434112ce41/download/tur_admin_boundaries.geojson.zip";
const WIKI =
  "https://en.wikipedia.org/w/api.php?action=parse&page=Districts_of_Turkey&prop=wikitext&format=json&formatversion=2";
const OUT_DIR = "public/maps/districts";
const DATA_FILE = "lib/districts-data.ts";
/** Sadeleştirme: noktaların yüzde kaçı kalır. Ankara'da ~20 KB, küçük ilçeler yine tanınır. */
const SIMPLIFY = "6%";
const USER_AGENT = "harita-avcisi-build/1.0 (district maps)";

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

async function download(url, target) {
  if (existsSync(target)) return;
  console.log(`İndiriliyor: ${url}`);
  const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!response.ok) fail(`${url} indirilemedi (${response.status}).`);
  writeFileSync(target, Buffer.from(await response.arrayBuffer()));
}

/** Harf farklarını (ı/i, ş/s, fazladan nokta) yok sayan karşılaştırma anahtarı. */
function key(text) {
  return text
    .replace(/̇/g, "")
    .replace(/[ıİ]/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

/** Wikipedia tablolarından il → ilçe adları. Merkez ilçe "[[Edirne|Merkez]]" gibi yazılır; adı ilin adıdır. */
function wikiDistricts(wikitext) {
  const byProvince = new Map();
  let province = null;
  for (const line of wikitext.split("\n")) {
    const heading = line.match(/^=+\s*\[\[([^\]|]+?)(?: Province)?(?:\|[^\]]*)?\]\]\s*=+/);
    if (heading) {
      province = heading[1].replace(/ Province$/, "");
      continue;
    }
    if (!province || !/^\|\s*'*\[\[/.test(line)) continue;
    const cell = line.replace(/^\|/, "").split("||")[0].trim();
    const link = cell.match(/'*\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/);
    if (!link) continue;
    let name = (link[2] ?? link[1]).trim();
    if (name === "Merkez") name = link[1].trim();
    name = name.replace(/,.*$/, "").replace(/ District$/, "");
    if (!byProvince.has(province)) byProvince.set(province, []);
    byProvince.get(province).push(name);
  }
  return byProvince;
}

/** mapshaper'ın SVG çıktısını sadeleştirir: etiket noktaları ilçenin data-lx/ly'sine taşınır, gereksiz sarmalayıcılar atılır. */
function compactSvg(svg) {
  const labels = new Map();
  for (const [, x, y, id] of svg.matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)"[^>]*id="([^"]+)"\/>/g)) labels.set(id, [x, y]);
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  // Adası olan ilçelerde (Adalar, Ayvalık…) yol fill-rule="evenodd" de taşır; korunur.
  const paths = [...svg.matchAll(/<path d="([^"]+)"([^>]*?) id="([^"]+)"\/>/g)].map(([, d, attributes, id]) => {
    const [x, y] = labels.get(id) ?? [];
    if (x === undefined) fail(`${id} için etiket noktası yok.`);
    const fillRule = attributes.includes("evenodd") ? ' fill-rule="evenodd"' : "";
    return `<path id="${id}" data-lx="${x}" data-ly="${y}"${fillRule} d="${d.replace(/\s+/g, " ").trim()}"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">\n${paths.join("\n")}\n</svg>\n`;
}

mkdirSync(CACHE, { recursive: true });
await download(HDX_ZIP, `${CACHE}/tur_admin_boundaries.geojson.zip`);
for (const level of ["tur_admin0.geojson", "tur_admin1.geojson", "tur_admin2.geojson"]) {
  if (!existsSync(`${CACHE}/${level}`)) execFileSync("unzip", ["-o", "-q", `${CACHE}/tur_admin_boundaries.geojson.zip`, level, "-d", CACHE]);
}
await download(WIKI, `${CACHE}/districts-of-turkey.json`);

const features = JSON.parse(readFileSync(`${CACHE}/tur_admin2.geojson`, "utf8")).features;
const wiki = wikiDistricts(JSON.parse(readFileSync(`${CACHE}/districts-of-turkey.json`, "utf8")).parse.wikitext);
const wikiByKey = new Map([...wiki].map(([province, names]) => [key(province), new Map(names.map((name) => [key(name), name]))]));

const byPlate = new Map();
const missing = [];
for (const feature of features) {
  const { adm1_pcode: provinceCode, adm1_name1: provinceName, adm2_pcode: id, adm2_name1: rawName } = feature.properties;
  const name = wikiByKey.get(key(provinceName))?.get(key(rawName));
  if (!name) {
    missing.push(`${provinceName} / ${rawName}`);
    continue;
  }
  const plate = Number(provinceCode.slice(3));
  if (!byPlate.has(plate)) byPlate.set(plate, []);
  byPlate.get(plate).push({ feature, id, name });
}
if (missing.length) fail(`Adı eşleşmeyen ilçeler:\n  ${missing.join("\n  ")}`);
if (byPlate.size !== 81) fail(`81 il bekleniyordu, ${byPlate.size} bulundu.`);

mkdirSync(OUT_DIR, { recursive: true });
let totalBytes = 0;
for (const [plate, districts] of [...byPlate].sort(([a], [b]) => a - b)) {
  const input = {
    "districts.json": JSON.stringify({ type: "FeatureCollection", features: districts.map(({ feature, id }) => ({ ...feature, properties: { id } })) }),
  };
  const output = await mapshaper.applyCommands(
    `-i districts.json name=districts -proj +proj=merc -simplify ${SIMPLIFY} keep-shapes -points inner + name=labels -style target=labels r=1 ` +
      `-o out.svg format=svg id-field=id width=1000 precision=0.1 target=districts,labels`,
    input,
  );
  const svg = compactSvg(output["out.svg"].toString());
  const drawn = (svg.match(/<path /g) ?? []).length;
  if (drawn !== districts.length) fail(`${plate} plakalı ilde ${districts.length} ilçe var, haritada ${drawn} çizildi.`);
  writeFileSync(`${OUT_DIR}/${plate}.svg`, svg);
  totalBytes += svg.length;
}

const lines = [...byPlate]
  .sort(([a], [b]) => a - b)
  .map(([plate, districts]) => `  ${plate}: [${districts.map(({ id, name }) => `["${id}", "${name}"]`).join(", ")}],`);
writeFileSync(
  DATA_FILE,
  `// scripts/build-district-maps.mjs üretir; elle değiştirmeyin.\n// Kaynak: HDX cod-ab-tur (BM OCHA, Harita Genel Komutanlığı), CC BY-IGO; adlar Wikipedia "Districts of Turkey".\n\n` +
    `/** Plaka → ilçeler: [harita kodu, ad]. Harita: public/maps/districts/<plaka>.svg, ilçenin <path id>'i harita kodudur. */\n` +
    `export const DISTRICTS: Record<number, [id: string, name: string][]> = {\n${lines.join("\n")}\n};\n`,
);

// İl silüetleri: kartta küçük göründükleri için %1 sadeleştirme ve tam sayı koordinatlar yeter.
const shapes = {};
for (const feature of JSON.parse(readFileSync(`${CACHE}/tur_admin1.geojson`, "utf8")).features) {
  const plate = Number(feature.properties.adm1_pcode.slice(3));
  const output = await mapshaper.applyCommands("-i province.json -proj +proj=merc -simplify 1% keep-shapes -o out.svg format=svg width=100 precision=1", {
    "province.json": JSON.stringify({ type: "FeatureCollection", features: [{ ...feature, properties: {} }] }),
  });
  const svg = output["out.svg"].toString();
  const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1];
  const d = [...svg.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1].replace(/\s+/g, " ").trim()).join(" ");
  if (!viewBox || !d) fail(`${plate} plakalı ilin silüeti üretilemedi.`);
  shapes[plate] = [viewBox, d];
}
if (Object.keys(shapes).length !== 81) fail(`81 il silüeti bekleniyordu, ${Object.keys(shapes).length} üretildi.`);
const shapesJson = JSON.stringify(shapes);
writeFileSync(`${OUT_DIR}/provinces.json`, shapesJson);

// Türkiye'nin dış sınırı: açılış ekranında silik ve büyük görünür; %0,5 sadeleştirme yeter.
const outline = await mapshaper.applyCommands("-i tr.json -proj +proj=merc -simplify 0.5% keep-shapes -o out.svg format=svg width=1000 precision=1", {
  "tr.json": readFileSync(`${CACHE}/tur_admin0.geojson`, "utf8"),
});
const outlineSvg = outline["out.svg"].toString();
const outlineViewBox = outlineSvg.match(/viewBox="([^"]+)"/)?.[1];
const outlinePath = [...outlineSvg.matchAll(/<path d="([^"]+)"/g)].map((match) => match[1].replace(/\s+/g, " ").trim()).join(" ");
if (!outlineViewBox || !outlinePath) fail("Türkiye'nin dış sınırı üretilemedi.");
writeFileSync(
  "public/maps/turkey-outline.svg",
  // Açık genişlik ve yükseklik: CSS maskesi olarak kullanılınca tarayıcı varsayılan 2:1 oranına düşmesin.
  `<svg xmlns="http://www.w3.org/2000/svg" width="${outlineViewBox.split(" ")[2]}" height="${outlineViewBox.split(" ")[3]}" viewBox="${outlineViewBox}"><path fill-rule="evenodd" d="${outlinePath}"/></svg>\n`,
);

console.log(`✓ ${byPlate.size} il, ${features.length} ilçe; il silüetleri ${(shapesJson.length / 1024).toFixed(0)} KB; ${OUT_DIR}/ toplam ${(totalBytes / 1024).toFixed(0)} KB; ${DATA_FILE}`);
