"use client";

import Image from "next/image";
import { type PointerEvent, useEffect, useRef, useState } from "react";
import { PlateBadge } from "../GameTopBar";
import { Logo } from "../Logo";
import { flagUrl, GAME_DURATION_SECONDS, isSameLocation, LOCATION_SELECTOR, locationIdOf, QUESTIONS_PER_ROUND, type GameMode } from "@/lib/game";
import { useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { provinces } from "@/lib/turkish-plates";
import { countries } from "@/lib/world-countries";
import { GameIcon, GAMES } from "./games";

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
 * İlk açılışta gösterilen üç ekranlık tanıtım: nasıl oynanır, dört oyun, arkadaşlarla oynamak. Kaydırarak, oklarla ya
 * da alttaki tuşlarla gezilir; "Geç" her ekranda durur. Son ekranın asıl tuşu ana ekrandaki oyun seçimine götürür,
 * giriş yalnızca bir seçenek olarak sunulur. Bilgi menüsündeki "Nasıl oynanır?" ile yeniden açılır.
 */
export function Guide({ canSignIn, onClose, onGoogleSignIn, onGuestSignIn }: GuideProps) {
  const [index, setIndex] = useState(0);
  const swipeStartX = useRef<number | null>(null);
  const slides = [
    {
      eyebrow: "Nasıl oynanır",
      title: "Sorulan yeri haritada bul",
      body: "Ekrana bir il, ülke, plaka ya da bayrak gelir; haritada yerine dokunursun. Doğruysa yeşil yanar, yanlışsa doğru yer gösterilir. Küçük yerler için iki parmakla yakınlaştır.",
      visual: <MapDemo />,
    },
    {
      eyebrow: "Dört oyun",
      title: "Nasıl istersen öyle oyna",
      body: `Yarışta ${QUESTIONS_PER_ROUND} soru, ${GAME_DURATION_SECONDS} saniye ve sıralama var. Antrenmanda süre yok, istediğin kıtayı çalışırsın. Düello ve Oda ise arkadaşlarınla.`,
      visual: <GamesDemo />,
    },
    {
      eyebrow: "Arkadaşlarınla",
      title: "Kodu gönder, yarışın",
      body: "Düello ya da oda kur, kodu veya bağlantıyı paylaş. Arkadaşların açınca aynı sorularla aynı anda yarışırsınız.",
      visual: <DuelDemo />,
    },
  ];
  const isLast = index === slides.length - 1;
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
    <div aria-label="Harita Avcısı tanıtımı" aria-modal="true" className="safe-area fixed inset-0 z-40 flex flex-col bg-slate-50" role="dialog">
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 short:pt-2 lg:px-8 lg:pt-5">
        <Logo isHeading={false} />
        <button
          className="hit-area rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
          onClick={onClose}
          type="button"
        >
          Geç
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
              aria-roledescription="slayt"
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
                    <p className="text-xs text-slate-500">Yarış, düello ve oda için giriş gerekir; istersen şimdi yap:</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        className="flex items-center gap-2 rounded-xl border border-[#747775] bg-white px-3.5 py-2 text-sm font-medium text-[#1f1f1f] transition hover:bg-[#f8fafd] focus-visible:ring-2 focus-visible:ring-[#0b57d0] focus-visible:outline-none short:py-1.5"
                        onClick={onGoogleSignIn}
                        type="button"
                      >
                        <GoogleMark />
                        Google ile giriş
                      </button>
                      <button
                        className="rounded-xl border border-cyan-600 bg-white px-3.5 py-2 text-sm font-bold text-cyan-700 transition hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:py-1.5"
                        onClick={onGuestSignIn}
                        type="button"
                      >
                        Misafir adıyla
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
          ← Geri
        </button>

        <div className="flex items-center gap-2">
          {slides.map((slide, slideIndex) => (
            <button
              aria-current={slideIndex === index ? "step" : undefined}
              aria-label={`${slideIndex + 1}. ekran: ${slide.title}`}
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
          {isLast ? "Başlayalım" : "İleri"}
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

type DemoQuestion = { mode: GameMode; id: string; prompt: "name" | "plate" | "flag" };

/**
 * Tanıtım haritasında sırayla sorulanlar: Türkiye ve dünya, isim, plaka ve bayrak soruları karışık. Önce soru çıkar,
 * bir an sonra doğru yer yeşil yanar.
 */
const DEMO_QUESTIONS: DemoQuestion[] = [
  { mode: "turkey", id: "6", prompt: "name" },
  { mode: "world", id: "jp", prompt: "name" },
  { mode: "turkey", id: "35", prompt: "plate" },
  { mode: "world", id: "br", prompt: "flag" },
  { mode: "world", id: "eg", prompt: "name" },
  { mode: "turkey", id: "61", prompt: "name" },
];
const DEMO_STEP_MS = 1300;

function demoName({ mode, id }: DemoQuestion) {
  if (mode === "turkey") return provinces.find((province) => province.plate === Number(id))?.city ?? "";
  return countries.find((country) => country.code === id)?.name ?? "";
}

/** Gerçek haritada oyunun soruları: soru çıkar, ardından yer yeşil yanar; sonraki soruya (gerekirse haritaya) geçilir. */
function MapDemo() {
  // İki harita da baştan yüklenir; soru haritayı değiştirdiğinde beklemeden çizilsin.
  const turkey = useMapMarkup("turkey");
  const world = useMapMarkup("world");
  const containerRef = useRef<HTMLDivElement>(null);
  // Her soru iki adımdır: çift adımda soru, tek adımda cevap.
  const [step, setStep] = useState(1);
  const question = DEMO_QUESTIONS[Math.floor(step / 2) % DEMO_QUESTIONS.length];
  const isRevealed = step % 2 === 1;
  const name = demoName(question);
  const mapMarkup = question.mode === "turkey" ? turkey.mapMarkup : world.mapMarkup;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setStep((current) => current + 1), DEMO_STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    containerRef.current?.querySelectorAll<SVGElement>(LOCATION_SELECTOR[question.mode]).forEach((location) => {
      location.classList.toggle("map-correct", isRevealed && isSameLocation(question.mode, locationIdOf(location, question.mode), question.id));
    });
  }, [isRevealed, mapMarkup, question]);

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center rounded-3xl border-2 border-slate-200 bg-white p-3 lg:p-6">
      <div
        className={`absolute top-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-1.5 font-display text-lg font-bold whitespace-nowrap shadow-sm transition-colors lg:top-5 lg:text-2xl ${
          isRevealed ? "bg-emerald-500 text-white" : "bg-cyan-50 text-cyan-800"
        }`}
      >
        {isRevealed ? (
          `✓ ${name}`
        ) : question.prompt === "plate" ? (
          <>
            <PlateBadge plate={Number(question.id)} size="sm" />
            hangi il?
          </>
        ) : question.prompt === "flag" ? (
          <>
            <Image alt="" className="h-6 w-auto rounded-[3px] border border-slate-200 lg:h-8" height={24} src={flagUrl(question.id)} unoptimized width={32} />
            hangi ülke?
          </>
        ) : (
          `${name} nerede?`
        )}
      </div>
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

/** Dört oyun, giriş ekranındaki renkleri ve simgeleriyle. */
function GamesDemo() {
  return (
    <div className="grid h-full w-full grid-cols-2 gap-2 lg:gap-4">
      {GAMES.map((game) => (
        <div className={`flex min-w-0 flex-col justify-center rounded-2xl border-2 border-slate-200 p-3 short:p-2 lg:p-5 ${game.theme.surface}`} key={game.id}>
          <span className={`flex h-9 w-9 items-center justify-center rounded-xl short:h-7 short:w-7 short:rounded-lg lg:h-12 lg:w-12 ${game.theme.tile}`}>
            <GameIcon className="h-5 w-5 short:h-4 short:w-4 lg:h-7 lg:w-7" game={game.id} />
          </span>
          <p className="mt-2 font-display text-xl leading-none font-bold text-slate-900 short:mt-1.5 short:text-lg lg:mt-3 lg:text-3xl">{game.title}</p>
          <p className="mt-1 truncate text-xs text-slate-500 lg:text-sm">{game.facts.slice(0, 2).join(" · ")}</p>
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
          Düello
        </span>
        <span className="rounded-xl border border-orange-200 bg-white px-3 py-1 font-mono text-sm font-bold tracking-[0.25em] text-slate-800 lg:text-lg">KX7P2M</span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl bg-white p-3 shadow-sm lg:p-5">
        <DemoPlayer initial="S" name="Sen" score={7} tone="bg-cyan-100 text-cyan-700" />
        <span className="font-display text-lg font-bold text-slate-300 lg:text-2xl">–</span>
        <DemoPlayer initial="R" isRight name="Rakip" score={5} tone="bg-orange-100 text-orange-700" />
      </div>
      <p className="text-center text-xs text-slate-500 lg:text-sm">⚡ Kapan kazanır · {duel.facts[1]}</p>
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
