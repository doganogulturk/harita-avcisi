"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { type DuelSettings, type DuelState } from "@/lib/duel";
import { type Player } from "@/lib/game";

/** Oyun sırasında durum sık sorulur: rakibin kaptığı soru en geç bu kadar sonra görünür. */
const PLAYING_POLL_MS = 500;
const IDLE_POLL_MS = 1500;

/**
 * Düellonun tarayıcı tarafı. Oyuncu giriş yaptıktan sonra düelloya katılır, ardından durumu düzenli
 * aralıklarla sorar. Her sorgu sunucuda bir "saat tıkı"dır: oyuncunun bağlı olduğunu kaydeder ve zamanı
 * gelen geçişleri (soru kapanışı, sonraki soru, hükmen galibiyet) yaptırır.
 */
export function useDuel(code: string, player: Player | null) {
  const [state, setState] = useState<DuelState | null>(null);
  // Katılım hatası (düello yok, dolu, başkasının rövanşı): ekranın yerine geçer.
  const [fatalError, setFatalError] = useState<string | null>(null);
  // Geçici hata (bağlantı): durum ekranda kalır, üstte uyarı çıkar.
  const [connectionError, setConnectionError] = useState<string | null>(null);
  // Sunucu saati ile tarayıcı saati arasındaki fark; kalan süre sunucu saatine göre hesaplanır.
  const clockOffsetMs = useRef(0);
  const playerId = player?.id;

  const apply = useCallback((next: DuelState | null) => {
    if (!next) return;
    clockOffsetMs.current = Date.parse(next.server_now) - Date.now();
    setState(next);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || !playerId) return;

    let isActive = true;
    let timer: number | undefined;

    const poll = async (isFirst: boolean) => {
      const { data, error } = await supabase.rpc(isFirst ? "join_duel" : "duel_tick", { p_code: code });
      if (!isActive) return;
      if (error) {
        if (isFirst) return setFatalError(error.message || "Düelloya katılınamadı.");
        setConnectionError("Bağlantı sorunu, yeniden deneniyor...");
      } else {
        setConnectionError(null);
        apply(data as DuelState);
      }
      const status = (data as DuelState | null)?.status;
      timer = window.setTimeout(() => void poll(false), status === "playing" ? PLAYING_POLL_MS : IDLE_POLL_MS);
    };

    void poll(true);
    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [apply, code, playerId]);

  const call = useCallback(
    async (fn: string, args: Record<string, unknown>) => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const { data, error } = await supabase.rpc(fn, { p_code: code, ...args });
      if (error) return setConnectionError(error.message);
      apply(data as DuelState);
    },
    [apply, code],
  );

  const setReady = useCallback((ready: boolean) => call("duel_ready", { p_ready: ready }), [call]);
  const answer = useCallback((position: number, selected: string) => call("duel_answer", { p_position: position, p_selected: selected }), [call]);
  const declineRematch = useCallback(() => call("duel_decline_rematch", {}), [call]);

  /** Rövanş ister; yeni düellonun kodunu döndürür (rakip de istediyse onunki). */
  const requestRematch = useCallback(
    async ({ mode, variant, rule }: DuelSettings): Promise<string | null> => {
      const supabase = getSupabaseClient();
      if (!supabase) return null;
      const { data, error } = await supabase.rpc("duel_rematch", { p_code: code, p_game_mode: mode, p_variant: variant, p_rule: rule });
      if (error) {
        setConnectionError(error.message);
        return null;
      }
      return data as string;
    },
    [code],
  );

  const serverNow = useCallback(() => Date.now() + clockOffsetMs.current, []);

  return { state, fatalError, connectionError, serverNow, setReady, answer, requestRematch, declineRematch };
}

/** Yeni düello kurar ve kodunu döndürür. */
export async function createDuel({ mode, variant, rule }: DuelSettings): Promise<{ code: string } | { error: string }> {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: "Supabase bağlantısı yapılandırılmalıdır." };
  const { data, error } = await supabase.rpc("create_duel", { p_game_mode: mode, p_variant: variant, p_rule: rule });
  if (error || typeof data !== "string") return { error: error?.message ?? "Düello kurulamadı." };
  return { code: data };
}
