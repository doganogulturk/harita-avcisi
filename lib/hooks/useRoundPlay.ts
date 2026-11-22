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

/** Kısa gösterimde doğru cevabın ekranda kalma süresi; yanlışta doğru yer yine en fazla QUESTION_TRANSITION_MS gösterilir. */
export const QUICK_CORRECT_TRANSITION_MS = 1000;
/** Cevaptan hemen sonraki çift dokunuş sonraki soruya geçirmesin: açıklama bir an görülsün. */
const SKIP_GRACE_MS = 350;

export type RoundStatus = "idle" | "playing" | "finished";

type RoundOptions = {
  mode: GameMode;
  /** Süreli tur (yarış, oda turu) 120 saniyede biter; süresiz tur (antrenman) oyuncu bitirene kadar sürer. */
  timed: boolean;
  /** Süresiz turda sorular bitince çağrılır; döndürdüğü sorularla tur devam eder. Verilmezse tur biter. */
  extend?: (lastQuestion: Question) => Question[];
  /**
   * Kısa gösterim (Oyna, Antrenman): doğru cevaptan sonra sonraki soruya yaklaşık 1 saniyede geçilir, yanlış cevapta
   * doğru yer en fazla 3 saniye gösterilir ve `skip` ile hemen geçilebilir. Günlük meydan okuma ve oda turlarında
   * kapalıdır: herkes her cevaptan sonra aynı 3 saniyeyi bekler (sunucu en kısa süreyi bu türlerde ona göre denetler).
   */
  isQuick?: boolean;
};

/**
 * Turun saati duvar saatidir (Date.now), performance.now değil: telefon kilitlenince ya da uygulama arka plana
 * alınınca bazı tarayıcılarda performance.now durur. Sunucu turun süresini duvar saatiyle ölçer ve kaydedilen süre
 * ondan belirgin biçimde kısaysa sonucu reddeder; arka plana alınan yarışın skoru böyle kaybolurdu. Süre de oyuncu
 * uygulamadan çıktığında işlemeye devam eder; yarışta adil olan budur.
 */
const now = () => Date.now();

/**
 * Tek bir turun oynanışı: sorular sırayla sorulur, cevaptan sonra doğru cevap gösterilir (3 saniye; kısa
 * gösterimde doğru cevapta 1 saniye), süreli turda toplam süre 120 saniyedir. Puan, seri ve süre burada tutulur. Ana
 * sayfadaki turlar da odadaki turlar da bu kancayla oynanır; soruların nereden geldiği (tarayıcıda
 * karıştırılmış ya da sunucudan gelmiş) kancanın dışında kalır.
 */
export function useRoundPlay({ mode, timed, extend, isQuick = false }: RoundOptions) {
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
  // Cevaptan sonra sonraki soruya geçen işlev ve cevabın verildiği an; `skip` bunları kullanır.
  const advanceRef = useRef<(() => void) | null>(null);
  const answeredAt = useRef(0);

  const currentQuestion = questions[questionIndex];
  const isRoundComplete = answers.length === questions.length;
  const elapsedMs = () => (startedAt.current === null ? 0 : now() - startedAt.current);

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
    startedAt.current = now();
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
      const elapsed = startedAt.current === null ? 0 : now() - startedAt.current;
      const remainingSeconds = Math.max(0, Math.ceil((GAME_DURATION_MS - elapsed) / 1000));
      setRemainingGameSeconds(remainingSeconds);
      if (remainingSeconds === 0) {
        setCompletionDurationMs(GAME_DURATION_MS);
        setStatus("finished");
      }
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 250);
    // Uygulamaya ya da sekmeye dönülünce kalan süre beklemeden güncellensin.
    document.addEventListener("visibilitychange", updateRemaining);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", updateRemaining);
    };
  }, [isRoundComplete, status, timed]);

  // Cevaptan sonra doğru cevabı gösterir, ardından sonraki soruya geçer.
  useEffect(() => {
    if (status !== "playing" || !answerState) return;
    const transitionMs = isQuick && answerState === "correct" ? QUICK_CORRECT_TRANSITION_MS : QUESTION_TRANSITION_MS;
    const transitionStartedAt = now();
    const countdown = window.setInterval(
      () => setRemainingQuestionSeconds(Math.max(0, Math.ceil((transitionMs - (now() - transitionStartedAt)) / 1000))),
      100,
    );
    // Zamanlayıcı ile `skip` aynı işlevi çağırır; ikisi birden çalışırsa soru bir kez ilerler.
    let isAdvanced = false;
    const advance = () => {
      if (isAdvanced) return;
      isAdvanced = true;
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
    };
    advanceRef.current = advance;
    const timer = window.setTimeout(advance, transitionMs);

    return () => {
      advanceRef.current = null;
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [answerState, isQuick, questionIndex, questions, status]);

  /** Kısa gösterimde yanlış cevaptan sonra dokunarak sonraki soruya geçer; bu kısa gösterim kapalıysa ya da cevap yoksa bir şey yapmaz. */
  const skip = () => {
    if (!isQuick || now() - answeredAt.current < SKIP_GRACE_MS) return;
    advanceRef.current?.();
  };

  const choose = (locationId: string) => {
    if (status !== "playing" || !currentQuestion || answerState) return;
    const isCorrect = isSameLocation(mode, locationId, correctLocationId(currentQuestion));

    if (timed && questionIndex === questions.length - 1) {
      setCompletionDurationMs(Math.round(Math.min(GAME_DURATION_MS, elapsedMs())));
    }

    const nextStreak = isCorrect ? streak + 1 : 0;
    answeredAt.current = now();
    setRemainingQuestionSeconds(isQuick && isCorrect ? QUICK_CORRECT_TRANSITION_MS / 1000 : QUESTION_TRANSITION_SECONDS);
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
    /** Şu anki doğru serisi; yanlış cevapta sıfırlanır. */
    streak,
    bestStreak,
    completionDurationMs,
    remainingGameSeconds,
    remainingQuestionSeconds,
    roundKey,
    start,
    choose,
    skip,
    finish,
    reset,
  };
}
