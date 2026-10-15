"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient, SUPABASE_SCHEMA } from "@/lib/supabase";
import {
  BOARDS,
  boardIdFor,
  boardVariantFor,
  LEADERBOARD_LIMIT,
  type AnswerRecord,
  type BoardId,
  type LeaderboardEntry,
  type PlayChoice,
  type Player,
} from "@/lib/game";

type FinishedRound = {
  player: Player | null;
  /** Her yeni turda artan kimlik; aynı tur sonucunun iki kez kaydedilmesini önler. */
  roundId: number;
  /** Tur başlarken sunucuda açılan turun kimliği; `startRankedRound` döndürür. */
  serverRound: Promise<string | null> | null;
  isFinished: boolean;
  choice: PlayChoice;
  /** Cevaplanan sorular sırayla; puan ve en uzun seri sunucuda bu listeden hesaplanır. */
  answers: AnswerRecord[];
  durationMs: number;
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
    .on("postgres_changes", { event: "*", schema: SUPABASE_SCHEMA, table: "game_results" }, reload)
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
 * Kaydın sonucu: "saved" kaydedildi, "failed" sunucuya ulaşılamadı ya da reddetti (yeniden denenebilir),
 * "no-round" tur başlarken sunucuda açılamadı (çoğunlukla bağlantı yoktu); süreyi sunucu turun açıldığı andan
 * ölçtüğü için bu tur sonradan kaydedilemez.
 */
export type SaveResult = "saved" | "failed" | "no-round";

/**
 * Tur bitince sonucu kaydeder, tüm sıralamaları çeker ve realtime güncellemelere abone olur.
 * Sonuç tabloya doğrudan yazılmaz; sunucudaki finish_round turu ve süresini doğrulayıp kaydeder.
 * Kayıt başarısızsa `retrySave` yeniden dener; bağlantı geri gelince de kendiliğinden yeniden denenir.
 */
export function useLeaderboard({ player, roundId, serverRound, isFinished, choice, answers, durationMs }: FinishedRound) {
  const [leaderboards, setLeaderboards] = useState<Leaderboards>(EMPTY_LEADERBOARDS);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  // Kaydı denenmiş (başarılı ya da değil) son tur; istatistikler bu turun cevaplarını da içersin diye beklenir.
  const [settledRoundId, setSettledRoundId] = useState<number | null>(null);
  const [saveOutcome, setSaveOutcome] = useState<{ roundId: number; result: SaveResult } | null>(null);
  // "Tekrar dene" ya da bağlantının gelmesi bunu artırır; effect aynı tur için kaydı yeniden dener.
  const [saveAttempt, setSaveAttempt] = useState(0);
  // Effect yeniden çalışsa da (StrictMode, oturum yenilenmesi) deneme başına tek kayıt; yeniden çalışan effect aynı kaydı bekler.
  const save = useRef<{ roundId: number; attempt: number; result: Promise<SaveResult> } | null>(null);

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
      setLeaderboardError(null);
      setLeaderboards(loaded);
    };

    const saveResultAndLoadLeaderboards = async () => {
      if (save.current?.roundId !== roundId || save.current.attempt !== saveAttempt) {
        const result = serverRound.then(async (serverRoundId): Promise<SaveResult> => {
          if (!serverRoundId) return "no-round";
          const { error } = await supabase.rpc("finish_round", {
            p_round_id: serverRoundId,
            p_duration_ms: durationMs,
            p_answers: answers,
          });
          return error ? "failed" : "saved";
        });
        save.current = { roundId, attempt: saveAttempt, result: result.catch((): SaveResult => "failed") };
      }
      const result = await save.current.result;
      if (!isActive) return;
      setSettledRoundId(roundId);
      setSaveOutcome({ roundId, result });
      // Kayıt olmasa da sıralama gösterilir (bağlantı varsa).
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
  }, [answers, durationMs, isFinished, player, roundId, saveAttempt, serverRound]);

  const saveResult = saveOutcome?.roundId === roundId ? saveOutcome.result : null;
  const retrySave = useCallback(() => setSaveAttempt((attempt) => attempt + 1), []);

  // Kayıt bağlantı yüzünden olmadıysa bağlantı gelince kendiliğinden yeniden denenir.
  useEffect(() => {
    if (saveResult !== "failed") return;
    window.addEventListener("online", retrySave);
    return () => window.removeEventListener("online", retrySave);
  }, [retrySave, saveResult]);

  const resetLeaderboards = () => {
    setLeaderboards(EMPTY_LEADERBOARDS);
    setLeaderboardError(null);
  };

  return {
    leaderboards,
    leaderboardError,
    resetLeaderboards,
    playedBoardId: boardIdFor(choice),
    isResultSettled: settledRoundId === roundId,
    saveResult,
    retrySave,
  };
}
