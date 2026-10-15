"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { boardVariantFor, MOST_MISSED_LIMIT, type LocationStat, type PlayChoice } from "@/lib/game";

type MostMissedOptions = {
  choice: PlayChoice;
  /** Verilirse yalnızca bu yerler arasından seçilir (ör. kıta antrenmanı); verilmezse sıralamanın tamamı. */
  locationIds: readonly string[] | null;
  /** Her turda yeniden çekilsin diye turun kimliği. */
  roundId: number;
  enabled: boolean;
};

/** Bir modda istatistiği olan yer sayısı en fazla haritadaki ülke sayısı kadar; hepsi tek istekte gelir. */
const STATS_FETCH_LIMIT = 250;

/**
 * Yanlış oranının güvenilir alt sınırı (Wilson, %95). Yalnızca orana göre sıralanınca bir kez sorulup bir kez yanlış
 * bilinen yer (1/1, %100), yedi kez sorulup altısında yanlış bilinen yerin (6/7, %86) önüne geçiyordu; az sorulan yerin
 * oranı tesadüf olabilir. Bu sınır az sorulan yeri geri iter: 1/1 → 0,21, 3/3 → 0,44, 6/7 → 0,49.
 */
function wilsonLowerBound(wrong: number, asked: number): number {
  if (asked === 0) return 0;
  const z = 1.96;
  const rate = wrong / asked;
  const zz = z * z;
  return (rate + zz / (2 * asked) - z * Math.sqrt((rate * (1 - rate)) / asked + zz / (4 * asked * asked))) / (1 + zz / asked);
}

/**
 * Tüm oyuncuların yarış turlarında o sıralamada en çok yanlış cevapladığı yerler. Sıralama tarayıcıda yapılır: modun
 * bütün istatistikleri çekilir, yanlış oranının güvenilir alt sınırına göre dizilir.
 * `undefined`: yükleniyor, `null`: yüklenemedi.
 */
export function useMostMissed({ choice, locationIds, roundId, enabled }: MostMissedOptions): LocationStat[] | null | undefined {
  const [loaded, setLoaded] = useState<{ key: string; stats: LocationStat[] | null } | null>(null);
  const { mode } = choice;
  const variant = boardVariantFor(choice);
  const locationIdsKey = locationIds?.join(",") ?? "";
  // Tur, mod ya da havuz değişince eski liste gösterilmez; yenisi gelene kadar "yükleniyor" döner.
  const key = `${roundId}|${mode}|${variant}|${locationIdsKey}`;

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let isActive = true;
    let query = supabase
      .from("location_stats")
      .select("location_id, asked, wrong, wrong_rate, most_confused_with, confused_count")
      .eq("game_mode", mode)
      .eq("variant", variant);
    if (locationIdsKey) query = query.in("location_id", locationIdsKey.split(","));

    void Promise.resolve(query.limit(STATS_FETCH_LIMIT)).then(
      ({ data, error }) => {
        if (!isActive) return;
        if (error) return setLoaded({ key, stats: null });
        const ranked = ((data ?? []) as LocationStat[])
          .map((stat) => ({ stat, score: wilsonLowerBound(stat.wrong, stat.asked) }))
          .sort((a, b) => b.score - a.score || b.stat.wrong - a.stat.wrong)
          .slice(0, MOST_MISSED_LIMIT)
          .map(({ stat }) => stat);
        setLoaded({ key, stats: ranked });
      },
      () => {
        if (isActive) setLoaded({ key, stats: null });
      },
    );
    return () => {
      isActive = false;
    };
  }, [enabled, key, locationIdsKey, mode, variant]);

  return loaded?.key === key ? loaded.stats : undefined;
}
