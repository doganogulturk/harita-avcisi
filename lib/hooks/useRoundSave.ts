"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import { boardVariantFor, type AnswerRecord, type PlayChoice, type Player } from "@/lib/game";

type FinishedRound = {
  player: Player | null;
  /** Her yeni turda artan kimlik; aynı tur sonucunun iki kez kaydedilmesini önler. */
  roundId: number;
  /** Tur başlarken sunucuda açılan turun kimliği; `startRankedRound` döndürür. Girişsiz oyuncuda hiç açılmaz. */
  serverRound: Promise<string | null> | null;
  isFinished: boolean;
  /** Cevaplanan sorular sırayla; puan ve en uzun seri sunucuda bu listeden hesaplanır. */
  answers: AnswerRecord[];
  durationMs: number;
};

/** Sunucuda açılan tur: kimliği ve sunucunun seçtiği sorular (yer kimlikleri, sırayla; eski yolda boş). */
export type RankedRound = { roundId: string; questions: string[] };

/**
 * Oyna turunu sunucuda açar ve sorularını sunucuya seçtirir; sonuç kaydedilirken süreyi sunucu bu andan itibaren
 * ölçer, cevapları da bu sorularla karşılaştırır. Tur ancak sorular gelince başlar. Açılamazsa null döner; tur yerel
 * sorularla oynanır ama sonucu kaydedilemez. Yalnızca giriş yapmış oyuncu için çağrılır.
 */
export async function startRankedRound(choice: PlayChoice): Promise<RankedRound | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const params = { p_game_mode: choice.mode, p_variant: boardVariantFor(choice) };
  try {
    const { data, error } = await supabase.rpc("start_ranked_round", params);
    // Veritabanına start_ranked_round henüz eklenmediyse (geçiş SQL'i çalıştırılmadan yayına girildiyse) eski yolla
    // açılır: sorular tarayıcıda seçilir (questions boş), sonuç eskisi gibi kaydedilir.
    if (error?.code === "PGRST202") {
      const legacy = await supabase.rpc("start_round", params);
      return !legacy.error && typeof legacy.data === "string" ? { roundId: legacy.data, questions: [] } : null;
    }
    const round = data as { round_id?: unknown; questions?: unknown } | null;
    if (error || typeof round?.round_id !== "string" || !Array.isArray(round.questions)) return null;
    return { roundId: round.round_id, questions: round.questions.map(String) };
  } catch {
    return null;
  }
}

/**
 * Kaydın sonucu: "saved" kaydedildi, "failed" sunucuya ulaşılamadı ya da reddetti (yeniden denenebilir),
 * "no-round" tur başlarken sunucuda açılamadı (çoğunlukla bağlantı yoktu); süreyi sunucu turun açıldığı andan
 * ölçtüğü için bu tur sonradan kaydedilemez.
 */
export type SaveResult = "saved" | "failed" | "no-round";

/**
 * Giriş yapmış oyuncunun biten turunu kaydeder; girişsiz oyuncuda hiçbir şey yazılmaz.
 * Sonuç tabloya doğrudan yazılmaz; sunucudaki finish_round turu ve süresini doğrulayıp kaydeder (profil, rozetler ve
 * "en çok yanlış yapılanlar" bu kayıtlardan hesaplanır). Kayıt başarısızsa `retrySave` yeniden dener; bağlantı geri
 * gelince de kendiliğinden yeniden denenir.
 */
export function useRoundSave({ player, roundId, serverRound, isFinished, answers, durationMs }: FinishedRound) {
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
    void save.current.result.then((result) => {
      if (!isActive) return;
      setSettledRoundId(roundId);
      setSaveOutcome({ roundId, result });
    });
    return () => {
      isActive = false;
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

  // Girişsiz oyuncunun ya da sunucuda açılmamış turun kaydı beklenmez: sonuç ekranındaki istatistikler hemen gelir.
  const isSavable = Boolean(player && serverRound);
  return {
    isResultSettled: isFinished && (!isSavable || settledRoundId === roundId),
    saveResult,
    retrySave,
  };
}
