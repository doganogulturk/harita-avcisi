"use client";

import { useEffect, useMemo, useState } from "react";
import { AnswerChoices } from "./components/AnswerChoices";
import { GameMap, nextQuestionCountdown, streakCelebration, wrongPickNotice } from "./components/GameMap";
import { GameTopBar } from "./components/GameTopBar";
import { DarkSystemBars } from "./components/NativeSystemBars";
import { IntroScreen } from "./components/IntroScreen";
import { PlayTips } from "./components/PlayTips";
import { ResultScreen } from "./components/ResultScreen";
import { choiceOptions } from "@/lib/choices";
import { neighborIds, neighborAsk, neighborOptions, neighborPool, neighborUniverse } from "@/lib/neighbors";
import { startRankedRound, useRoundSave } from "@/lib/hooks/useRoundSave";
import { useMostMissed } from "@/lib/hooks/useMostMissed";
import { useWeakSpots } from "@/lib/hooks/useWeakSpots";
import { loadMapMarkup, useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { type IntroGame, readPlayTipsSeen, setPlayTipsSeen } from "@/lib/intro-preferences";
import { canLockLandscape, isPortraitPhoneNow } from "@/lib/orientation";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { useRoundPlay } from "@/lib/hooks/useRoundPlay";
import { signInAsGuest as signInAsGuestSession, startGoogleSignIn } from "@/lib/auth";
import { startDailyRound } from "@/lib/daily";
import { questionForLocation } from "@/lib/duel";
import { messages } from "@/lib/i18n";
import { getSupabaseClient } from "@/lib/supabase";
import { shuffle } from "@/lib/shuffle";
import { provinces } from "@/lib/turkish-plates";
import { capitalOf } from "@/lib/world-capitals";
import { continentInfo, continentLocationIds, countries, countriesIn } from "@/lib/world-countries";
import {
  correctLocationId,
  flagUrl,
  isSavedChoice,
  locationName,
  isCapitalChoice,
  isFlagChoice,
  GAME_MODES,
  QUESTIONS_PER_ROUND,
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

/** Turun kapsamı: Türkiye'de 81 il, dünyada seçilen kıta ya da bütün ülkeler; başkent turunda yalnızca başkenti listede olanlar. */
function scopePoolFor(choice: PlayChoice): Question[] {
  const pool: Question[] = choice.mode === "turkey" ? provinces : choice.continent ? countriesIn(choice.continent) : countries;
  // Başkent turunda başkenti listede olmayan ülkeler (tartışmalılar, bağlı topraklar) sorulmaz.
  return choice.mode === "world" && isCapitalChoice(choice) ? pool.filter((question) => capitalOf(correctLocationId(question))) : pool;
}

function poolFor(choice: PlayChoice): Question[] {
  const scope = scopePoolFor(choice);
  // Komşuluk turunda yalnızca kapsamda komşusu olan yerler sorulur (ada ülkeleri sorulmaz).
  const asked = choice.neighbors ? neighborPool(choice.mode, scope) : scope;
  // "Bunları çalış": oyuncunun zayıf yerleri. Havuz yalnızca bu yerlerle kurulur; sunucudan eski bir yer kodu gelirse sorulmaz.
  if (!choice.focusIds) return asked;
  const focus = new Set(choice.focusIds);
  return asked.filter((question) => focus.has(correctLocationId(question)));
}

/** Oyna turu 10 soru sorar; antrenman tüm havuzu sırayla dolaşır. */
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
    // Günlük meydan okumada herkes her cevaptan sonra aynı 3 saniyeyi bekler; diğer turlarda gösterim kısadır.
    isQuick: !choice.daily,
  });
  const { questions, questionIndex, currentQuestion, answers, answerRecords, answerState, score, bestStreak, completionDurationMs } = round;
  const phase: GamePhase = round.status === "idle" ? "ready" : round.status;
  const roundId = round.roundKey;
  // Şıklı soru: dört şık soru başına bir kez üretilir (aynı soru antrenmanda yeniden gelince şıklar da yenilenir).
  // Komşuluk sorusunda haritada işaretlenen yer konudur ("X ile komşu olan / olmayan hangisi?"), soru havuzundaki yer cevaptır.
  // Konu ve sorunun olumlu mu olumsuz mu olduğu, tur ve sorunun sırasından türetilir (lib/neighbors.ts): aynı soruda hep aynıdır,
  // sonuç ekranı yeniden kurabilir.
  // Konu ve şıklar turun kapsamından seçilir (kıta antrenmanında o kıta, başkent turunda başkenti olan ülkeler).
  const universe = useMemo(() => (choice.neighbors ? neighborUniverse(choice.mode, scopePoolFor(choice)) : undefined), [choice]);
  const ask = useMemo(
    () => (choice.neighbors && currentQuestion ? neighborAsk(choice.mode, correctLocationId(currentQuestion), roundId, questionIndex, universe) : null),
    [choice.mode, choice.neighbors, currentQuestion, questionIndex, roundId, universe],
  );
  const subjectId = ask?.subject ?? null;
  // Sonuç ekranı için cevaplanan her sorunun konusu ve biçimi (komşuluk turunda); tur ve sıradan türetildiği için yeniden kurulur.
  const asks = useMemo(
    () => (choice.neighbors ? answerRecords.map((answer, index) => neighborAsk(choice.mode, answer.location, roundId, index, universe)) : null),
    [answerRecords, choice.mode, choice.neighbors, roundId, universe],
  );
  const options = useMemo(() => {
    if (!choice.choices || !currentQuestion) return null;
    if (ask) return neighborOptions(choice.mode, ask.subject, correctLocationId(currentQuestion), universe, ask.isNegative);
    return choiceOptions(choice, currentQuestion, poolFor({ ...choice, focusIds: undefined }));
    // questionIndex değerde kullanılmaz, yalnızca tetikleyicidir: aynı yer antrenmanda yeniden sorulunca şıklar yenilensin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ask, choice, currentQuestion, questionIndex, universe]);
  const [serverRound, setServerRound] = useState<Promise<string | null> | null>(null);

  const [pendingChoice, setPendingChoice] = useState<PlayChoice | null>(null);
  // Google girişinden dönüldüğünde, giriş öncesi seçilen tur geri alınır.
  const [player, setPlayer] = usePlayer(() => {
    const restored = readPendingChoice();
    if (restored) setPendingChoice(restored);
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [readyModes, setReadyModes] = useState<GameMode[]>([]);

  const { mapMarkup, mapError } = useMapMarkup(mode);
  // Giriş yapmış oyuncunun Oyna turu kaydedilir (profil, rozetler, en çok yanlış yapılanlar); girişsizde ve antrenmanda hiçbir şey yazılmaz.
  const { isResultSettled, saveResult, retrySave } = useRoundSave({
    player,
    roundId,
    serverRound,
    isFinished: phase === "finished" && isSavedChoice(choice),
    answers: answerRecords,
    durationMs: completionDurationMs,
  });
  // Antrenman havuzu oynanan modunkinden dar olabilir (kıta); liste o havuzdan seçilir.
  const practicePoolIds = useMemo(() => (isPractice ? poolFor(choice).map(correctLocationId) : null), [choice, isPractice]);
  // Bu turun cevapları kaydedildikten sonra çekilir; oyuncunun az önceki cevapları da sayılsın.
  const mostMissed = useMostMissed({
    choice,
    locationIds: practicePoolIds,
    roundId,
    enabled: phase === "finished" && !choice.neighbors && (isPractice || isResultSettled),
  });

  // Oyuncunun kendi zayıf yerleri: yalnızca giriş yapmış oyuncuda ve tur bittiğinde çekilir. Oyna turunda önce bu turun
  // cevapları kaydedilir ki liste güncel olsun; antrenman kaydedilmediği için hemen çekilir (önceki turlardan gelir).
  const weakSpots = useWeakSpots({
    player,
    choice,
    roundId,
    enabled: phase === "finished" && !choice.neighbors && (isPractice || isResultSettled),
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

  // Oyna turunun soruları sunucudan beklenirken "Tur hazırlanıyor" katmanı durur; süre sorular gelince başlar.
  const [isPreparing, setIsPreparing] = useState(false);
  // Günlük meydan okuma açılamadıysa (bugün oynandı, bağlantı yok) ana ekranda günün meydan okuması sayfasında gösterilen not.
  const [dailyNotice, setDailyNotice] = useState<string | null>(null);

  /** Sunucunun verdiği yer kimliklerinden soruları kurar; eksik ya da tanınmayan varsa null. */
  function questionsFrom(choice: PlayChoice, ids: string[]): Question[] | null {
    const built = ids.map((id) => questionForLocation(choice.mode, id));
    return built.length === QUESTIONS_PER_ROUND && built.every((question) => question !== undefined) ? (built as Question[]) : null;
  }

  /**
   * Giriş yapmış oyuncunun Oyna turu sunucuda açılır ve sorularını sunucu seçer: skor o sorularla doğrulanır, süre
   * sunucuda ölçülür. Misafir girişinden hemen sonra `player` henüz güncellenmemiş olabilir, ama Supabase oturumu açıktır;
   * bu yolla yalnızca günlük meydan okuma başlar. Sunucuya ulaşılamazsa tur yerel sorularla oynanır, sonucu kaydedilemez
   * (sonuç ekranı bunu söyler). Girişsiz oyuncunun turu ve antrenman hemen başlar; hiçbir şey kaydedilmez. Komşuluk turu
   * (Oyna'da da) hiçbir zaman kaydedilmez: sunucu yalnızca cevap olan ili görür, konuyu bilmez; kayıt "Kayseri bilindi" gibi
   * okunur ve 81 il rozetini ile zayıf yer listesini bozar (docs/GELISTIRME.md, "Komşuluk sorusu").
   */
  function beginRound(nextChoice: PlayChoice) {
    if (!isSavedChoice(nextChoice) || (!player && !nextChoice.daily)) return launchRound(nextChoice, roundFor(nextChoice), null);
    if (isPreparing) return;
    setIsPreparing(true);
    setDailyNotice(null);
    // Günlük meydan okuma yalnızca sunucunun sorularıyla oynanır: herkes aynı soruları çözer, yerel yedek yok.
    if (nextChoice.daily) {
      void startDailyRound(nextChoice).then((started) => {
        setIsPreparing(false);
        if (started === "played") return setDailyNotice(messages().game.dailyPlayed);
        const dailyQuestions = started && questionsFrom(nextChoice, started.questions);
        if (!started || !dailyQuestions) return setDailyNotice(messages().game.dailyFailed);
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
    setServerRound(isSavedChoice(nextChoice) ? Promise.resolve(serverRoundId) : null);
    setPendingChoice(null);
  }

  /**
   * Oyna, antrenman ve giriş yapmış oyuncunun turu hemen başlar; giriş yalnızca günün meydan okuması için gerekir
   * (sorularını sunucu verir). Girişsizse seçim saklanıp giriş adımı açılır.
   */
  function play(choice: PlayChoice) {
    if (player || !choice.daily) {
      startRound(choice);
      return;
    }
    setAuthError(null);
    setPendingChoice(choice);
    writePendingChoice(choice);
    // Giriş adımı ana menüde açılır; sonuç ekranından istendiyse oraya dönülür.
    round.reset();
  }

  // Ana menü açıldığında doğrudan bir oyunun ayar ekranıyla başlasın mı (sonuçtaki "Başka tur seç").
  const [introStartGame, setIntroStartGame] = useState<IntroGame | null>(null);

  function goHome() {
    setIntroStartGame(null);
    round.reset();
    setAuthError(null);
  }

  /** Sonuç ekranından, oynanan oyunun (Oyna / Antrenman) ayar ekranına: başka bir tur orada seçilir. */
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
    if (error) return setAuthError(messages().game.signOutFailed);
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
  // Yanlış cevaptan sonra gösterilecek komşular (lib/neighbors.ts); komşuluk turunda ise konunun komşuları (cevap bunlardan biridir).
  // Kıta antrenmanında kıta dışındaki komşular haritada soluk olduğu için gösterilmez.
  const correctNeighbors = useMemo(() => {
    if (!currentQuestion) return null;
    const ids = neighborIds(choice.mode, subjectId ?? correctLocationId(currentQuestion));
    return continent ? ids.filter((id) => continentLocationIds(continent).has(id)) : ids;
  }, [choice.mode, continent, currentQuestion, subjectId]);
  const countdown = nextQuestionCountdown(
    answerState,
    round.remainingQuestionSeconds,
    !isPractice && questionIndex === questions.length - 1,
    !choice.daily,
  );

  return (
    <main className="safe-area sea-backdrop flex h-[100dvh] flex-col text-slate-900">
      <DarkSystemBars />
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
            pendingChoice={pendingChoice}
            player={player}
            readyModes={readyModes}
            supabaseConfigured={supabaseConfigured}
          />
        ) : phase === "finished" ? (
          <ResultScreen
            answerRecords={answerRecords}
            subjects={asks}
            answeredCount={answers.length}
            bestStreak={bestStreak}
            choice={choice}
            durationMs={completionDurationMs}
            onRetrySave={retrySave}
            saveResult={saveResult}
            missedLocationIds={answerRecords.filter((answer) => answer.location !== answer.selected).map((answer) => answer.location)}
            mostMissed={mostMissed}
            weakSpots={weakSpots}
            onChooseAnother={chooseAnother}
            onHome={goHome}
            onPlay={play}
            player={player}
            questionCount={questions.length}
            score={score}
          />
        ) : (
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <GameTopBar
              celebration={celebration}
              countdown={countdown}
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
              neighborAsk={ask}
              score={score}
            />
            <GameMap
              activeLocationIds={continent ? continentLocationIds(continent) : null}
              answerState={answerState}
              celebration={celebration}
              countdown={countdown}
              wrongPick={wrongPick}
              neighborIds={correctNeighbors}
              alwaysShowNeighbors={Boolean(choice.neighbors)}
              neighborsLabel={subjectId ? messages().game.neighborsOfSubject(locationName(choice.mode, subjectId)) : null}
              areNoticesInHeaderWhenNarrow
              homeView={continent ? continentInfo(continent).view : null}
              isInteractive
              isMarking={Boolean(choice.choices)}
              markedLocation={subjectId}
              mapError={mapError}
              mapMarkup={mapMarkup}
              mode={mode}
              onContinue={choice.daily ? undefined : round.skip}
              onSelect={round.choose}
              question={currentQuestion}
              selectedLocation={round.selectedLocation}
            />
            {options && currentQuestion && (
              <AnswerChoices
                answerState={answerState}
                choice={choice}
                correctLocation={correctLocationId(currentQuestion)}
                onPick={round.choose}
                options={options}
                selectedLocation={round.selectedLocation}
              />
            )}
          </section>
        )}
      </div>
      {isPreparing && (
        <div aria-live="polite" className="delayed-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-50/50 backdrop-blur-sm" role="status">
          <p className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-xl shadow-slate-900/10">
            <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-cyan-600" />
            {messages().game.preparing}
          </p>
        </div>
      )}
      {tipsChoice && <PlayTips canLockLandscape={canLockLandscape()} onCancel={() => setTipsChoice(null)} onDone={finishTips} />}
    </main>
  );
}
