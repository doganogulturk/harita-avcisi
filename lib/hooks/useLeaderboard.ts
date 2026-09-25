"use client";

import { useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { BOARDS, boardIdFor, boardVariantFor, LEADERBOARD_LIMIT, type BoardId, type LeaderboardEntry, type PlayChoice, type Player } from "@/lib/game";

type FinishedRound = {
  player: Player | null;
  /** Her yeni turda artan kimlik; aynı tur sonucunun iki kez kaydedilmesini önler. */
  roundId: number;
  /** Tur başlarken sunucuda açılan turun kimliği; `startRankedRound` döndürür. */
  serverRound: Promise<string | null> | null;
  isFinished: boolean;
  choice: PlayChoice;
  score: number;
  answeredCount: number;
  durationMs: number;
  bestStreak: number;
};

export type Leaderboards = Record<BoardId, LeaderboardEntry[]>;

const EMPTY_LEADERBOARDS: Leaderboards = { turkey: [], "turkey-plates": [], world: [], "world-hard": [], "world-flags": [] };

// Supabase aynı adlı kanalı yeniden kullanır; kapanmakta olan eski kanala dinleyici eklenmesin diye her abonelik ayrı adla açılır.
let channelSequence = 0;

/**
 * Yarış turunu sunucuda açar; sonuç kaydedilirken süreyi sunucu bu andan itibaren ölçer.
 * Tur tarayıcıda beklemeden başlar, bu istek arka planda sürer. Açılamazsa null döner ve
 * turun sonucu kaydedilemez.
 */
export function startRankedRound(choice: PlayChoice): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return Promise.resolve(null);
  return Promise.resolve(supabase.rpc("start_round", { p_game_mode: choice.mode, p_variant: boardVariantFor(choice) })).then(
    ({ data, error }) => (error || typeof data !== "string" ? null : data),
    () => null,
  );
}

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

/**
 * Tur bitince sonucu kaydeder, tüm sıralamaları çeker ve realtime güncellemelere abone olur.
 * Sonuç tabloya doğrudan yazılmaz; sunucudaki finish_round turu ve süresini doğrulayıp kaydeder.
 */
export function useLeaderboard({ player, roundId, serverRound, isFinished, choice, score, answeredCount, durationMs, bestStreak }: FinishedRound) {
  const [leaderboards, setLeaderboards] = useState<Leaderboards>(EMPTY_LEADERBOARDS);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  // Effect yeniden çalışsa da (StrictMode, oturum yenilenmesi) tur başına tek kayıt; yeniden çalışan effect aynı kaydı bekler.
  const save = useRef<{ roundId: number; succeeded: Promise<boolean> } | null>(null);

  useEffect(() => {
    if (!isFinished || !player || !serverRound) return;
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
        const succeeded = serverRound.then(async (serverRoundId) => {
          if (!serverRoundId) return false;
          const { error } = await supabase.rpc("finish_round", {
            p_round_id: serverRoundId,
            p_score: score,
            p_best_streak: bestStreak,
            p_answered: answeredCount,
            p_duration_ms: durationMs,
          });
          return !error;
        });
        save.current = { roundId, succeeded: succeeded.catch(() => false) };
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
  }, [answeredCount, bestStreak, durationMs, isFinished, player, roundId, score, serverRound]);

  const resetLeaderboards = () => {
    setLeaderboards(EMPTY_LEADERBOARDS);
    setLeaderboardError(null);
  };

  return { leaderboards, leaderboardError, resetLeaderboards, playedBoardId: boardIdFor(choice) };
}
