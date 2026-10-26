"use client";

import { type PointerEvent, useEffect, useRef, useState } from "react";
import { DemoPill, useDemoCycle, type DemoQuestion } from "../MapDemo";
import { PinchDemo, RotateDemo } from "../PlayTips";
import { Logo } from "../Logo";
import { GAME_DURATION_SECONDS, isSameLocation, LOCATION_SELECTOR, locationIdOf, QUESTIONS_PER_ROUND } from "@/lib/game";
import { useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { messages } from "@/lib/i18n";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { gameInfo, GameIcon, GAMES, GROUPS } from "./games";

type GuideProps = {
  /** Giriş yapılmamışsa (ve Supabase kuruluysa) son ekranda giriş seçenekleri çıkar. */
  canSignIn: boolean;
  /** "Geç" ve son ekrandaki "Başlayalım": tanıtım kapanır, ana ekrandaki oyun seçimi görünür. */
  onClose: () => void;
  onGoogleSignIn: () => void;
  /** Misafir adıyla giriş penceresini açar. */
  onGuestSignIn: () => void;
};

/** Parmağın yatayda bu kadar kayması bir sonraki / önceki ekrana geçirir. */
const SWIPE_THRESHOLD_PX = 50;

/**
 * İlk açılışta gösterilen tanıtım: nasıl oynanır, (dokunmatik cihazda) telefonda yan çevir ve yakınlaştır, tek başına ve
 * arkadaşlarla oynanan oyunlar,
 * arkadaşlarla oynamak. Kaydırarak, oklarla ya
 * da alttaki tuşlarla gezilir; "Geç" her ekranda durur. Son ekranın asıl tuşu ana ekrandaki oyun seçimine götürür,
 * giriş yalnızca bir seçenek olarak sunulur. Bilgi menüsündeki "Nasıl oynanır?" ile yeniden açılır.
 */
export function Guide({ canSignIn, onClose, onGoogleSignIn, onGuestSignIn }: GuideProps) {
  const [index, setIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  // Telefon ve tablette ikinci ekran yan çevirmeyi ve iki parmakla yakınlaştırmayı gösterir; farede gereksiz.
  const [isTouch] = useState(() => window.matchMedia("(pointer: coarse)").matches);
  const guide = messages().guide;
  const slides = [
    {
      eyebrow: guide.howEyebrow,
      title: guide.howTitle,
      body: guide.howBody,
      visual: <MapDemo />,
    },
    ...(isTouch
      ? [
          {
            eyebrow: guide.touchEyebrow,
            title: guide.touchTitle,
            body: guide.touchBody,
            visual: <TouchDemo />,
          },
        ]
      : []),
    {
      eyebrow: guide.gamesEyebrow,
      title: guide.gamesTitle,
      body: guide.gamesBody(QUESTIONS_PER_ROUND, GAME_DURATION_SECONDS),
      visual: <GamesDemo />,
    },
    {
      eyebrow: guide.friendsEyebrow,
      title: guide.friendsTitle,
      body: guide.friendsBody,
      visual: <DuelDemo />,
    },
  ];
  const isLast = index === slides.length - 1;
  useBackHandler(onClose, BACK_PRIORITY.dialog);
  const goTo = (next: number) => setIndex(Math.max(0, Math.min(slides.length - 1, next)));

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") setIndex((current) => Math.min(slides.length - 1, current + 1));
      if (event.key === "ArrowLeft") setIndex((current) => Math.max(0, current - 1));
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, slides.length]);

  const endSwipe = (event: PointerEvent<HTMLDivElement>) => {
    const startX = swipeStartX.current;
    swipeStartX.current = null;
    if (startX === null) return;
    const deltaX = event.clientX - startX;
    if (deltaX <= -SWIPE_THRESHOLD_PX) goTo(index + 1);
    if (deltaX >= SWIPE_THRESHOLD_PX) goTo(index - 1);
  };

  return (
    <div aria-label={guide.dialog} aria-modal="true" className="safe-area fixed inset-0 z-40 flex flex-col bg-slate-50" role="dialog">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 short:pt-2 lg:px-8 lg:pt-5">
        <Logo isHeading={false} />
        <button
          className="hit-area rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
          onClick={onClose}
          type="button"
        >
          {guide.skip}
        </button>
      </div>

      {/* Dikey kaydırma tarayıcıda kalır; yatay kaydırma ekran değiştirir. */}
      <div
        className="min-h-0 flex-1 touch-pan-y overflow-hidden"
        onPointerCancel={() => (swipeStartX.current = null)}
        onPointerDown={(event) => (swipeStartX.current = event.clientX)}
        onPointerUp={endSwipe}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, slideIndex) => (
            <section
              aria-hidden={slideIndex !== index}
              aria-roledescription={guide.slide}
              className="flex h-full w-full shrink-0 flex-col justify-center gap-4 overflow-y-auto px-4 py-3 short:py-2 md:flex-row md:items-center md:gap-8 lg:gap-12 lg:px-8"
              inert={slideIndex !== index}
              key={slide.title}
            >
              {/* Dikeyde görsel metnin üstünde, sınırlı boyda; yatayda solda, slaytın yüksekliğinde. */}
              <div className="flex min-h-[12rem] flex-1 items-center justify-center max-md:max-h-[20rem] md:h-full md:min-h-0 md:max-h-[30rem]">{slide.visual}</div>

              <div className="shrink-0 md:w-[44%] lg:w-[40%]">
                <p className="text-xs font-bold tracking-[0.2em] text-cyan-700 uppercase">
                  {slideIndex + 1} / {slides.length} · {slide.eyebrow}
                </p>
                <h2 className="mt-2 font-display text-3xl leading-tight font-bold text-slate-900 short:mt-1 short:text-2xl lg:text-5xl">{slide.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 short:mt-2 short:text-[13px] short:leading-snug lg:text-lg">{slide.body}</p>

                {slideIndex === slides.length - 1 && canSignIn && (
                  <div className="mt-4 short:mt-2.5">
                    <p className="text-xs text-slate-500">{guide.signInPrompt}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        className="flex items-center gap-2 rounded-xl border border-[#747775] bg-white px-3.5 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f8fafd] focus-visible:ring-2 focus-visible:ring-[#0b57d0] focus-visible:outline-none short:py-1.5"
                        onClick={onGoogleSignIn}
                        type="button"
                      >
                        <GoogleMark />
                        {guide.google}
                      </button>
                      <button
                        className="rounded-xl border border-cyan-600 bg-white px-3.5 py-2 text-sm font-bold text-cyan-700 transition hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:py-1.5"
                        onClick={onGuestSignIn}
                        type="button"
                      >
                        {guide.guest}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-1 pb-3 short:pb-2 lg:px-8 lg:pb-6">
        <button
          className={`hit-area rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${index === 0 ? "invisible" : ""}`}
          onClick={() => goTo(index - 1)}
          type="button"
        >
          {guide.back}
        </button>

        <div className="flex items-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              aria-current={slideIndex === index ? "step" : undefined}
              aria-label={guide.stepLabel(slideIndex + 1, slide.title)}
              className={`hit-area h-2 rounded-full transition-all duration-300 ${slideIndex === index ? "w-6 bg-cyan-600" : "w-2 bg-slate-300 hover:bg-slate-400"}`}
              key={slide.title}
              onClick={() => goTo(slideIndex)}
              type="button"
            />
          ))}
        </div>

        <button
          autoFocus
          className="flex items-center gap-2 rounded-full bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-cyan-600/20 transition-all hover:gap-3 hover:bg-cyan-500 focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:outline-none short:py-2 lg:px-7 lg:py-3 lg:text-base"
          onClick={isLast ? onClose : () => goTo(index + 1)}
          type="button"
        >
          {isLast ? guide.done : guide.next}
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/**
 * Tanıtım haritasında sırayla sorulanlar: Türkiye ve dünya, isim, plaka, bayrak ve başkent soruları karışık. Önce soru
 * çıkar, bir an sonra doğru yer yeşil yanar.
 */
const DEMO_QUESTIONS: DemoQuestion[] = [
  { mode: "turkey", id: "6", prompt: "name" },
  { mode: "world", id: "jp", prompt: "name" },
  { mode: "turkey", id: "35", prompt: "plate" },
  { mode: "world", id: "br", prompt: "flag" },
  { mode: "world", id: "eg", prompt: "name" },
  { mode: "turkey", id: "61", prompt: "name" },
  { mode: "world", id: "au", prompt: "capital" },
];
const GUIDE_STEP_MS = 1300;

/** Gerçek haritada oyunun soruları: soru çıkar, ardından yer yeşil yanar; sonraki soruya (gerekirse haritaya) geçilir. */
function MapDemo() {
  // İki harita da baştan yüklenir; soru haritayı değiştirdiğinde beklemeden çizilsin.
  const turkey = useMapMarkup("turkey");
  const world = useMapMarkup("world");
  const containerRef = useRef<HTMLDivElement>(null);
  const { index, isRevealed } = useDemoCycle(DEMO_QUESTIONS.length, "guide", GUIDE_STEP_MS);
  const question = DEMO_QUESTIONS[index];
  const mapMarkup = question.mode === "turkey" ? turkey.mapMarkup : world.mapMarkup;

  useEffect(() => {
    containerRef.current?.querySelectorAll<SVGElement>(LOCATION_SELECTOR[question.mode]).forEach((location) => {
      location.classList.toggle("map-correct", isRevealed && isSameLocation(question.mode, locationIdOf(location, question.mode), question.id));
    });
  }, [isRevealed, mapMarkup, question]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-slate-200 bg-white p-3 lg:p-6">
      <DemoPill className="top-3 text-lg lg:top-5 lg:text-2xl" isRevealed={isRevealed} question={question} />
      {mapMarkup && (
        <div
          aria-hidden="true"
          className="map pointer-events-none mt-8 lg:mt-10"
          dangerouslySetInnerHTML={{ __html: mapMarkup }}
          key={question.mode}
          ref={containerRef}
        />
      )}
    </div>
  );
}

/** İki grup ve içlerindeki oyunlar, giriş ekranındaki renkleri ve simgeleriyle. */
/** Yan çevrilen telefon ve iki parmakla yakınlaştırma, dikeyde ilk oyundan önceki ipuçlarıyla (PlayTips) aynı. */
function TouchDemo() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-2 lg:gap-4">
      <div className="flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white p-2">
        <RotateDemo />
      </div>
      <div className="flex items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-2">
        <div className="origin-center scale-75 sm:scale-100">
          <PinchDemo />
        </div>
      </div>
    </div>
  );
}

