/** Haritayı tamamla oyunlarının (İller, İlçeler) ortak kuralları. */

/** Yanlış eşleştirmenin süreye eklediği ceza. */
export const MAP_PENALTY_SECONDS = 5;

/** Türkçe alfabe sırası (Ç, Ş, Ü yerlerinde). */
export const compareTr = (a: string, b: string) => a.localeCompare(b, "tr");

/**
 * Turun yıldızı için puan: hatasız tur tam puan; her hata bir eksik. RoundCelebration'daki oranla yıldıza çevrilir
 * (kusursuz 3, %70 2, %40 1).
 */
export function mapPuzzleScore(total: number, mistakes: number) {
  return Math.max(0, total - mistakes);
}
