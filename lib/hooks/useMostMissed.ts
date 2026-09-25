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

/**
 * Tüm oyuncuların yarış turlarında o sıralamada en çok yanlış cevapladığı yerler.
 * `undefined`: yükleniyor, `null`: yüklenemedi.
 */
export function useMostMissed({ choice, locationIds, roundId, enabled }: MostMissedOptions): LocationStat[] | null | undefined {
  const [loaded, setLoaded] = useState<{ roundId: number; stats: LocationStat[] | null } | null>(null);
  const { mode } = choice;
  const variant = boardVariantFor(choice);
  const locationIdsKey = locationIds?.join(",") ?? "";

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

    void Promise.resolve(
      query
        .order("wrong_rate", { ascending: false })
        .order("wrong", { ascending: false })
        .order("asked", { ascending: false })
        .limit(MOST_MISSED_LIMIT),
    ).then(
      ({ data, error }) => {
        if (isActive) setLoaded({ roundId, stats: error ? null : ((data ?? []) as LocationStat[]) });
      },
      () => {
        if (isActive) setLoaded({ roundId, stats: null });
      },
    );
    return () => {
      isActive = false;
    };
  }, [enabled, locationIdsKey, mode, roundId, variant]);

  return loaded?.roundId === roundId ? loaded.stats : undefined;
}
