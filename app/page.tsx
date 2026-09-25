"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GameMap } from "./components/GameMap";
import { GameTopBar } from "./components/GameTopBar";
import { IntroScreen } from "./components/IntroScreen";
import { ResultScreen } from "./components/ResultScreen";
import { RotateOverlay } from "./components/RotateOverlay";
import { startRankedRound, useLeaderboard } from "@/lib/hooks/useLeaderboard";
import { useMostMissed } from "@/lib/hooks/useMostMissed";
import { loadMapMarkup, useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { getSupabaseClient } from "@/lib/supabase";
import { shuffle } from "@/lib/shuffle";
import { provinces } from "@/lib/turkish-plates";
import { commonCountries, continentInfo, continentLocationIds, countries, countriesIn } from "@/lib/world-countries";
import {
  BOARDS,
  boardIdFor,
  choiceForBoard,
  correctLocationId,
  flagUrl,
  isFlagChoice,
  GAME_DURATION_MS,
  GAME_DURATION_SECONDS,
  GAME_MODES,
  isSameLocation,
  normalizeLocationId,
  QUESTION_TRANSITION_MS,
  QUESTIONS_PER_ROUND,
  type AnswerState,
  type BoardId,
  type GameMode,
  type GamePhase,
  type PlayChoice,
  type Question,
} from "@/lib/game";

const QUESTION_TRANSITION_SECONDS = QUESTION_TRANSITION_MS / 1000;
const PENDING_CHOICE_KEY = "harita-avcisi:pending-choice";

/**
 * Google ile giriş sayfadan ayrılıp geri döndüğü için, giriş öncesi yapılan tur
 * seçimi sekme belleğinde saklanır; dönüşte o tur doğrudan başlar.
 */
function readPendingChoice(): PlayChoice | null {
  try {
    const raw = sessionStorage.getItem(PENDING_CHOICE_KEY);
    // Eski sürümlerin kaydettiği seçimde `kind` yok; o zamanlar yalnızca sıralamalı tur vardı.
    return raw ? { kind: "ranked", ...(JSON.parse(raw) as Omit<PlayChoice, "kind">) } : null;
  } catch {
    return null;
  }
}

function writePendingChoice(choice: PlayChoice | null) {
  try {
    if (choice) sessionStorage.setItem(PENDING_CHOICE_KEY, JSON.stringify(choice));
    else sessionStorage.removeItem(PENDING_CHOICE_KEY);
  } catch {
    // Sekme belleği kullanılamıyorsa seçim yalnızca bu sayfa yaşamı boyunca hatırlanır.
  }
}

function poolFor({ mode, difficulty, continent }: PlayChoice): Question[] {
  if (mode === "turkey") return provinces;
  if (continent) return countriesIn(continent);
  return difficulty === "hard" ? countries : commonCountries;
}

/** Sıralamalı tur 10 soru sorar; antrenman tüm havuzu sırayla dolaşır. */
function roundFor(choice: PlayChoice): Question[] {
  const shuffled = shuffle(poolFor(choice));
  return choice.kind === "practice" ? shuffled : shuffled.slice(0, QUESTIONS_PER_ROUND);
}

/** Antrenmanda havuz bitince yeniden karıştırılır; yeni turun ilk sorusu az önce sorulanla aynı olmaz. */
function nextPracticeCycle(choice: PlayChoice, lastQuestion: Question): Question[] {
  const next = shuffle(poolFor(choice));
  if (next.length > 1 && correctLocationId(next[0]) === correctLocationId(lastQuestion)) next.push(next.shift()!);
  return next;
}

const DEFAULT_CHOICE: PlayChoice = { kind: "ranked", mode: "turkey", difficulty: "normal" };

export default function Home() {
  const [choice, setChoice] = useState<PlayChoice>(DEFAULT_CHOICE);
  const mode = choice.mode;
  const isPractice = choice.kind === "practice";
  const continent = mode === "world" ? choice.continent : undefined;
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [questions, setQuestions] = useState<Question[]>(() => roundFor(DEFAULT_CHOICE));
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
  const gameStartedAt = useRef<number | null>(null);
  const [roundId, setRoundId] = useState(0);
  const [serverRound, setServerRound] = useState<Promise<string | null> | null>(null);

  const [pendingChoice, setPendingChoice] = useState<PlayChoice | null>(null);
  // Google girişinden dönüldüğünde, giriş öncesi seçilen tur geri alınır.
  const [player, setPlayer] = usePlayer(() => {
    const restored = readPendingChoice();
    if (restored) setPendingChoice(restored);
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [boardId, setBoardId] = useState<BoardId>("turkey");
  const [readyModes, setReadyModes] = useState<GameMode[]>([]);

  const { mapMarkup, mapError } = useMapMarkup(mode);
  const answerRecords = useMemo(
    () => selections.map((selected, index) => ({ location: correctLocationId(questions[index]), selected: normalizeLocationId(mode, selected) })),
    [mode, questions, selections],
  );
  const { leaderboards, leaderboardError, resetLeaderboards, playedBoardId, isResultSettled } = useLeaderboard({
    player,
    roundId,
    serverRound,
    // Antrenman turları kaydedilmez.
    isFinished: phase === "finished" && !isPractice,
    choice,
    answers: answerRecords,
    durationMs: completionDurationMs,
  });
  // Antrenman havuzu sıralamanınkinden dar olabilir (kıta, Normal havuzda bayrak); liste o havuzdan seçilir.
  const practicePoolIds = useMemo(() => (isPractice ? poolFor(choice).map(correctLocationId) : null), [choice, isPractice]);
  // Yarışta bu turun cevapları kaydedildikten sonra çekilir; oyuncunun az önceki cevapları da sayılsın.
  // Yarışta liste, sıralamada seçili sekmenin modunu izler; antrenmanda oynanan moddur.
  const statsBoard = BOARDS.find((board) => board.id === boardId) ?? BOARDS[0];
  const statsChoice = useMemo(() => (isPractice ? choice : choiceForBoard(statsBoard)), [choice, isPractice, statsBoard]);
  const mostMissed = useMostMissed({
    choice: statsChoice,
    locationIds: practicePoolIds,
    roundId,
    enabled: phase === "finished" && (isPractice || isResultSettled),
  });

  const currentQuestion = questions[questionIndex];
  const supabaseConfigured = getSupabaseClient() !== null;

  // Her iki harita da baştan indirilir; giriş ekranındaki her "Oyna" anında başlayabilsin.
  useEffect(() => {
    let isActive = true;
    GAME_MODES.forEach((option) => {
      void loadMapMarkup(option).then(
        () => {
          if (isActive) setReadyModes((current) => (current.includes(option) ? current : [...current, option]));
        },
        () => {},
      );
    });
    return () => { isActive = false; };
  }, []);

  const isRoundComplete = answers.length === questions.length;

  // Turun toplam süresini geri sayar ve süre dolunca turu bitirir. Son soru cevaplandığında
  // durur; aksi halde son cevabın ardından geçen gösterim süresi, kaydedilen süreyi ezebilir.
  // Antrenmanın süre sınırı yoktur.
  useEffect(() => {
    if (phase !== "playing" || isRoundComplete || isPractice) return;
    const updateRemaining = () => {
      const elapsedMs = gameStartedAt.current === null ? 0 : performance.now() - gameStartedAt.current;
      const remainingSeconds = Math.max(0, Math.ceil((GAME_DURATION_MS - elapsedMs) / 1000));
      setRemainingGameSeconds(remainingSeconds);
      if (remainingSeconds === 0) {
        setCompletionDurationMs(GAME_DURATION_MS);
        setPhase("finished");
      }
    };
    updateRemaining();
    const timer = window.setInterval(updateRemaining, 250);
    return () => window.clearInterval(timer);
  }, [isPractice, isRoundComplete, phase]);

  // Bayrak turlarında sıradaki bayrak önceden indirilir; yarışta bayrağın yüklenmesi süreden yemesin.
  useEffect(() => {
    if (phase !== "playing" || !isFlagChoice(choice)) return;
    questions.slice(questionIndex, questionIndex + 2).forEach((question) => {
      if ("code" in question) new window.Image().src = flagUrl(question.code);
    });
  }, [choice, phase, questionIndex, questions]);

  // Cevaptan sonra doğru cevabı gösterir, ardından sonraki soruya geçer.
  useEffect(() => {
    if (phase !== "playing" || !answerState) return;
    const startedAt = performance.now();
    const countdown = window.setInterval(
      () => setRemainingQuestionSeconds(Math.max(0, Math.ceil((QUESTION_TRANSITION_MS - (performance.now() - startedAt)) / 1000))),
      100,
    );
    const timer = window.setTimeout(() => {
      if (questionIndex === questions.length - 1) {
        if (!isPractice) {
          setPhase("finished");
          return;
        }
        setQuestions((current) => [...current, ...nextPracticeCycle(choice, current[current.length - 1])]);
      }
      setQuestionIndex((currentIndex) => currentIndex + 1);
      setAnswerState(null);
      setSelectedLocation(null);
    }, QUESTION_TRANSITION_MS);

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
    };
  }, [answerState, choice, isPractice, phase, questionIndex, questions.length]);

  function startGame(nextChoice: PlayChoice) {
    setChoice(nextChoice);
    setQuestions(roundFor(nextChoice));
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
    gameStartedAt.current = performance.now();
    setRoundId((current) => current + 1);
    // Yarış turu sunucuda da açılır; süre sunucuda ölçülsün. Misafir girişinden hemen sonra
    // `player` henüz güncellenmemiş olabilir, ama Supabase oturumu açıktır.
    setServerRound(nextChoice.kind === "ranked" ? startRankedRound(nextChoice) : null);
    setBoardId(boardIdFor(nextChoice));
    setPendingChoice(null);
    resetLeaderboards();
    setPhase("playing");
  }

  /**
   * Antrenman ve giriş yapılmış oyuncunun turu hemen başlar; sıralamalı turda giriş
   * yapılmamışsa seçim saklanıp giriş adımı açılır.
   */
  function play(choice: PlayChoice) {
    if (player || choice.kind === "practice") {
      startGame(choice);
      return;
    }
    setAuthError(null);
    setPendingChoice(choice);
    writePendingChoice(choice);
  }

  function finishPractice() {
    const elapsedMs = gameStartedAt.current === null ? 0 : performance.now() - gameStartedAt.current;
    setCompletionDurationMs(Math.round(elapsedMs));
    setPhase("finished");
  }

  function goHome() {
    setPhase("ready");
    setAuthError(null);
  }

  function cancelPendingChoice() {
    setPendingChoice(null);
    setAuthError(null);
    writePendingChoice(null);
  }

  async function signInWithGoogle() {
    const supabase = getSupabaseClient();
    if (!supabase) return setAuthError("Supabase bağlantısı yapılandırılmalıdır.");
    setIsSigningIn(true);
    setAuthError(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) {
      setAuthError("Google ile giriş başlatılamadı. Lütfen tekrar deneyin.");
      setIsSigningIn(false);
    }
  }

  async function signInAsGuest(rawName: string) {
    const name = rawName.trim();
    if (!name) return setAuthError("Sıralamada görünmek için bir ad yazın.");
    const supabase = getSupabaseClient();
    if (!supabase) return setAuthError("Supabase bağlantısı yapılandırılmalıdır.");
    setIsSigningIn(true);
    setAuthError(null);
    const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { display_name: name } } });
    if (error || !data.user) {
      setAuthError(`Misafir oturumu başlatılamadı: ${error?.message ?? "Supabase kullanıcı oluşturmadı."}`);
      setIsSigningIn(false);
      return;
    }
    setPlayer({ id: data.user.id, name, avatarUrl: null });
    setIsSigningIn(false);
    writePendingChoice(null);
    if (pendingChoice) startGame(pendingChoice);
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) return setAuthError("Çıkış yapılamadı. Lütfen tekrar deneyin.");
    setPlayer(null);
    setPhase("ready");
    setAuthError(null);
    cancelPendingChoice();
  }

  function chooseLocation(locationId: string) {
    if (phase !== "playing" || !currentQuestion || answerState) return;
    const isCorrect = isSameLocation(mode, locationId, correctLocationId(currentQuestion));

    if (!isPractice && questionIndex === questions.length - 1) {
      const elapsedMs = gameStartedAt.current === null ? 0 : performance.now() - gameStartedAt.current;
      setCompletionDurationMs(Math.round(Math.min(GAME_DURATION_MS, elapsedMs)));
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
  }

  return (
    <main
      className="flex h-[100dvh] flex-col bg-slate-50 text-slate-900"
      style={{ paddingLeft: "max(env(safe-area-inset-left), 0px)", paddingRight: "max(env(safe-area-inset-right), 0px)" }}
    >
      {/* Her ekran kendi kenar boşluklarını yönetir ve ekranın tamamını kullanır. */}
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {phase === "ready" ? (
          <IntroScreen
            authError={authError}
            isSigningIn={isSigningIn}
            onCancelPendingChoice={cancelPendingChoice}
            onGoogleSignIn={signInWithGoogle}
            onGuestSignIn={signInAsGuest}
            onPlay={play}
            onSignOut={signOut}
            pendingChoice={pendingChoice}
            player={player}
            readyModes={readyModes}
            supabaseConfigured={supabaseConfigured}
          />
        ) : phase === "finished" ? (
          <ResultScreen
            answeredCount={answers.length}
            bestStreak={bestStreak}
            choice={choice}
            durationMs={completionDurationMs}
            boardId={boardId}
            leaderboardError={leaderboardError}
            leaderboards={leaderboards}
            missedLocationIds={
              // "Sen de" işareti yalnızca oynanan modun listesinde anlamlı.
              isPractice || boardId === playedBoardId
                ? answerRecords.filter((answer) => answer.location !== answer.selected).map((answer) => answer.location)
                : []
            }
            mostMissed={mostMissed}
            mostMissedChoice={statsChoice}
            onBoardChange={setBoardId}
            onHome={goHome}
            onPlay={play}
            onSignOut={signOut}
            playedBoardId={playedBoardId}
            player={player}
            questionCount={questions.length}
            score={score}
          />
        ) : (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
            <GameTopBar
              answers={answers}
              answerState={answerState}
              choice={choice}
              onExit={goHome}
              onFinishPractice={finishPractice}
              onPlay={play}
              onSignOut={signOut}
              player={player}
              question={currentQuestion}
              questionCount={questions.length}
              remainingGameSeconds={remainingGameSeconds}
              remainingQuestionSeconds={remainingQuestionSeconds}
              score={score}
            />
            <GameMap
              activeLocationIds={continent ? continentLocationIds(continent) : null}
              answerState={answerState}
              homeView={continent ? continentInfo(continent).view : null}
              isInteractive
              mapError={mapError}
              mapMarkup={mapMarkup}
              mode={mode}
              onSelect={chooseLocation}
              question={currentQuestion}
              selectedLocation={selectedLocation}
            />
          </section>
        )}
      </div>

      <RotateOverlay />
    </main>
  );
}
