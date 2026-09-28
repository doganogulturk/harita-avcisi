"use client";

import { useEffect, useRef } from "react";
import { GameMap } from "../GameMap";
import { GameTopBar } from "../GameTopBar";
import { duelChoice, questionForLocation } from "@/lib/duel";
import { flagUrl, isFlagChoice, type Player, type Question } from "@/lib/game";
import { useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { useRoundPlay } from "@/lib/hooks/useRoundPlay";
import { type RoomState } from "@/lib/room";
import { getSupabaseClient } from "@/lib/supabase";

/** Turun sonu: kaydedildi, kaydedilemedi ya da oyuncu bıraktı (0 puan). */
export type RoomRoundOutcome = { round: number; score: number; durationMs: number; saved: boolean; abandoned?: boolean };

type RoomRoundProps = {
  state: RoomState;
  player: Player;
  round: number;
  roundId: string;
  questionIds: string[];
  onDone: (outcome: RoomRoundOutcome) => void;
  onSignOut: () => void;
};

/**
 * Odadaki bir tur: sunucunun verdiği 10 soru, normal bir yarış turu gibi (120 saniye) oynanır. Tur bitince
 * sonuç finish_round ile doğrulanıp kaydedilir; oda sıralamasına ve genel sıralamaya birlikte işlenir.
 */
export function RoomRound({ state, player, round, roundId, questionIds, onDone, onSignOut }: RoomRoundProps) {
  const mode = state.game_mode;
  const choice = duelChoice(mode, state.variant);
  const play = useRoundPlay({ mode, timed: true });
  const { mapMarkup, mapError } = useMapMarkup(mode);
  const hasStarted = useRef(false);
  const hasSaved = useRef(false);

  // Tur, bileşen açılınca bir kez başlar.
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;
    play.start(questionIds.map((id) => questionForLocation(mode, id)).filter((question): question is Question => question !== undefined));
  }, [mode, play, questionIds]);

  // Bayrak turlarında sıradaki bayrak önceden indirilir; bayrağın yüklenmesi süreden yemesin.
  useEffect(() => {
    if (play.status !== "playing" || !isFlagChoice(choice)) return;
    play.questions.slice(play.questionIndex, play.questionIndex + 2).forEach((question) => {
      if ("code" in question) new window.Image().src = flagUrl(question.code);
    });
  }, [choice, play.questionIndex, play.questions, play.status]);

  // Tur bitince sonuç bir kez kaydedilir, ardından oda ekranına dönülür.
  const { status, answerRecords, completionDurationMs, score } = play;
  useEffect(() => {
    if (status !== "finished" || hasSaved.current) return;
    hasSaved.current = true;
    const supabase = getSupabaseClient();
    void Promise.resolve(
      supabase?.rpc("finish_round", { p_round_id: roundId, p_duration_ms: completionDurationMs, p_answers: answerRecords }),
    ).then(
      (result) => onDone({ round, score, durationMs: completionDurationMs, saved: Boolean(result && !result.error) }),
      () => onDone({ round, score, durationMs: completionDurationMs, saved: false }),
    );
  }, [answerRecords, completionDurationMs, onDone, round, roundId, score, status]);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <GameTopBar
        answerState={play.answerState}
        answers={play.answers}
        choice={choice}
        exitTitle="Turu bırak · Bu tur 0 puan sayılır ve tekrar oynanamaz"
        onExit={() => {
          if (!window.confirm("Turu bırakırsan bu tur 0 puan sayılır ve tekrar oynanamaz. Bırakmak istiyor musun?")) return;
          hasSaved.current = true;
          // Sunucu da hemen "yarım" saysın; haber veremezse tur 150 saniye sonra kendiliğinden yarım sayılır.
          void Promise.resolve(getSupabaseClient()?.rpc("abandon_round", { p_round_id: roundId })).finally(() =>
            onDone({ round, score: 0, durationMs: 0, saved: false, abandoned: true }),
          );
        }}
        onFinishPractice={() => {}}
        onSignOut={onSignOut}
        player={player}
        question={play.currentQuestion}
        questionCount={play.questions.length}
        remainingGameSeconds={play.remainingGameSeconds}
        remainingQuestionSeconds={play.remainingQuestionSeconds}
        roundLabel={`${state.name} · Tur ${round}/${state.round_count}`}
        score={play.score}
      />
      <GameMap
        answerState={play.answerState}
        isInteractive
        mapError={mapError}
        mapMarkup={mapMarkup}
        mode={mode}
        onSelect={play.choose}
        question={play.currentQuestion}
        selectedLocation={play.selectedLocation}
      />
    </section>
  );
}
