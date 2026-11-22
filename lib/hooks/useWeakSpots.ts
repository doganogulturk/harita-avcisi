"use client";

import { useEffect, useState } from "react";
import { boardVariantFor, WEAK_SPOTS_LIMIT, type PlayChoice, type Player, type WeakSpot } from "@/lib/game";
import { getSupabaseClient } from "@/lib/supabase";

type WeakSpotsOptions = {
  player: Player | null;
  /** Hangi mod için (harita ve soru tipi); kıta ya da günlük bilgisi yok sayılır. */
  choice: PlayChoice;
  /** Her turda yeniden çekilsin diye turun kimliği. */
  roundId: number;
  enabled: boolean;
};

/**
 * Giriş yapmış oyuncunun bir moddaki zayıf yerleri (my_weak_spots, supabase/schema.sql): oyuncunun kendi cevaplarından,
 * en çok yanlış yaptığı yerler. Giriş yoksa istek atılmaz. `undefined` yükleniyor, `null` yüklenemedi ya da giriş yok.
 * Sunucuda bu fonksiyon henüz yoksa (geçiş SQL'i çalıştırılmadan yayına girildiyse) `null` döner; arayüz bölümü göstermez.
 */
export function useWeakSpots({ player, choice, roundId, enabled }: WeakSpotsOptions): WeakSpot[] | null | undefined {
  const [loaded, setLoaded] = useState<{ key: string; spots: WeakSpot[] | null } | null>(null);
  const playerId = player?.id;
  const { mode } = choice;
  const variant = boardVariantFor(choice);
  // Tur, mod ya da oyuncu değişince eski liste gösterilmez; yenisi gelene kadar "yükleniyor" döner.
  const key = `${playerId}|${roundId}|${mode}|${variant}`;

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!enabled || !playerId || !supabase) return;

    let isActive = true;
    void Promise.resolve(supabase.rpc("my_weak_spots", { p_game_mode: mode, p_variant: variant, p_limit: WEAK_SPOTS_LIMIT })).then(
      ({ data, error }) => {
        if (isActive) setLoaded({ key, spots: error || !Array.isArray(data) ? null : (data as WeakSpot[]) });
      },
      () => {
        if (isActive) setLoaded({ key, spots: null });
      },
    );
    return () => {
      isActive = false;
    };
  }, [enabled, key, mode, playerId, variant]);

  if (!playerId) return null;
  return loaded?.key === key ? loaded.spots : undefined;
}
