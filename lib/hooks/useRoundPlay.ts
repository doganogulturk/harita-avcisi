"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  correctLocationId,
  GAME_DURATION_MS,
  GAME_DURATION_SECONDS,
  isSameLocation,
  normalizeLocationId,
  QUESTION_TRANSITION_MS,
  type AnswerRecord,
  type AnswerState,
  type GameMode,
  type Question,
} from "@/lib/game";

const QUESTION_TRANSITION_SECONDS = QUESTION_TRANSITION_MS / 1000;

export type RoundStatus = "idle" | "playing" | "finished";

type RoundOptions = {
  mode: GameMode;
  /** Süreli tur (yarış, oda turu) 120 saniyede biter; süresiz tur (antrenman) oyuncu bitirene kadar sürer. */
  timed: boolean;
  /** Süresiz turda sorular bitince çağrılır; döndürdüğü sorularla tur devam eder. Verilmezse tur biter. */
  extend?: (lastQuestion: Question) => Question[];
};

/**
 * Tek bir turun oynanışı: sorular sırayla sorulur, cevaptan sonra doğru cevap 3 saniye gösterilir,
 * süreli turda toplam süre 120 saniyedir. Puan, seri ve süre burada tutulur. Ana sayfadaki yarış ve
 * antrenman turları da odadaki turlar da bu kancayla oynanır; soruların nereden geldiği (tarayıcıda
 * karıştırılmış ya da sunucudan gelmiş) kancanın dışında kalır.
 */
export function useRoundPlay({ mode, timed, extend }: RoundOptions) {
  const [status, setStatus] = useState<RoundStatus>("idle");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  // Her soruda tıklanan yer, sırayla; sunucu puanı ve istatistikleri bundan hesaplar.
  const [selections, setSelections] = useState<string[]>([]);
  const [answerState, setAnswerState] = useState<AnswerState>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [completionDurationMs, setCompletionDurationMs] = useState(0);
  const [remainingGameSeconds, setRemainingGameSeconds] = useState(GAME_DURATION_SECONDS);
  const [remainingQuestionSeconds, setRemainingQuestionSeconds] = useState(QUESTION_TRANSITION_SECONDS);
  // Her yeni turda artar; tur sonucunun bir kez kaydedilmesi ve istatistiklerin yenilenmesi buna bağlı.
  const [roundKey, setRoundKey] = useState(0);
  const startedAt = useRef<number | null>(null);
  // Soru sonrası geçiş zamanlayıcısı her çizimde yeniden kurulmasın diye.
  const extendRef = useRef(extend);
  useEffect(() => {
    extendRef.current = extend;
  });

  const currentQuestion = questions[questionIndex];
  const isRoundComplete = answers.length === questions.length;
  const elapsedMs = () => (startedAt.current === null ? 0 : performance.now() - startedAt.current);

  const start = useCallback((nextQuestions: Question[]) => {
    setQuestions(nextQuestions);
    setQuestionIndex(0);
    setAnswers([]);
    setSelections([]);
    setAnswerState(null);
    setSelectedLocation(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setCompletionDurationMs(0);
    setRemainingGameSeconds(GAME_DURATION_SECONDS);
    setRemainingQuestionSeconds(QUESTION_TRANSITION_SECONDS);
    startedAt.current = performance.now();
    setRoundKey((current) => current + 1);
    setStatus("playing");
  }, []);

  const reset = useCallback(() => setStatus("idle"), []);

  /** Süresiz turu oyuncu bitirir. */
  const finish = () => {
    setCompletionDurationMs(Math.round(elapsedMs()));
    setStatus("finished");
  };

  // Turun toplam süresini geri sayar ve süre dolunca turu bitirir. Son soru cevaplandığında
  // durur; aksi halde son cevabın ardından geçen gösterim süresi, kaydedilen süreyi ezebilir.
  useEffect(() => {
    if (status !== "playing" || isRoundComplete || !timed) return;
    const updateRemaining = () => {
      const elapsed = startedAt.current === null ? 0 : performance.now() - startedAt.current;
      const remainingSeconds = Math.max(0, Math.ceil((GAME_DURATION_MS - elapsed) / 1000));
      setRemainingGameSeconds(remainingSeconds);
      if (remainingSeconds === 0) {
        setCompletionDurationMs(GAME_DURATION_MS);
        setStatus("finished");
      }
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(timer);
  }, [isRoundComplete, status, timed]);

  // Cevaptan sonra doğru cevabı gösterir, ardından sonraki soruya geçer.
  useEffect(() => {
    if (status !== "playing" || !answerState) return;
    const transitionStartedAt = performance.now();
    const countdown = window.setInterval(
      () => setRemainingQuestionSeconds(Math.max(0, Math.ceil((QUESTION_TRANSITION_MS - (performance.now() - transitionStartedAt)) / 1000))),
      100,
    );
    const timer = window.setTimeout(() => {
      if (questionIndex === questions.length - 1) {
        const more = extendRef.current?.(questions[questions.length - 1]);
        if (!more?.length) {
          setStatus("finished");
          return;
        }
        setQuestions((current) => [...current, ...more]);
      }
      setQuestionIndex((currentIndex) => currentIndex + 1);
      setAnswerState(null);
      setSelectedLocation(null);
    }, QUESTION_TRANSITION_MS);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [answerState, questionIndex, questions, status]);

  const choose = (locationId: string) => {
    if (status !== "playing" || !currentQuestion || answerState) return;
    const isCorrect = isSameLocation(mode, locationId, correctLocationId(currentQuestion));

    if (timed && questionIndex === questions.length - 1) {
      setCompletionDurationMs(Math.round(Math.min(GAME_DURATION_MS, elapsedMs())));
    }

    const nextStreak = isCorrect ? streak + 1 : 0;
    setRemainingQuestionSeconds(QUESTION_TRANSITION_SECONDS);
    setSelectedLocation(locationId);
    setAnswerState(isCorrect ? "correct" : "incorrect");
    setAnswers((currentAnswers) => [...currentAnswers, isCorrect ? "correct" : "incorrect"]);
    setSelections((currentSelections) => [...currentSelections, locationId]);
    setScore((currentScore) => currentScore + (isCorrect ? 1 : 0));
    setStreak(nextStreak);
    setBestStreak((currentBest) => Math.max(currentBest, nextStreak));
  };

  const answerRecords: AnswerRecord[] = useMemo(
    () => selections.map((selected, index) => ({ location: correctLocationId(questions[index]), selected: normalizeLocationId(mode, selected) })),
    [mode, questions, selections],
  );

  return {
    status,
    questions,
    questionIndex,
    currentQuestion,
    answers,
    answerRecords,
    answerState,
    selectedLocation,
    score,
    bestStreak,
    completionDurationMs,
    remainingGameSeconds,
    remainingQuestionSeconds,
    roundKey,
    start,
    choose,
    finish,
    reset,
  };
}
