import { DISTRICTS } from "@/lib/districts-data";
import { compareTr } from "@/lib/map-puzzle";
import { provinces } from "@/lib/turkish-plates";
import { regionOf, type RegionId } from "@/lib/turkish-regions";

export type Difficulty = "easy" | "medium" | "hard";

/** Zorluk ilçe sayısından: 3–8 kolay, 9–14 orta, 15 ve üstü zor (81 il aşağı yukarı üçe bölünür). */
export function difficultyOf(count: number): Difficulty {
  if (count <= 8) return "easy";
  if (count <= 14) return "medium";
  return "hard";
}

export type District = { id: string; name: string };


/** İlin ilçeleri, adlarına göre alfabetik. */
export function districtsOf(plate: number): District[] {
  return (DISTRICTS[plate] ?? []).map(([id, name]) => ({ id, name })).sort((a, b) => compareTr(a.name, b.name));
}

export type DistrictProvince = { plate: number; name: string; count: number; region: RegionId; difficulty: Difficulty };

/** İlçe oyununda seçilebilen iller, adlarına göre alfabetik; ilçe sayısı, bölgesi ve zorluğuyla. */
export const DISTRICT_PROVINCES: DistrictProvince[] = provinces
  .map((province) => {
    const count = DISTRICTS[province.plate]?.length ?? 0;
    return { plate: province.plate, name: province.city, count, region: regionOf(province.plate), difficulty: difficultyOf(count) };
  })
  .filter((province) => province.count > 0)
  .sort((a, b) => compareTr(a.name, b.name));

/** İl seçim kartlarının silüetleri: plaka → [viewBox, yol] (scripts/build-district-maps.mjs üretir). */
export const PROVINCE_SHAPES_URL = "/maps/districts/provinces.json";

/** İlin ilçe haritası (scripts/build-district-maps.mjs üretir). */
export const districtMapUrl = (plate: number) => `/maps/districts/${plate}.svg`;
