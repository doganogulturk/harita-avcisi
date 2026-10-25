"use client";

import { useEffect, useState } from "react";
import { type Player } from "@/lib/game";
import { getSupabaseClient } from "@/lib/supabase";

/** Rozet grupları, profildeki sırayla; her grubun rozetleri kademe sırasıyla dizilir (3 → 7 → 30 gün). */
export const BADGE_GROUPS = [
  { id: "streak", title: "Gün serisi" },
  { id: "daily", title: "Günlük meydan okuma" },
  { id: "perfect", title: "Kusursuz tur" },
  { id: "map", title: "Harita ustalığı" },
  { id: "duel", title: "Düello" },
  { id: "rank", title: "Sıralama" },
] as const;

/**
 * Rozetler: oyuncunun başarıları. Hangisinin kazanıldığını ve ilerlemeyi sunucu hesaplar (my_badges, supabase/schema.sql);
 * adları, simgeleri ve açıklamaları burada. Sıra profildeki sıradır.
 */
export const BADGES = [
  { id: "streak_3", group: "streak", emoji: "🔥", title: "3 günlük seri", description: "Üç gün üst üste günlük meydan okuma bitir." },
  { id: "streak_7", group: "streak", emoji: "🔥", title: "7 günlük seri", description: "Yedi gün üst üste günlük meydan okuma bitir." },
  { id: "streak_30", group: "streak", emoji: "🔥", title: "30 günlük seri", description: "Otuz gün üst üste günlük meydan okuma bitir." },
  { id: "daily_first", group: "daily", emoji: "🗓", title: "İlk meydan okuma", description: "Bir günlük meydan okumayı bitir." },
  { id: "daily_full", group: "daily", emoji: "🌟", title: "Tam gün", description: "Aynı gün dört meydan okumanın hepsini bitir." },
  { id: "perfect_turkey", group: "perfect", emoji: "🇹🇷", title: "Türkiye'de 10/10", description: "Türkiye yarışında hepsini bil." },
  { id: "perfect_plates", group: "perfect", emoji: "🚗", title: "Plakada 10/10", description: "Plaka yarışında hepsini bil." },
  { id: "perfect_world", group: "perfect", emoji: "🌍", title: "Dünya'da 10/10", description: "Dünya yarışında hepsini bil." },
  { id: "perfect_flags", group: "perfect", emoji: "🏳️", title: "Bayrakta 10/10", description: "Bayrak yarışında hepsini bil." },
  { id: "lightning", group: "perfect", emoji: "⚡", title: "Şimşek", description: "Bir yarışta 45 saniyenin altında 10/10 yap." },
  { id: "provinces_81", group: "map", emoji: "🗺️", title: "81 il", description: "Yarışlarda her ili en az bir kez doğru bil." },
  { id: "countries_100", group: "map", emoji: "🧭", title: "100 ülke", description: "Yarışlarda 100 farklı ülkeyi doğru bil." },
  { id: "duel_first_win", group: "duel", emoji: "⚔️", title: "İlk galibiyet", description: "Bir düello kazan." },
  { id: "duel_10_wins", group: "duel", emoji: "🏅", title: "10 galibiyet", description: "On düello kazan." },
  { id: "podium", group: "rank", emoji: "🥉", title: "Kürsü", description: "Herhangi bir sıralamada ilk üçe gir." },
  { id: "summit", group: "rank", emoji: "🏆", title: "Zirve", description: "Herhangi bir sıralamada birinci ol." },
] as const;

export type BadgeId = (typeof BADGES)[number]["id"];
export type BadgeInfo = (typeof BADGES)[number];

/** Sunucunun döndürdüğü durum: ilerleme, hedef, kazanılma tarihi ve bu çağrıda yeni kazanıldı mı. */
export type BadgeState = { id: BadgeId; progress: number; goal: number; earned_at: string | null; is_new: boolean };

export const badgeInfo = (id: string): BadgeInfo | undefined => BADGES.find((badge) => badge.id === id);

/**
 * Oyuncunun rozetlerini çeker; hedefe ulaşılan rozetler bu çağrıda verilir (is_new). Giriş yoksa ya da yüklenemezse null.
 */
export async function fetchBadges(): Promise<BadgeState[] | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("my_badges");
    return error || !Array.isArray(data) ? null : (data as BadgeState[]);
  } catch {
    return null;
  }
}

/** Profil için rozetler; sayfa açılınca bir kez çekilir. `undefined` yükleniyor, `null` yüklenemedi. */
export function useBadges(player: Player | null) {
  const [badges, setBadges] = useState<BadgeState[] | null | undefined>(undefined);
  const playerId = player?.id;

  useEffect(() => {
    if (!playerId) return;
    let isActive = true;
    void fetchBadges().then((loaded) => {
      if (isActive) setBadges(loaded);
    });
    return () => {
      isActive = false;
    };
  }, [playerId]);

  return badges;
}

/**
 * Tur kaydedildikten sonra yeni kazanılan rozetler (sonuç ekranındaki kutlama). `isSaved` doğru olunca bir kez çekilir.
 */
export function useNewBadges(isSaved: boolean) {
  const [badges, setBadges] = useState<BadgeInfo[]>([]);

  useEffect(() => {
    if (!isSaved) return;
    let isActive = true;
    void fetchBadges().then((loaded) => {
      if (!isActive || !loaded) return;
      setBadges(loaded.filter((badge) => badge.is_new).flatMap((badge) => badgeInfo(badge.id) ?? []));
    });
    return () => {
      isActive = false;
    };
  }, [isSaved]);

  return badges;
}
