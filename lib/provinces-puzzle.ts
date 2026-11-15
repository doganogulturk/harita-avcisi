import { compareTr } from "@/lib/map-puzzle";
import { provinces } from "@/lib/turkish-plates";
import { REGIONS, type RegionId } from "@/lib/turkish-regions";

/** İller oyununun haritaları: bütün Türkiye ya da bir coğrafi bölge. */
export type ProvinceSetId = "all" | RegionId;

export type ProvinceSet = { id: ProvinceSetId; plates: number[] };

/** Seçim sırası: önce bütün Türkiye, sonra bölgeler (lib/turkish-regions.ts sırasıyla). */
export const PROVINCE_SETS: ProvinceSet[] = [{ id: "all", plates: provinces.map((province) => province.plate) }, ...REGIONS];

const NAME_BY_PLATE = new Map(provinces.map((province) => [province.plate, province.city]));

/** Haritadaki ilin kimliği: kaynağın il kodu (TUR034); public/maps/provinces/*.svg'deki <path id>. */
export const provinceMapId = (plate: number) => `TUR${String(plate).padStart(3, "0")}`;

/** Haritanın illeri, adlarına göre alfabetik. */
export function provincesOf(id: ProvinceSetId) {
  const set = PROVINCE_SETS.find((candidate) => candidate.id === id);
  if (!set) throw new Error(`Bilinmeyen il haritası: ${id}`);
  return set.plates.map((plate) => ({ id: provinceMapId(plate), name: NAME_BY_PLATE.get(plate) ?? String(plate) })).sort((a, b) => compareTr(a.name, b.name));
}

/** Haritanın SVG'si (scripts/build-province-maps.mjs üretir). */
export const provinceMapUrl = (id: ProvinceSetId) => `/maps/provinces/${id}.svg`;

/** Seçim kartlarının silüetleri: Türkiye'nin dış sınırı ve bölgeler, ortak çerçevede (scripts/build-province-maps.mjs). */
export const REGION_SHAPES_URL = "/maps/provinces/regions.json";
