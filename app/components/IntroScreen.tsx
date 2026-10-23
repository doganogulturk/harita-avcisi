"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthPanel } from "./AuthPanel";
import { Guide } from "./intro/Guide";
import { LegalMenu } from "./LegalMenu";
import { PlayButton } from "./PlayButton";
import { PlayerBadge } from "./PlayerBadge";
import { SignInDialog } from "./SignInDialog";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { useLeaders } from "@/lib/hooks/useLeaderboard";
import { Logo } from "./Logo";
import { DuelSetup } from "./intro/DuelSetup";
import { ModeGrid, type CardLeader } from "./intro/ModeGrid";
import { RoomSetup } from "./intro/RoomSetup";
import { SoloSetup } from "./intro/SoloSetup";
import { duelPath } from "@/lib/duel";
import { boardIdFor, choiceLabel, formatTime, GAME_DURATION_SECONDS, QUESTIONS_PER_ROUND, type BoardId, turkeyChoice, worldChoice, type GameMode, type PlayChoice, type PlayKind, type Player } from "@/lib/game";
import {
  setGuideSeen,
  setIntroMap,
  useGuideSeen,
  useIntroMap,
  useQuestionPrompt,
  useTurkeyPrompt,
  useWorldScope,
  type IntroGame,
} from "@/lib/intro-preferences";
import { roomPath } from "@/lib/room";
import { type WorldScope } from "@/lib/world-countries";

/** Yarış kartında birincisi gösterilen sıralamalar. */
const HIGHLIGHT_BOARDS: { id: BoardId; place: string }[] = [
  { id: "turkey", place: "Türkiye'de" },
  { id: "world-hard", place: "Dünya'da" },
];

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
  /** Verilirse menü bu oyunun ayar ekranıyla (adım 2) açılır; sonuç ekranındaki "Başka tur seç". */
  startGame?: IntroGame | null;
};

/**
 * Giriş animasyonu sayfa yaşamı boyunca bir kez oynar. Sunucuda ve ilk istemci çiziminde
 * aynı değer okunduğu için hidrasyon uyuşmazlığı olmaz; oyundan ana menüye dönüldüğünde
 * bileşen yeniden kurulsa da animasyon tekrarlanmaz.
 */
let hasPlayedIntro = false;

