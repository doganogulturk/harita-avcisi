"use client";

import { useEffect, useMemo, useState } from "react";
import { GameMap, nextQuestionCountdown, streakCelebration, wrongPickNotice } from "./components/GameMap";
import { GameTopBar } from "./components/GameTopBar";
import { IntroScreen } from "./components/IntroScreen";
import { PlayTips } from "./components/PlayTips";
import { ResultScreen } from "./components/ResultScreen";
import { startRankedRound, useLeaderboard } from "@/lib/hooks/useLeaderboard";
import { useMostMissed } from "@/lib/hooks/useMostMissed";
import { loadMapMarkup, useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { type IntroGame, readPlayTipsSeen, setPlayTipsSeen } from "@/lib/intro-preferences";
import { canLockLandscape, isPortraitPhoneNow } from "@/lib/orientation";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { useRoundPlay } from "@/lib/hooks/useRoundPlay";
import { signInAsGuest as signInAsGuestSession, startGoogleSignIn } from "@/lib/auth";
import { startDailyRound } from "@/lib/daily";
import { questionForLocation } from "@/lib/duel";
import { getSupabaseClient } from "@/lib/supabase";
import { shuffle } from "@/lib/shuffle";
import { provinces } from "@/lib/turkish-plates";
import { continentInfo, continentLocationIds, countries, countriesIn } from "@/lib/world-countries";
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
    // Eski sürümlerin kaydettiği seçimde `kind` yok; o zamanlar yalnızca sıralamalı tur vardı. Kaldırılan dünya
    // "normal" modu 179 ülkelik dünya turuna çevrilir.
    if (!raw) return null;
    const choice: PlayChoice = { kind: "ranked", ...(JSON.parse(raw) as Omit<PlayChoice, "kind">) };
    return choice.mode === "world" ? { ...choice, difficulty: "hard" } : choice;
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

function poolFor({ mode, continent }: PlayChoice): Question[] {
  if (mode === "turkey") return provinces;
  return continent ? countriesIn(continent) : countries;
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
  const { leaderboards, leaderboardError, resetLeaderboards, playedBoardId, isResultSettled, saveResult, retrySave } = useLeaderboard({
    player,
    roundId,
    serverRound,
    // Antrenman turları kaydedilmez.
    isFinished: phase === "finished" && !isPractice,
    choice,
    answers: answerRecords,
    durationMs: completionDurationMs,
  });
  // Antrenman havuzu sıralamanınkinden dar olabilir (kıta); liste o havuzdan seçilir.
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

  // Dikey telefonda ilk oyundan önce ipuçları (yan çevir, iki parmakla yakınlaştır) bir kez gösterilir; tur ve süresi
  // ipuçları kapanınca başlar.
  const [tipsChoice, setTipsChoice] = useState<PlayChoice | null>(null);

  function startRound(nextChoice: PlayChoice) {
    if (isPortraitPhoneNow() && !readPlayTipsSeen()) setTipsChoice(nextChoice);
    else beginRound(nextChoice);
  }

  function finishTips() {
    setPlayTipsSeen();
    setTipsChoice(null);
    if (tipsChoice) beginRound(tipsChoice);
  }

  // Yarış turunun soruları sunucudan beklenirken "Tur hazırlanıyor" katmanı durur; süre sorular gelince başlar.
  const [isPreparing, setIsPreparing] = useState(false);
  // Günlük meydan okuma açılamadıysa (bugün oynandı, bağlantı yok) ana ekrandaki şeritte gösterilen not.
  const [dailyNotice, setDailyNotice] = useState<string | null>(null);

  /** Sunucunun verdiği yer kimliklerinden soruları kurar; eksik ya da tanınmayan varsa null. */
  function questionsFrom(choice: PlayChoice, ids: string[]): Question[] | null {
    const built = ids.map((id) => questionForLocation(choice.mode, id));
    return built.length === QUESTIONS_PER_ROUND && built.every((question) => question !== undefined) ? (built as Question[]) : null;
  }

  /**
   * Yarış turu sunucuda açılır ve sorularını sunucu seçer: skor o sorularla doğrulanır, süre sunucuda ölçülür.
   * Misafir girişinden hemen sonra `player` henüz güncellenmemiş olabilir, ama Supabase oturumu açıktır. Sunucuya
   * ulaşılamazsa tur yerel sorularla oynanır, sonucu kaydedilemez (sonuç ekranı bunu söyler). Antrenman hemen başlar.
   */
  function beginRound(nextChoice: PlayChoice) {
    if (nextChoice.kind === "practice") return launchRound(nextChoice, roundFor(nextChoice), null);
    if (isPreparing) return;
    setIsPreparing(true);
    setDailyNotice(null);
    // Günlük meydan okuma yalnızca sunucunun sorularıyla oynanır: herkes aynı soruları çözer, yerel yedek yok.
    if (nextChoice.daily) {
      void startDailyRound(nextChoice).then((started) => {
        setIsPreparing(false);
        if (started === "played") return setDailyNotice("Bu meydan okumayı bugün oynadın; yenisi gece yarısı.");
        const dailyQuestions = started && questionsFrom(nextChoice, started.questions);
        if (!started || !dailyQuestions) return setDailyNotice("Meydan okuma açılamadı. Bağlantını kontrol edip tekrar dene.");
        launchRound(nextChoice, dailyQuestions, started.roundId);
      });
      return;
    }
    void startRankedRound(nextChoice).then((started) => {
      setIsPreparing(false);
      const serverQuestions = started && questionsFrom(nextChoice, started.questions);
      if (started && serverQuestions) launchRound(nextChoice, serverQuestions, started.roundId);
      // Eski yol (sunucuda start_ranked_round yok): tur açıldı ama soruları tarayıcı seçer.
      else if (started && started.questions.length === 0) launchRound(nextChoice, roundFor(nextChoice), started.roundId);
      else launchRound(nextChoice, roundFor(nextChoice), null);
    });
  }

  function launchRound(nextChoice: PlayChoice, nextQuestions: Question[], serverRoundId: string | null) {
    setChoice(nextChoice);
    round.start(nextQuestions);
    setServerRound(nextChoice.kind === "ranked" ? Promise.resolve(serverRoundId) : null);
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
      startRound(choice);
      return;
    }
    setAuthError(null);
    setPendingChoice(choice);
    writePendingChoice(choice);
    // Giriş adımı ana menüde açılır; sonuç ekranından (antrenmandan yarışa davet) istendiyse oraya dönülür.
    round.reset();
  }

  // Ana menü açıldığında doğrudan bir oyunun ayar ekranıyla başlasın mı (sonuçtaki "Başka tur seç").
  const [introStartGame, setIntroStartGame] = useState<IntroGame | null>(null);

  function goHome() {
    setIntroStartGame(null);
    round.reset();
    setAuthError(null);
  }

  /** Sonuç ekranından, oynanan oyunun (Yarış / Antrenman) ayar ekranına: başka bir tur orada seçilir. */
  function chooseAnother() {
    goHome();
    setIntroStartGame(isPractice ? "practice" : "ranked");
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
    if (pendingChoice) startRound(pendingChoice);
  }

  async function signOut() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) return setAuthError("Çıkış yapılamadı. Lütfen tekrar deneyin.");
    clearPlayer();
  }

  /** Çıkışta: oyuncuya bağlı her şey sıfırlanır. */
  function clearPlayer() {
    setPlayer(null);
    round.reset();
    setAuthError(null);
    cancelPendingChoice();
  }

  // Android geri tuşu: oyundan ve sonuçtan ana menüye, giriş adımından oyun seçimine dönülür. Ana menüde ayar ekranından
  // kartlara geçiş tarayıcı geçmişiyle olur (IntroScreen).
  useBackHandler(
    () => {
      if (phase !== "ready") goHome();
      else cancelPendingChoice();
    },
    BACK_PRIORITY.screen,
    phase !== "ready" || pendingChoice !== null,
  );

  // Cevaptan sonraki bildirimler: yatayda haritanın üstünde, dikey telefonda üst barın ikinci satırında.
  const celebration = streakCelebration(answerState, round.streak);
  const wrongPick = wrongPickNotice(choice, answerState, round.selectedLocation);
  const countdown = nextQuestionCountdown(answerState, round.remainingQuestionSeconds, !isPractice && questionIndex === questions.length - 1);

  return (
    <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
      {/* Her ekran kendi kenar boşluklarını yönetir ve ekranın tamamını kullanır. */}
      <div className="flex min-h-0 w-full flex-1 flex-col">
        {phase === "ready" ? (
          <IntroScreen
            dailyNotice={dailyNotice}
            authError={authError}
            isSigningIn={isSigningIn}
            onCancelPendingChoice={cancelPendingChoice}
            onGoogleSignIn={signInWithGoogle}
            onGuestSignIn={signInAsGuest}
            onPlay={play}
            startGame={introStartGame}
            onSignOut={signOut}
            pendingChoice={pendingChoice}
            player={player}
            readyModes={readyModes}
            supabaseConfigured={supabaseConfigured}
          />
        ) : phase === "finished" ? (
          <ResultScreen
            answerRecords={answerRecords}
            answeredCount={answers.length}
            bestStreak={bestStreak}
            choice={choice}
            durationMs={completionDurationMs}
            boardId={boardId}
            leaderboardError={leaderboardError}
            onRetrySave={retrySave}
            saveResult={saveResult}
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
            onChooseAnother={chooseAnother}
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
              celebration={celebration}
              countdown={countdown}
              wrongPick={wrongPick}
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
              score={score}
            />
            <GameMap
              activeLocationIds={continent ? continentLocationIds(continent) : null}
              answerState={answerState}
              celebration={celebration}
              countdown={countdown}
              wrongPick={wrongPick}
              areNoticesInHeaderWhenNarrow
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
      {isPreparing && (
        <div aria-live="polite" className="delayed-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm" role="status">
          <p className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-xl shadow-slate-900/10">
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
            Tur hazırlanıyor…
          </p>
        </div>
      )}
      {tipsChoice && <PlayTips canLockLandscape={canLockLandscape()} onCancel={() => setTipsChoice(null)} onDone={finishTips} />}
    </main>
  );
}
