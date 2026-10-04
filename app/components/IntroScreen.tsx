"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPanel } from "./AuthPanel";
import { PlayButton } from "./PlayButton";
import { PlayerBadge } from "./PlayerBadge";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { Logo } from "./Logo";
import { DuelSetup } from "./intro/DuelSetup";
import { ModeGrid } from "./intro/ModeGrid";
import { RoomSetup } from "./intro/RoomSetup";
import { SoloSetup } from "./intro/SoloSetup";
import { duelPath } from "@/lib/duel";
import { boardIdFor, choiceLabel, GAME_DURATION_SECONDS, turkeyChoice, worldChoice, type GameMode, type PlayChoice, type PlayKind, type Player } from "@/lib/game";
import {
  setIntroMap,
  setLastGame,
  useIntroMap,
  useLastGame,
  useQuestionPrompt,
  useTurkeyPrompt,
  useWorldScope,
  type IntroGame,
} from "@/lib/intro-preferences";
import { roomPath } from "@/lib/room";
import { isContinentScope, type WorldScope } from "@/lib/world-countries";

type IntroScreenProps = {
  player: Player | null;
  readyModes: GameMode[];
  pendingChoice: PlayChoice | null;
  isSigningIn: boolean;
  authError: string | null;
  supabaseConfigured: boolean;
  onPlay: (choice: PlayChoice) => void;
  onCancelPendingChoice: () => void;
  onGoogleSignIn: () => void;
  onGuestSignIn: (name: string) => void;
  onSignOut: () => void;
};

/**
 * Giriş animasyonu sayfa yaşamı boyunca bir kez oynar. Sunucuda ve ilk istemci çiziminde
 * aynı değer okunduğu için hidrasyon uyuşmazlığı olmaz; oyundan ana menüye dönüldüğünde
 * bileşen yeniden kurulsa da animasyon tekrarlanmaz.
 */
let hasPlayedIntro = false;

/** Açılış katmanının çekilip bittiği an (globals.css'teki intro-curtain gecikmesi + süresi). */
const INTRO_CURTAIN_MS = 1820;
/** Seçim ekranı, katman çekilirken netleşmeye başlar. */
const INTRO_CONTENT_DELAY_MS = 1400;
/** İlk kartın gecikmesi; sonraki kartlar birer adım arayla gelir. */
const INTRO_CARD_DELAY_MS = INTRO_CONTENT_DELAY_MS + 80;
const INTRO_CARD_STEP_MS = 90;
/** Son kartın da netleştiği an (4 kart, globals.css'teki intro-focus süresi 700 ms). */
const INTRO_DONE_MS = INTRO_CARD_DELAY_MS + 3 * INTRO_CARD_STEP_MS + 700;

/**
 * Açılış katmanı: oyunun adı ekranın ortasında belirir, sonra katman çekilerek arkadaki
 * seçim ekranını açar. Yalnızca animasyonlu ilk açılışta çizilir.
 */
function IntroCurtain() {
  return (
    <div aria-hidden="true" className="intro-curtain fixed inset-0 z-40 flex items-center justify-center bg-slate-50 px-6">
      <Logo isHeading={false} size="curtain" />
    </div>
  );
}

