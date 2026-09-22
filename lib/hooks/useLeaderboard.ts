"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { BOARDS, boardIdFor, boardVariantFor, LEADERBOARD_LIMIT, type BoardId, type LeaderboardEntry, type PlayChoice, type Player } from "@/lib/game";

type FinishedRound = {
  player: Player | null;
  /** Her yeni turda artan kimlik; aynı tur sonucunun iki kez kaydedilmesini önler. */
  roundId: number;
  isFinished: boolean;
  choice: PlayChoice;
  score: number;
  durationMs: number;
  bestStreak: number;
};

export type Leaderboards = Record<BoardId, LeaderboardEntry[]>;

const EMPTY_LEADERBOARDS: Leaderboards = { turkey: [], world: [], "world-hard": [], "world-flags": [] };

// Supabase aynı adlı kanalı yeniden kullanır; kapanmakta olan eski kanala dinleyici eklenmesin diye her abonelik ayrı adla açılır.
let channelSequence = 0;

/** Tüm sıralamaları tek seferde çeker. Herhangi biri başarısız olursa null döner. */
async function fetchLeaderboards(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>): Promise<Leaderboards | null> {
  const results = await Promise.all(
    BOARDS.map((board) =>
      supabase
        .from("leaderboard")
        .select("user_id, display_name, avatar_url, score, duration_ms, best_streak")
        .eq("game_mode", board.mode)
        .eq("variant", board.variant)
        .order("score", { ascending: false })
        .order("duration_ms", { ascending: true })
        .order("best_streak", { ascending: false })
        .limit(LEADERBOARD_LIMIT),
    ),
  );
  if (results.some((result) => result.error)) return null;
  return BOARDS.reduce((all, board, index) => ({ ...all, [board.id]: results[index].data ?? [] }), {} as Leaderboards);
}

/** Yeni sonuçlar geldikçe `reload`'u çağıran bir realtime kanalı açar. */
function subscribeToResults(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>, name: string, reload: () => void) {
  return supabase
    .channel(`${name}-${++channelSequence}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "game_results" }, reload)
    .subscribe();
}

/**
 * Giriş ekranındaki sıralama paneli. Tur oynamadan da okunabilir; panel açıkken sıralamaları
 * çeker ve realtime ile canlı tutar, kapanınca aboneliği bırakır.
 */
export function useLeaderboards(isOpen: boolean) {
  const [leaderboards, setLeaderboards] = useState<Leaderboards>(EMPTY_LEADERBOARDS);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let isActive = true;
    const load = async () => {
      const loaded = await fetchLeaderboards(supabase);
      if (!isActive) return;
      if (!loaded) return setLeaderboardError("Sıralama yüklenemedi. Lütfen tekrar deneyin.");
      setLeaderboardError(null);
      setLeaderboards(loaded);
    };

    void load();
    const channel = subscribeToResults(supabase, "intro-leaderboard", () => { void load(); });
    return () => {
      isActive = false;
      void supabase.removeChannel(channel);
    };
  }, [isOpen]);

  // Başarılı her yükleme yeni bir nesne atar; boş sonuç da "yüklendi" sayılır.
  return { leaderboards, leaderboardError, isLoading: leaderboards === EMPTY_LEADERBOARDS && leaderboardError === null };
}

/** Tur bitince sonucu kaydeder, tüm sıralamaları çeker ve realtime güncellemelere abone olur. */
export function useLeaderboard({ player, roundId, isFinished, choice, score, durationMs, bestStreak }: FinishedRound) {
  const [leaderboards, setLeaderboards] = useState<Leaderboards>(EMPTY_LEADERBOARDS);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  // Effect yeniden çalışsa da (StrictMode, oturum yenilenmesi) tur başına tek kayıt; yeniden çalışan effect aynı kaydı bekler.
  const save = useRef<{ roundId: number; succeeded: Promise<boolean> } | null>(null);

  const { mode } = choice;
  const variant = boardVariantFor(choice);

  useEffect(() => {
    if (!isFinished || !player) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let isActive = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;

    const loadLeaderboards = async () => {
      const loaded = await fetchLeaderboards(supabase);
      if (!isActive) return;
      if (!loaded) return setLeaderboardError("Sıralama yüklenemedi. Lütfen tekrar deneyin.");
      setLeaderboards(loaded);
    };

    const saveResultAndLoadLeaderboards = async () => {
      if (save.current?.roundId !== roundId) {
        const insert = supabase.from("game_results").insert({
          user_id: player.id,
          display_name: player.name,
          avatar_url: player.avatarUrl,
          game_mode: mode,
          variant,
          score,
          duration_ms: durationMs,
          best_streak: bestStreak,
        });
        save.current = { roundId, succeeded: Promise.resolve(insert).then(({ error }) => !error) };
      }
      const succeeded = await save.current.succeeded;
      if (!isActive) return;
      if (!succeeded) {
        setLeaderboardError("Skor kaydedilemedi. Lütfen tekrar deneyin.");
        return;
      }
      await loadLeaderboards();
      // Beklerken effect temizlendiyse abone olunmaz; aksi halde temizlikten sonra açılan kanal hiç kapanmaz.
      if (!isActive) return;
      channel = subscribeToResults(supabase, "live-leaderboard", () => { void loadLeaderboards(); });
    };

    void saveResultAndLoadLeaderboards();
    return () => {
      isActive = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [bestStreak, durationMs, isFinished, mode, player, roundId, score, variant]);

  const resetLeaderboards = () => {
    setLeaderboards(EMPTY_LEADERBOARDS);
    setLeaderboardError(null);
  };

  return { leaderboards, leaderboardError, resetLeaderboards, playedBoardId: boardIdFor(choice) };
}