/** Adım 2'nin tarayıcı geçmişindeki kaydında seçilen oyunun tutulduğu alan. */
const INTRO_STEP_KEY = "introStep";

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
  startGame = null,
}: IntroScreenProps) {
  const router = useRouter();
  const map = useIntroMap();
  const storedScope = useWorldScope();
  const prompt = useQuestionPrompt();
  const turkeyPrompt = useTurkeyPrompt();
  // Menünün açıldığı adım ilk çizimde donar; sonradan gelen prop değişikliği adımı değiştirmez.
  const [openedAtGame] = useState(startGame);
  const [selectedGame, setSelectedGame] = useState<IntroGame | null>(openedAtGame);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const isGuideSeen = useGuideSeen();
  const [isGuideRequested, setIsGuideRequested] = useState(false);

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

  // Tanıtım ilk ziyarette açılış animasyonundan sonra kendiliğinden açılır; giriş yapmış (eski) oyuncuya ve giriş
  // adımındaki oyuncuya gösterilmez. Bilgi menüsünden her zaman yeniden açılabilir.
  const isGuideOpen = isGuideRequested || (!isGuideSeen && !player && !pendingChoice && (!shouldAnimate || isCurtainUp));
  const closeGuide = () => {
    setGuideSeen();
    setIsGuideRequested(false);
  };

  const kind: PlayKind = selectedGame === "practice" ? "practice" : "ranked";
  // Kıtaların kendi sıralaması yok; yarış her zaman 179 ülkenin tamamından sorulur.
  const scope: WorldScope = kind === "ranked" ? "all" : storedScope;

  const choiceFor = (mode: GameMode, playKind: PlayKind): PlayChoice =>
    mode === "turkey" ? turkeyChoice(playKind, turkeyPrompt) : worldChoice(playKind, storedScope, prompt);

  // Adım 2 tarayıcı geçmişine bir kayıt olarak eklenir (adres değişmez): telefonda geri hareketi ve Android'in geri
  // tuşu siteden çıkmak yerine oyun seçimine döner. Kayıttan dönülünce (geri / ileri) adım kayıttaki oyuna uyar.
  useEffect(() => {
    // Oyundan menüye dönüldüğünde geçmişte eski bir adım 2 kaydı kalmış olabilir; temizlenir.
    if (window.history.state?.[INTRO_STEP_KEY]) window.history.replaceState({ [INTRO_STEP_KEY]: null }, "");
    // Doğrudan adım 2 ile açıldıysa o adım da geçmişe eklenir; geri hareketi oyun seçimine dönsün.
    if (openedAtGame) window.history.pushState({ [INTRO_STEP_KEY]: openedAtGame }, "");
    const syncWithHistory = (event: PopStateEvent) => setSelectedGame((event.state?.[INTRO_STEP_KEY] as IntroGame | undefined) ?? null);
    window.addEventListener("popstate", syncWithHistory);
    return () => window.removeEventListener("popstate", syncWithHistory);
  }, [openedAtGame]);

  const goBack = () => {
    if (window.history.state?.[INTRO_STEP_KEY]) window.history.back();
    else setSelectedGame(null);
  };

  /** Başlıktaki logo: hangi adımda olunursa olunsun oyun seçimine (adım 1) döner. */
  const goHome = () => {
    goBack();
    setIsLeaderboardOpen(false);
    if (pendingChoice) onCancelPendingChoice();
  };

  // Oyuncu kartların netleşmesini beklemeden bir oyun seçtiyse animasyon da biter.
  const selectGame = (game: IntroGame) => {
    setIsIntroDone(true);
    setSelectedGame(game);
    window.history.pushState({ [INTRO_STEP_KEY]: game }, "");
  };

  const start = () => {
    onPlay(choiceFor(map, kind));
  };

  // Yarış kartında Türkiye'nin ve Dünya'nın (isimle) birincisi; yüklenmeyen satır gösterilmez.
  const leaders = useLeaders(supabaseConfigured && selectedGame === null);
  const rankedBoardId = boardIdFor(choiceFor(map, "ranked"));
  const rankedLeaders: CardLeader[] = HIGHLIGHT_BOARDS.flatMap(({ id, place }) => {
    const leader = leaders[id];
    return leader
      ? [{ place, name: leader.display_name, score: `${leader.score}/${QUESTIONS_PER_ROUND}`, time: formatTime(Math.round(leader.duration_ms / 1000)) }]
      : [];
  });

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
          needsSignIn={kind === "ranked" && !player}
          kind={kind}
          map={map}
          onBack={goBack}
          onMapChange={setIntroMap}
          onStart={start}
          prompt={prompt}
          scope={scope}
          turkeyPrompt={turkeyPrompt}
        />
      );
    }

    return (
      <ModeGrid
        rankedLeaders={rankedLeaders}
        introDelayMs={INTRO_CARD_DELAY_MS}
        introStepMs={INTRO_CARD_STEP_MS}
        onJoin={(game, code) => router.push(game === "duel" ? duelPath(code) : roomPath(code))}
        onSelect={selectGame}
        onShowLeaderboard={() => setIsLeaderboardOpen(true)}
      />
    );
  };

  return (
    <section className="relative isolate flex h-full w-full flex-col px-4 py-3 short:py-2 lg:px-8 lg:py-5" data-intro={isIntroPlaying ? "" : undefined}>
      {/* Zemin: silik enlem-boylam çizgileri ve dünya haritası; menü bir harita oyununun içinde durur. Büyük ekranda
          kartların çevresinde kalan boşluğu doldurur, kartların altında yalnızca kenarlardan görünür. */}
      <div aria-hidden="true" className="intro-backdrop pointer-events-none absolute inset-0 -z-10">
        <span className="map-silhouette absolute inset-x-[4%] inset-y-[10%] bg-cyan-700 opacity-[0.05]" />
      </div>
      {/* Çok geniş ekranda kartlar şişmesin: içerik ortada en fazla 80rem genişlikte durur. */}
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-3 short:gap-2 lg:gap-5">
        <header className="flex shrink-0 items-center justify-between gap-3 max-[25rem]:gap-2">
          <h1 className="min-w-0">
            <button className="rounded-2xl transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none" onClick={goHome} title="Ana menü" type="button">
              <Logo isHeading={false} />
            </button>
          </h1>
          <div className="flex shrink-0 items-center gap-2 max-[25rem]:gap-1 lg:gap-3">
            <PlayerBadge onSignOut={onSignOut} player={player} />
            {/* Giriş yapmamış oyuncu istediği an giriş yapabilir; giriş tam oyuna başlarken sürpriz olmasın. */}
            {!player && supabaseConfigured && !pendingChoice && (
              <button
                className="hit-area rounded-full border border-cyan-200 bg-white px-3.5 py-1.5 text-sm font-bold whitespace-nowrap text-cyan-700 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none max-[25rem]:px-3 lg:px-4 lg:py-2"
                onClick={() => setIsSignInOpen(true)}
                type="button"
              >
                Giriş yap
              </button>
            )}
            <LegalMenu onShowGuide={() => setIsGuideRequested(true)} />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center">{content()}</div>
      </div>

      {isLeaderboardOpen && (
        <LeaderboardPanel
          currentPlayerId={player?.id}
          initialBoardId={rankedBoardId}
          onClose={() => setIsLeaderboardOpen(false)}
          supabaseConfigured={supabaseConfigured}
        />
      )}

      {isGuideOpen && (
        <Guide
          canSignIn={!player && supabaseConfigured}
          onClose={closeGuide}
          onGoogleSignIn={() => {
            closeGuide();
            onGoogleSignIn();
          }}
          onGuestSignIn={() => {
            closeGuide();
            setIsSignInOpen(true);
          }}
        />
      )}

      {isSignInOpen && !player && <SignInDialog onClose={() => setIsSignInOpen(false)} />}


      {shouldAnimate && !isCurtainUp && <IntroCurtain />}
    </section>
  );
}
