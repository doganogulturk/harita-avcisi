"use client";

import { useEffect, useState } from "react";
import { type DuelRule } from "@/lib/duel";
import { type BoardVariant, type GameMode, type Player } from "@/lib/game";
import { getSupabaseClient } from "@/lib/supabase";

/** Bir sıralamada oyuncunun en iyi sonucu ve sırası. */
export type ProfileBoard = { game_mode: GameMode; variant: BoardVariant; score: number; duration_ms: number; rank: number; players: number };

export type DuelResultKind = "win" | "loss" | "draw";

/** Bitmiş bir düello, oyuncunun gözünden: rakip, mod, skor ve sonuç. */
export type ProfileDuel = {
  opponent_name: string | null;
  opponent_avatar: string | null;
  game_mode: GameMode;
  variant: BoardVariant;
  rule: DuelRule;
  my_score: number;
  opponent_score: number;
  result: DuelResultKind;
  finish_reason: "completed" | "forfeit" | null;
  finished_at: string;
};

export type ProfileRound = { game_mode: GameMode; variant: BoardVariant; score: number; duration_ms: number; created_at: string; in_room: boolean };

/** Sunucudaki my_profile fonksiyonunun döndürdüğü veri (supabase/schema.sql). */
export type Profile = {
  is_guest: boolean;
  first_played_at: string | null;
  summary: { rounds: number; answered: number; correct: number; best_streak: number; play_days: number };
  boards: ProfileBoard[];
  recent: ProfileRound[];
  duels: { played: number; wins: number; losses: number; draws: number };
  /** Son 100 düello, yeniden eskiye. */
  duel_history: ProfileDuel[];
};

/**
 * Giriş yapmış oyuncunun profil verisi; sayfa açılınca bir kez çekilir. `undefined` yükleniyor, `null` yüklenemedi.
 * Giriş yoksa istek atılmaz.
 */
export function useProfile(player: Player | null) {
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const playerId = player?.id;

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!playerId || !supabase) return;
    let isActive = true;
    void Promise.resolve(supabase.rpc("my_profile")).then(
      ({ data, error }) => {
        if (isActive) setProfile(error || !data ? null : (data as Profile));
      },
      () => {
        if (isActive) setProfile(null);
      },
    );
    return () => {
      isActive = false;
    };
  }, [playerId]);

  return profile;
}
