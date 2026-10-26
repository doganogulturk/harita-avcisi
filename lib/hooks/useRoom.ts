"use client";

import { messages } from "@/lib/i18n";
import { serverMessage } from "@/lib/i18n/server-messages";
import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { type Player } from "@/lib/game";
import { type RoomSettings, type RoomState } from "@/lib/room";

/** Lobide katılanlar, oyunda sıralama bu sıklıkla yenilenir; bitmiş oda seyrek sorulur. */
const ACTIVE_POLL_MS = 2000;
const FINISHED_POLL_MS = 10000;

/**
 * Odanın tarayıcı tarafı. Oyuncu giriş yaptıktan sonra odaya katılmayı dener (oda başlamışsa ya da doluysa
 * yalnızca izler), ardından durumu düzenli aralıklarla sorar.
 */
export function useRoom(code: string, player: Player | null) {
  const [state, setState] = useState<RoomState | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const clockOffsetMs = useRef(0);
  const playerId = player?.id;
  // Tur oynanırken yoklama durur; tur bitince yeniden başlar.
  const [isPaused, setIsPaused] = useState(false);

  // Katılamama nedeni yalnızca katılma denemesinin cevabında gelir; sonraki yoklamalarda da gösterilsin diye saklanır.
  const joinError = useRef<string | null>(null);

  const apply = useCallback((next: RoomState | null) => {
    if (!next) return;
    clockOffsetMs.current = Date.parse(next.server_now) - Date.now();
    if (next.join_error) joinError.current = next.join_error;
    setState({ ...next, join_error: next.join_error ?? joinError.current });
  }, []);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data, error } = await supabase.rpc("get_room", { p_code: code });
    if (!error) apply(data as RoomState);
  }, [apply, code]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !playerId || isPaused) return;

    let isActive = true;
    let timer: number | undefined;
    let hasJoined = false;
    let isPolling = false;

    const poll = async () => {
      isPolling = true;
      const { data, error } = await supabase.rpc(hasJoined ? "get_room" : "join_room", { p_code: code });
      isPolling = false;
      if (!isActive) return;
      if (error) {
        if (!hasJoined) return setFatalError(serverMessage(error.message) || messages().errors.roomConnectFailed);
      } else {
        hasJoined = true;
        apply(data as RoomState);
      }
      const status = (data as RoomState | null)?.status;
      timer = window.setTimeout(() => void poll(), status === "finished" ? FINISHED_POLL_MS : ACTIVE_POLL_MS);
    };

    // Uygulamaya dönülünce ya da bağlantı gelince pano beklemeden yenilenir (bitmiş odada yoklama 10 saniyede bir).
    const pollNow = () => {
      if (document.visibilityState !== "visible" || isPolling || !hasJoined) return;
      window.clearTimeout(timer);
      void poll();
    };

    void poll();
    document.addEventListener("visibilitychange", pollNow);
    window.addEventListener("online", pollNow);
    return () => {
      isActive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", pollNow);
      window.removeEventListener("online", pollNow);
    };
  }, [apply, code, isPaused, playerId]);

  const startRoom = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setActionError(null);
    const { data, error } = await supabase.rpc("start_room", { p_code: code });
    if (error) return setActionError(serverMessage(error.message));
    apply(data as RoomState);
  }, [apply, code]);

  /** Sıradaki turu sunucuda açar; tur kimliğini ve sorularını döndürür. */
  const startRound = useCallback(
    async (round: number): Promise<{ roundId: string; questions: string[] } | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      setActionError(null);
      const { data, error } = await supabase.rpc("start_room_round", { p_code: code, p_round: round });
      if (error) {
        setActionError(serverMessage(error.message));
        return null;
      }
      const { round_id: roundId, questions } = data as { round_id: string; questions: string[] };
      return { roundId, questions };
    },
    [code],
  );

  const serverNow = useCallback(() => Date.now() + clockOffsetMs.current, []);

  return { state, fatalError, actionError, serverNow, startRoom, startRound, refresh, setIsPaused };
}

/** Yeni oda kurar ve kodunu döndürür. */
export async function createRoom(settings: RoomSettings): Promise<{ code: string } | { error: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: messages().errors.notConfigured };
  const { data, error } = await supabase.rpc("create_room", {
    p_name: settings.name,
    p_game_mode: settings.mode,
    p_variant: settings.variant,
    p_round_count: settings.roundCount,
    p_duration_minutes: settings.durationMinutes,
    p_max_players: settings.maxPlayers,
  });
  if (error || typeof data !== "string") return { error: error ? serverMessage(error.message) : messages().errors.roomCreateFailed };
  return { code: data };
}
