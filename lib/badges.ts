"use client";

import { useEffect, useState } from "react";
import { type Player } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { getSupabaseClient } from "@/lib/supabase";

/** Rozet grupları, profildeki sırayla; her grubun rozetleri kademe sırasıyla dizilir (3 → 7 → 30 gün). */
export const BADGE_GROUPS = [
  { id: "streak", get title() { return messages().badges.groups.streak; } },
  { id: "daily", get title() { return messages().badges.groups.daily; } },
  { id: "perfect", get title() { return messages().badges.groups.perfect; } },
  { id: "map", get title() { return messages().badges.groups.map; } },
  { id: "duel", get title() { return messages().badges.groups.duel; } },
  { id: "rank", get title() { return messages().badges.groups.rank; } },
] as const;

/**
 * Rozetler: oyuncunun başarıları. Hangisinin kazanıldığını ve ilerlemeyi sunucu hesaplar (my_badges, supabase/schema.sql);
 * simgeleri burada, adları ve açıklamaları sözlüklerde (lib/i18n). Sıra profildeki sıradır.
 */
export const BADGES = [
  { id: "streak_3", group: "streak", emoji: "🔥", get title() { return messages().badges.items.streak_3.title; }, get description() { return messages().badges.items.streak_3.description; } },
  { id: "streak_7", group: "streak", emoji: "🔥", get title() { return messages().badges.items.streak_7.title; }, get description() { return messages().badges.items.streak_7.description; } },
  { id: "streak_30", group: "streak", emoji: "🔥", get title() { return messages().badges.items.streak_30.title; }, get description() { return messages().badges.items.streak_30.description; } },
  { id: "daily_first", group: "daily", emoji: "🗓", get title() { return messages().badges.items.daily_first.title; }, get description() { return messages().badges.items.daily_first.description; } },
  { id: "daily_full", group: "daily", emoji: "🌟", get title() { return messages().badges.items.daily_full.title; }, get description() { return messages().badges.items.daily_full.description; } },
  { id: "perfect_turkey", group: "perfect", emoji: "🇹🇷", get title() { return messages().badges.items.perfect_turkey.title; }, get description() { return messages().badges.items.perfect_turkey.description; } },
  { id: "perfect_plates", group: "perfect", emoji: "🚗", get title() { return messages().badges.items.perfect_plates.title; }, get description() { return messages().badges.items.perfect_plates.description; } },
  { id: "perfect_world", group: "perfect", emoji: "🌍", get title() { return messages().badges.items.perfect_world.title; }, get description() { return messages().badges.items.perfect_world.description; } },
  { id: "perfect_flags", group: "perfect", emoji: "🏳️", get title() { return messages().badges.items.perfect_flags.title; }, get description() { return messages().badges.items.perfect_flags.description; } },
  { id: "perfect_capitals", group: "perfect", emoji: "🏛️", get title() { return messages().badges.items.perfect_capitals.title; }, get description() { return messages().badges.items.perfect_capitals.description; } },
  { id: "lightning", group: "perfect", emoji: "⚡", get title() { return messages().badges.items.lightning.title; }, get description() { return messages().badges.items.lightning.description; } },
  { id: "provinces_81", group: "map", emoji: "🗺️", get title() { return messages().badges.items.provinces_81.title; }, get description() { return messages().badges.items.provinces_81.description; } },
  { id: "countries_100", group: "map", emoji: "🧭", get title() { return messages().badges.items.countries_100.title; }, get description() { return messages().badges.items.countries_100.description; } },
  { id: "duel_first_win", group: "duel", emoji: "⚔️", get title() { return messages().badges.items.duel_first_win.title; }, get description() { return messages().badges.items.duel_first_win.description; } },
  { id: "duel_10_wins", group: "duel", emoji: "🏅", get title() { return messages().badges.items.duel_10_wins.title; }, get description() { return messages().badges.items.duel_10_wins.description; } },
  { id: "podium", group: "rank", emoji: "🥉", get title() { return messages().badges.items.podium.title; }, get description() { return messages().badges.items.podium.description; } },
  { id: "summit", group: "rank", emoji: "🏆", get title() { return messages().badges.items.summit.title; }, get description() { return messages().badges.items.summit.description; } },
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
