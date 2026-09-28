"use client";

import { useEffect, useMemo, useState } from "react";
import { GameMap } from "./components/GameMap";
import { GameTopBar } from "./components/GameTopBar";
import { IntroScreen } from "./components/IntroScreen";
import { ResultScreen } from "./components/ResultScreen";
import { RotateOverlay } from "./components/RotateOverlay";
import { startRankedRound, useLeaderboard } from "@/lib/hooks/useLeaderboard";
import { useMostMissed } from "@/lib/hooks/useMostMissed";
import { loadMapMarkup, useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useRoundPlay } from "@/lib/hooks/useRoundPlay";
import { signInAsGuest as signInAsGuestSession, startGoogleSignIn } from "@/lib/auth";
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
  GAME_MODES,
  QUESTIONS_PER_ROUND,
  type BoardId,
  type GameMode,
  type GamePhase,
  type PlayChoice,
  type Question,
} from "@/lib/game";
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
  const round = useRoundPlay({
    mode,
    timed: !isPractice,
    extend: isPractice ? (lastQuestion) => nextPracticeCycle(choice, lastQuestion) : undefined,
  });
  const { questions, questionIndex, currentQuestion, answers, answerRecords, answerState, score, bestStreak, completionDurationMs } = round;
  const phase: GamePhase = round.status === "idle" ? "ready" : round.status;
  const roundId = round.roundKey;
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

  // Bayrak turlarında sıradaki bayrak önceden indirilir; yarışta bayrağın yüklenmesi süreden yemesin.
  useEffect(() => {
    if (phase !== "playing" || !isFlagChoice(choice)) return;
    questions.slice(questionIndex, questionIndex + 2).forEach((question) => {
      if ("code" in question) new window.Image().src = flagUrl(question.code);
    });
  }, [choice, phase, questionIndex, questions]);

  function startGame(nextChoice: PlayChoice) {
    setChoice(nextChoice);
    round.start(roundFor(nextChoice));
    // Yarış turu sunucuda da açılır; süre sunucuda ölçülsün. Misafir girişinden hemen sonra
    // `player` henüz güncellenmemiş olabilir, ama Supabase oturumu açıktır.
    setServerRound(nextChoice.kind === "ranked" ? startRankedRound(nextChoice) : null);
    setBoardId(boardIdFor(nextChoice));
    setPendingChoice(null);
    resetLeaderboards();
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

  function goHome() {
    round.reset();
    setAuthError(null);
  }

  function cancelPendingChoice() {
    setPendingChoice(null);
    setAuthError(null);
    writePendingChoice(null);
  }

  async function signInWithGoogle() {
    setIsSigningIn(true);
    setAuthError(null);
    const error = await startGoogleSignIn(window.location.origin);
    if (error) {
      setAuthError(error);
      setIsSigningIn(false);
    }
  }

  async function signInAsGuest(rawName: string) {
    setIsSigningIn(true);
    setAuthError(null);
    const result = await signInAsGuestSession(rawName);
    setIsSigningIn(false);
    if ("error" in result) return setAuthError(result.error);
    setPlayer(result.player);
    writePendingChoice(null);
    if (pendingChoice) startGame(pendingChoice);
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) return setAuthError("Çıkış yapılamadı. Lütfen tekrar deneyin.");
    setPlayer(null);
    round.reset();
    setAuthError(null);
    cancelPendingChoice();
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
              onFinishPractice={round.finish}
              onPlay={play}
              onSignOut={signOut}
              player={player}
              question={currentQuestion}
              questionCount={questions.length}
              remainingGameSeconds={round.remainingGameSeconds}
              remainingQuestionSeconds={round.remainingQuestionSeconds}
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
              onSelect={round.choose}
              question={currentQuestion}
              selectedLocation={round.selectedLocation}
            />
          </section>
        )}
      </div>

      <RotateOverlay />
    </main>
  );
}
