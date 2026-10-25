"use client";

import { useEffect, useState } from "react";
import { BOARDS, boardVariantFor, choiceForBoard, formatTime, QUESTIONS_PER_ROUND, type BoardId, type LeaderboardEntry, type PlayChoice, type Player } from "@/lib/game";
import { type Leaderboards, type RankedRound } from "@/lib/hooks/useLeaderboard";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Günlük meydan okuma: her gün (Türkiye saatiyle) Türkiye, Plaka, Dünya ve Bayrak için ayrı birer meydan okuma. Bir
 * modun 10 sorusu gün boyu herkes için aynıdır; her oyuncu her modu günde bir kez oynar. Tur normal bir yarış turudur
 * (sunucuda doğrulanır, genel sıralamaya da işlenir); ayrıca günün sıralamasına ve gün serisine sayılır.
 */

/** Türkiye UTC+3'tür ve yaz saati uygulamaz; gün gece yarısı (UTC 21:00) değişir. */
const TURKEY_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Yeni meydan okumaya kalan süre (milisaniye). */
export function msUntilNextDaily(now = Date.now()): number {
  return DAY_MS - ((now + TURKEY_OFFSET_MS) % DAY_MS);
}

/** Bugünün tarihi, Türkiye saatiyle ("25 Ekim"). */
export function dailyDateLabel(now = Date.now()): string {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" }).format(now);
}

/** Bir sıralamanın günlük meydan okuması olarak oynanacak tur. */
export function dailyChoice(boardId: BoardId): PlayChoice {
  const board = BOARDS.find((candidate) => candidate.id === boardId) ?? BOARDS[0];
  return { ...choiceForBoard(board), daily: true };
}

export type DailyResult = {
  game_mode: PlayChoice["mode"];
  variant: string;
  score: number;
  duration_ms: number;
  rank: number;
  players: number;
  /** Soru soru doğru / yanlış, sırayla; paylaşım kareleri. */
  answers: boolean[];
};

/** Oyuncunun bugünkü durumu (sunucudaki my_daily). */
export type DailyStatus = {
  day: string;
  streak: number;
  /** Bugün başlatılan modlar; bırakılan tur da hakkı kullanır. */
  started: { game_mode: string; variant: string }[];
  results: DailyResult[];
};

export function boardOf(item: { game_mode: string; variant: string }): BoardId | undefined {
  return BOARDS.find((board) => board.mode === item.game_mode && board.variant === item.variant)?.id;
}

/** Paylaşım metni: tarih, mod, soru soru kareler, skor ve süre. Site bağlantısını paylaşma tuşu ekler. */
export function dailyShareText(boardId: BoardId, answers: boolean[], score: number, durationMs: number, now = Date.now()): string {
  const label = BOARDS.find((board) => board.id === boardId)?.label ?? "";
  const squares = answers.map((isCorrect) => (isCorrect ? "🟩" : "🟥")).join("");
  return `Harita Avcısı · ${dailyDateLabel(now)} · ${label}\n${squares} ${score}/${QUESTIONS_PER_ROUND} · ${formatTime(Math.round(durationMs / 1000))}\n`;
}

export type DailyStart = RankedRound | "played" | null;

/**
 * Bugünün meydan okuma turunu sunucuda açar ve sorularını alır. Bu mod bugün oynandıysa "played", sunucuya
 * ulaşılamazsa null döner; günlük meydan okuma yerel sorularla oynanmaz.
 */
export async function startDailyRound(choice: PlayChoice): Promise<DailyStart> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc("start_daily_round", { p_game_mode: choice.mode, p_variant: boardVariantFor(choice) });
    if (error) return error.message.includes("oynadın") ? "played" : null;
    const round = data as { round_id?: unknown; questions?: unknown } | null;
    if (typeof round?.round_id !== "string" || !Array.isArray(round.questions)) return null;
    return { roundId: round.round_id, questions: round.questions.map(String) };
  } catch {
    return null;
  }
}

/**
 * Giriş yapmış oyuncunun bugünkü durumu. `refreshKey` değişince (tur bitti, ana menüye dönüldü) yeniden çekilir.
 * Giriş yoksa ya da yüklenemezse null.
 */
export function useDailyStatus(player: Player | null, refreshKey: unknown) {
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const playerId = player?.id;

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!playerId || !supabase) return;
    let isActive = true;
    void Promise.resolve(supabase.rpc("my_daily")).then(
      ({ data, error }) => {
        if (isActive) setStatus(error || !data ? null : (data as DailyStatus));
      },
      () => {},
    );
    return () => {
      isActive = false;
    };
  }, [playerId, refreshKey]);

  return playerId ? status : null;
}

const EMPTY_LEADERBOARDS: Leaderboards = { turkey: [], "turkey-plates": [], "world-hard": [], "world-flags": [] };

/** Bugünün sıralamaları (her mod ayrı); açılınca ve `refreshKey` değişince çekilir. */
export function useDailyLeaderboards(isEnabled: boolean, refreshKey: unknown = null) {
  const [leaderboards, setLeaderboards] = useState<Leaderboards | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!isEnabled || !supabase) return;
    let isActive = true;
    void Promise.all(
      BOARDS.map((board) =>
        supabase
          .from("daily_leaderboard")
          .select("user_id, display_name, avatar_url, score, duration_ms, best_streak")
          .eq("game_mode", board.mode)
          .eq("variant", board.variant)
          .order("score", { ascending: false })
          .order("duration_ms", { ascending: true })
          .order("best_streak", { ascending: false })
          .limit(50),
      ),
    ).then(
      (results) => {
        if (!isActive) return;
        if (results.some((result) => result.error)) return setLeaderboards(EMPTY_LEADERBOARDS);
        setLeaderboards(Object.fromEntries(BOARDS.map((board, index) => [board.id, (results[index].data ?? []) as LeaderboardEntry[]])) as Leaderboards);
      },
      () => {
        if (isActive) setLeaderboards(EMPTY_LEADERBOARDS);
      },
    );
    return () => {
      isActive = false;
    };
  }, [isEnabled, refreshKey]);

  return leaderboards;
}