function GamesDemo() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-2 lg:gap-4">
      {GROUPS.map((group) => (
        <div className={`flex min-w-0 flex-col justify-center gap-2 rounded-2xl border-2 border-slate-200 p-3 short:gap-1 short:p-2 lg:gap-3 lg:p-5 ${group.theme.surface}`} key={group.id}>
          <p className="font-display text-xl leading-none font-bold text-slate-900 short:text-lg lg:text-3xl">{group.title}</p>
          {group.games.map((id) => {
            const game = gameInfo(id);
            return (
              <div className="flex min-w-0 items-center gap-2 rounded-xl bg-white/80 p-1.5 shadow-sm lg:p-2.5" key={id}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg short:h-6 short:w-6 lg:h-10 lg:w-10 ${game.theme.tile}`}>
                  <GameIcon className="h-4 w-4 short:h-3.5 short:w-3.5 lg:h-6 lg:w-6" game={id} />
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-slate-900 lg:text-lg">{game.title}</span>
                  <span className="block truncate text-xs text-slate-500 short:hidden lg:text-sm">{game.facts.slice(0, 2).join(" · ")}</span>
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Düello: paylaşılan kod ve iki oyuncunun canlı skoru. */
function DuelDemo() {
  const duel = GAMES.find((game) => game.id === "duel") ?? GAMES[0];
  return (
    <div className="flex h-full w-full flex-col justify-center gap-3 rounded-3xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 via-white to-white p-4 lg:gap-5 lg:p-8">
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 font-display text-xl font-bold text-slate-900 lg:text-3xl">
          <span className={`flex h-8 w-8 items-center justify-center rounded-xl lg:h-11 lg:w-11 ${duel.theme.tile}`}>
            <GameIcon className="h-4 w-4 lg:h-6 lg:w-6" game="duel" />
          </span>
          {duel.title}
        </span>
        <span className="rounded-xl border border-orange-200 bg-white px-3 py-1 font-mono text-sm font-bold tracking-[0.25em] text-slate-800 lg:text-lg">KOD123</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-white p-3 shadow-sm lg:p-5">
        <DemoPlayer initial={messages().guide.youInitial} name={messages().guide.you} score={7} tone="bg-cyan-100 text-cyan-700" />
        <span className="font-display text-lg font-bold text-slate-300 lg:text-2xl">–</span>
        <DemoPlayer initial={messages().guide.opponentInitial} isRight name={messages().guide.opponent} score={5} tone="bg-orange-100 text-orange-700" />
      </div>
      <p className="text-center text-xs text-slate-500 lg:text-sm">⚡ {messages().duelRules.snatch.label} · {duel.facts[1]}</p>
    </div>
  );
}

function DemoPlayer({ initial, name, score, tone, isRight = false }: { initial: string; name: string; score: number; tone: string; isRight?: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${isRight ? "flex-row-reverse" : ""}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold lg:h-12 lg:w-12 ${tone}`}>{initial}</span>
      <div className={isRight ? "text-right" : ""}>
        <p className="text-xs font-semibold text-slate-500 lg:text-sm">{name}</p>
        <p className="font-display text-2xl leading-none font-bold text-slate-900 lg:text-4xl">{score}</p>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 48 48">
      <path d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" fill="#4285F4" />
      <path d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" fill="#34A853" />
      <path d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" fill="#FBBC05" />
      <path d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" fill="#EA4335" />
    </svg>
  );
}