export function IntroScreen({
  player,
  readyModes,
  pendingChoice,
  isSigningIn,
  authError,
  supabaseConfigured,
  onPlay,
  onCancelPendingChoice,
  onGoogleSignIn,
  onGuestSignIn,
  onSignOut,
}: IntroScreenProps) {
  const router = useRouter();
  const map = useIntroMap();
  const lastGame = useLastGame();
  const storedScope = useWorldScope();
  const prompt = useQuestionPrompt();
  const turkeyPrompt = useTurkeyPrompt();
  const [selectedGame, setSelectedGame] = useState<IntroGame | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Karar ilk çizimde donar: haritalar yüklenince gelen yeniden çizim animasyonu yarıda kesmesin.
  const [shouldAnimate] = useState(() => !hasPlayedIntro);
  const [isCurtainUp, setIsCurtainUp] = useState(false);
  // Animasyon bitince data-intro kaldırılır: "← Oyun modu" ile adım 1'e dönüldüğünde yeniden kurulan
  // kartlar açılış gecikmesini baştan beklemesin, hemen görünsün.
  const [isIntroDone, setIsIntroDone] = useState(false);
  // Katman kalkmadan data-intro kaldırılırsa katmanın çekilme animasyonu kesilip katman geri belirir.
  const isIntroPlaying = shouldAnimate && (!isIntroDone || !isCurtainUp);

  // Açılış katmanı çekildikten sonra DOM'dan kaldırılır. Hareket azaltma açıksa hiç beklenmez.
  useEffect(() => {
    hasPlayedIntro = true;
    if (!shouldAnimate) return;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const curtainTimer = window.setTimeout(() => setIsCurtainUp(true), isReducedMotion ? 0 : INTRO_CURTAIN_MS);
    const doneTimer = window.setTimeout(() => setIsIntroDone(true), isReducedMotion ? 0 : INTRO_DONE_MS);
    return () => {
      window.clearTimeout(curtainTimer);
      window.clearTimeout(doneTimer);
    };
  }, [shouldAnimate]);

  const kind: PlayKind = selectedGame === "practice" ? "practice" : "ranked";
  // Kıtaların kendi sıralaması yok; yarışta kapsam 179 ülkelik havuza düşer.
  const scope: WorldScope = kind === "ranked" && isContinentScope(storedScope) ? "hard" : storedScope;
  // Yarışta bayrak turu tek bir sıralamaya bağlı olduğu için havuzu kendisi belirler.
  const isScopeLocked = kind === "ranked" && prompt === "flag";
  const effectiveScope: WorldScope = isScopeLocked ? "hard" : scope;

  const choiceFor = (mode: GameMode, playKind: PlayKind): PlayChoice =>
    mode === "turkey" ? turkeyChoice(playKind, turkeyPrompt) : worldChoice(playKind, playKind === "ranked" && isContinentScope(storedScope) ? "hard" : storedScope, prompt);

  const goBack = () => setSelectedGame(null);

  // Oyuncu kartların netleşmesini beklemeden bir oyun seçtiyse animasyon da biter.
  const selectGame = (game: IntroGame) => {
    setIsIntroDone(true);
    setSelectedGame(game);
  };

  const start = () => {
    setLastGame(kind);
    onPlay(choiceFor(map, kind));
  };

  const content = () => {
    if (pendingChoice && !player) {
      return (
        <div className="mx-auto w-full max-w-2xl">
          <AuthPanel
            authError={authError}
            choiceLabel={choiceLabel(pendingChoice)}
            isSigningIn={isSigningIn}
            onCancel={onCancelPendingChoice}
            onGoogleSignIn={onGoogleSignIn}
            onGuestSignIn={onGuestSignIn}
            supabaseConfigured={supabaseConfigured}
          />
        </div>
      );
    }

    // Google girişinden dönüldü: seçim korundu, ama zamanlı turu oyuncu hazırken başlatıyoruz.
    if (pendingChoice) {
      return (
        <div className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-cyan-200 bg-cyan-50/60 p-6 sm:p-8">
          <p className="text-xl font-bold text-slate-900">
            Giriş tamam — <span className="text-cyan-700">{choiceLabel(pendingChoice)}</span> turun hazır
          </p>
          <p className="mt-1.5 text-sm text-slate-600">Başla dediğin anda {GAME_DURATION_SECONDS} saniyelik süre işlemeye başlar.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <PlayButton disabled={!readyModes.includes(pendingChoice.mode)} label="Başla" onClick={() => onPlay(pendingChoice)} />
            <button
              className="text-sm font-semibold text-slate-500 underline-offset-2 transition hover:text-cyan-700 hover:underline"
              onClick={onCancelPendingChoice}
              type="button"
            >
              Başka bir oyun seç
            </button>
          </div>
        </div>
      );
    }

    if (selectedGame === "duel" || selectedGame === "room") {
      const Setup = selectedGame === "duel" ? DuelSetup : RoomSetup;
      return <Setup map={map} onBack={goBack} onMapChange={setIntroMap} player={player} supabaseConfigured={supabaseConfigured} />;
    }

    if (selectedGame) {
      return (
        <SoloSetup
          isReady={readyModes.includes(map)}
          isScopeLocked={isScopeLocked}
          kind={kind}
          map={map}
          onBack={goBack}
          onMapChange={setIntroMap}
          onStart={start}
          prompt={prompt}
          scope={effectiveScope}
          turkeyPrompt={turkeyPrompt}
        />
      );
    }

    return (
      <ModeGrid
        introDelayMs={INTRO_CARD_DELAY_MS}
        introStepMs={INTRO_CARD_STEP_MS}
        lastGame={lastGame}
        onJoin={(game, code) => router.push(game === "duel" ? duelPath(code) : roomPath(code))}
        onSelect={selectGame}
        onShowLeaderboard={() => setIsLeaderboardOpen(true)}
      />
    );
  };

  return (
    <section className="flex h-full w-full flex-col gap-3 px-4 py-3 lg:gap-5 lg:px-8 lg:py-5" data-intro={isIntroPlaying ? "" : undefined}>
      <header className="flex shrink-0 items-center justify-between gap-3">
        <Logo />
        <PlayerBadge onSignOut={onSignOut} player={player} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col justify-center">{content()}</div>

      {isLeaderboardOpen && (
        <LeaderboardPanel
          currentPlayerId={player?.id}
          initialBoardId={boardIdFor(choiceFor(map, "ranked"))}
          onClose={() => setIsLeaderboardOpen(false)}
          supabaseConfigured={supabaseConfigured}
        />
      )}

      {shouldAnimate && !isCurtainUp && <IntroCurtain />}
    </section>
  );
}
