"use client";

import Link from "next/link";
import { GAME_DURATION_SECONDS, QUESTIONS_PER_ROUND } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { type IntroGame } from "@/lib/intro-preferences";
import { dailyProgress, hoursMinutes, useNextDailyCountdown } from "./DailyChallenge";
import { gameInfo, GameIcon, groupInfo } from "./games";
import { type DailyStatus } from "@/lib/daily";

type ModeGridProps = {
  /** Kartın açılış animasyonu, başlıktan sonra sırayla gelir. */
  introDelayMs: number;
  /** Kartlar arasındaki açılış gecikmesi farkı. */
  introStepMs: number;
  onSelect: (game: IntroGame) => void;
  /** Günün meydan okuması kartı (sunucu bağlantısı yoksa verilmez): bugünkü durum ve sayfayı açma. */
  daily?: { status: DailyStatus | null; onOpen: () => void };
};

/**
 * Adım 1, oyun menüsü: büyük OYNA tuşu (10 soru, 120 saniye; giriş gerekmez), altında yan yana Antrenman (süresiz) ve
 * Arkadaşlarla (Düello, Oda ve kodla katılma) tuşları, Haritayı tamamla kutusu (Ülkeler, İller, İlçeler) ve en altta
 * günün meydan okuması girişi: bugünün özetini gösteren, açık sayfanın kapalı başlığı gibi görünen tek bir şerit;
 * dokununca alttan açılan sayfada (DailySheet) Türkiye ve Dünya bölümleri ve modlar seçilir. Geniş ve yatay ekranda şerit
 * akışta, dikey telefonda ekranın altına sabittir (DailyDock).
 * Dikey telefonda hepsi alt alta, geniş ve yatay ekranda iki sütun (solda OYNA ile iki tuş, sağda Haritayı tamamla);
 * günlük iki sütunun altında bütün genişliği kaplar. Tuşlar basılabilir oyun tuşlarıdır (globals.css, .press). Ekran
 * yetmezse liste kayar.
 */
export function ModeGrid({ introDelayMs, introStepMs, onSelect, daily }: ModeGridProps) {
  const { home } = messages();
  const delay = (step: number) => ({ "--intro-delay": `${introDelayMs + introStepMs * step}ms` }) as React.CSSProperties;

  return (
    <div className="-mx-1.5 grid min-h-0 w-[calc(100%+0.75rem)] flex-1 content-center items-start gap-6 overflow-y-auto px-1.5 pt-1 pb-3 short:gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6 lg:gap-x-10 lg:gap-y-8">
      <div className="intro-focus flex min-w-0 flex-col items-center gap-5 short:gap-2 lg:gap-6" style={delay(0)}>
        {/* Alçak telefonda (SE gibi) slogan gizlenir: ana ekran kaydırmadan sığsın. */}
        <p className="text-center text-sm font-bold text-cyan-100/80 short:hidden [@media(max-height:40rem)]:hidden lg:text-lg">{home.tagline}</p>
        <PlayHero onFriends={() => onSelect("friends")} onPlay={() => onSelect("ranked")} onPractice={() => onSelect("practice")} />
      </div>

      <div className="intro-focus flex min-w-0 flex-col gap-5 short:gap-2 lg:gap-6" style={delay(1)}>
        {/* Haritayı tamamla oyunları bir kutuda, büyükten küçüğe; kutunun başlığı üçünün ortak türünü söyler. */}
        <section aria-labelledby="map-games" className="rounded-3xl bg-white/[0.07] p-2.5 ring-1 ring-white/15 short:p-2 lg:p-4">
          <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5 short:mb-1.5 lg:mb-3">
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-cyan-100/85 uppercase lg:text-xs" id="map-games">
              <span aria-hidden="true">🧩</span>
              {home.mapGames}
            </h2>
            <p className="truncate text-[11px] font-semibold text-cyan-100/60 max-[24rem]:hidden lg:text-sm">{home.mapGamesNote}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            <MapTile href="/ulkeler" kind="countries" />
            <MapTile href="/iller" kind="provinces" />
            <MapTile href="/ilceler" kind="districts" />
          </div>
        </section>
      </div>

      {/* Günün meydan okuması girişi: geniş ve yatay ekranda iki sütunun altında ortada akışta durur. Dikey telefonda
          ekranın altına sabitlenir (aşağıdaki DailyDock); orada ızgara içinde çizilmez. Sunucu bağlantısı yoksa hiç çizilmez. */}
      {daily && (
        <div className="intro-focus mx-auto hidden w-full min-w-0 max-w-xl sm:col-span-2 sm:block portrait-phone:hidden" style={delay(2)}>
          <DailyEntry onOpen={daily.onOpen} status={daily.status} />
        </div>
      )}
      {/* Sabit şeridin altında kalan son satır görünsün: şerit kadar boşluk. */}
      {daily && <div aria-hidden="true" className="hidden h-16 shrink-0 portrait-phone:block" />}
    </div>
  );
}

/**
 * Ana ekranın asıl kutusu: büyük, hafifçe nabız gibi atan yeşil OYNA ve altındaki kuralı (10 soru, 120 saniye); tuş Oyna'nın
 * ayar ekranını açar. Altında yan yana iki daha küçük tuş: sarı Antrenman (süre yok, istediğin kadar; giriş istemez) ve
 * turuncu Arkadaşlarla (Düello, Oda ve kodla katılma).
 */
function PlayHero({ onPlay, onPractice, onFriends }: { onPlay: () => void; onPractice: () => void; onFriends: () => void }) {
  const { home } = messages();
  // xl'de başlıklar büyür (TITLE_CLASS); blok da genişler ki "Arkadaşlarla" karoya sığsın.
  return (
    <div className="flex w-full max-w-md flex-col gap-3 short:gap-2 lg:gap-4 xl:max-w-lg">
      {/* Simge solda, başlık ve kural sağında sola yaslı: Antrenman ve Arkadaşlarla tuşlarıyla aynı düzen. Simge iki satırın yüksekliğine
          yayıldığı için eskisinden büyüktür. */}
      <button
        className="press play-breathe flex w-full cursor-pointer items-center gap-4 rounded-3xl border-2 border-emerald-300/60 bg-emerald-500 px-6 pt-4 pb-3.5 text-left text-white transition-colors [--press-depth:7px] [--press-edge:#047857] focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:outline-none short:gap-3 short:pt-2.5 short:pb-2 lg:gap-6 lg:pt-6 lg:pb-5"
        onClick={onPlay}
        type="button"
      >
        <svg aria-hidden="true" className="h-12 w-12 shrink-0 drop-shadow-[0_2px_0_rgb(4_120_87)] short:h-8 short:w-8 lg:h-16 lg:w-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" />
        </svg>
        <span className="flex min-w-0 flex-col">
          <span className="font-display text-5xl leading-none font-bold tracking-wide uppercase drop-shadow-[0_2px_0_rgb(4_120_87)] short:text-3xl lg:text-7xl">{home.play}</span>
          <span className="mt-2 text-xs font-bold text-emerald-50/90 short:mt-1 lg:text-base">{home.playHint(QUESTIONS_PER_ROUND, GAME_DURATION_SECONDS)}</span>
        </span>
      </button>
      <div className="grid grid-cols-2 gap-3 lg:gap-4">
        <button
          className="press press-sm flex min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl border-2 border-amber-200/70 bg-amber-400 px-3 py-2.5 text-left text-amber-950 [--press-edge:#b45309] focus-visible:ring-4 focus-visible:ring-amber-100 focus-visible:outline-none max-[23rem]:gap-1.5 max-[23rem]:px-2 short:py-1.5 lg:gap-3.5 lg:px-4 lg:py-4"
          onClick={onPractice}
          type="button"
        >
          <GameIcon className="h-7 w-7 shrink-0 short:h-5 short:w-5 lg:h-9 lg:w-9" game="practice" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={TITLE_CLASS}>{gameInfo("practice").title}</span>
            <span className="max-w-full truncate text-[11px] font-semibold text-amber-950/80 short:hidden lg:text-sm">{home.practiceHint}</span>
          </span>
        </button>
        <FriendsTile onClick={onFriends} />
      </div>
    </div>
  );
}

/** Karonun görünüşü: simge solda, ad ve not sağda. */
const TILE_CLASS =
  "press press-sm relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-3 text-left max-[23rem]:gap-1.5 max-[23rem]:px-2 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none lg:gap-3.5 lg:rounded-3xl lg:px-4 xl:px-5";
/** Kutudaki karo: simge üstte, ad altta; alçak ekranda yan yana. */
const STACKED_TILE = "flex-col justify-center gap-0.5! px-1.5! py-1.5 text-center short:flex-row short:gap-1.5! short:py-1 lg:gap-1.5! lg:py-4";

const TITLE_CLASS = "max-w-full truncate font-display text-base leading-tight font-bold short:text-sm max-[23rem]:text-sm lg:text-xl xl:text-2xl";

/** Arkadaşlarla: Düello, Oda ve kodla katılma tek kapıda; tam genişlikte, oyunun turuncusunda. */
function FriendsTile({ onClick }: { onClick: () => void }) {
  const { home } = messages();
  return (
    <button className={`${TILE_CLASS} border-orange-300/60 bg-orange-500 py-2.5 text-white [--press-edge:#c2410c] short:py-1.5 lg:py-5`} onClick={onClick} type="button">
      <GameIcon className="h-7 w-7 shrink-0 short:h-5 short:w-5 max-[23rem]:h-5 max-[23rem]:w-5 lg:h-10 lg:w-10" game="friends" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={TITLE_CLASS}>{groupInfo("friends").title}</span>
        <span className="max-w-full truncate text-[11px] font-semibold opacity-85 short:hidden lg:text-sm">{home.tileNotes.friends}</span>
      </span>
    </button>
  );
}

/**
 * Günlük: günün meydan okumasının girişi, ana ekranın altında tam genişlikte tek bir satırdır (dar telefonda yer
 * kaplamaz). Başlığın yanında bugünün özeti durur: kaç mod bitti (Bugün 2/5; hepsi bitince "Bugünün hepsi tamam"), gün
 * serisi ve sonraki meydan okumaya kalan süre. Dokununca günün
 * meydan okuması alttan açılır: modlar orada seçilir (DailySheet).
 */
export function DailyEntry({ status, onOpen, variant = "inline" }: { status: DailyStatus | null; onOpen: () => void; variant?: "inline" | "dock" }) {
  const { home, dailySheet } = messages();
  const { done, total, streak } = dailyProgress(status);
  const msLeft = useNextDailyCountdown();
  const isAllDone = done === total;
  const subtitle = [isAllDone ? home.dailyAllDone : home.dailyNote(done, total), streak > 0 ? `🔥 ${streak}` : null, msLeft !== null ? dailySheet.nextIn(hoursMinutes(msLeft)) : null]
    .filter(Boolean)
    .join(" · ");

  // Sabit şerit (dikey telefon) açık sayfanın üst kenarı gibidir: yalnızca üst köşeleri yuvarlak, ekranın alt kenarına yapışık,
  // üstünde tutamaç çizgisi. Akıştaki şerit eskisi gibi basılabilir bir tuştur.
  const isDock = variant === "dock";
  // Oynanmamış mod varken şerit nefes alır ("seni bekleyen bir şey var"); beşi de bitince durur. Oyna'dan yarım tur geç başlar ki ikisi
  // aynı anda atıp dikkat için yarışmasın. Akıştaki şerit büyür (daily-breathe); ekranın iki kenarına yapışık alt şerit büyürse kenarlardan
  // taşar, o yüzden orada yalnızca parlaklığı atar (daily-glow).
  const breathing = isAllDone ? "" : isDock ? "daily-glow" : "daily-breathe";
  const tone = isAllDone ? "border-emerald-200/70 bg-emerald-600 [--press-edge:#047857]" : "border-fuchsia-300/50 bg-fuchsia-700 [--press-edge:#701a75]";
  return (
    <button
      aria-label={home.dailyAria(done, total, streak)}
      className={`relative flex w-full min-w-0 cursor-pointer items-center gap-3 text-left text-white focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none ${
        isDock
          ? `flex-col rounded-t-3xl border-2 border-b-0 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgb(0_0_0/0.35)] ${tone} ${breathing}`
          : `press press-sm rounded-2xl border-2 px-4 py-3 short:py-2 lg:gap-4 lg:rounded-3xl lg:px-6 lg:py-4 ${tone} ${breathing}`
      }`}
      onClick={onOpen}
      type="button"
    >
      {isDock && <span aria-hidden="true" className="h-1.5 w-10 shrink-0 rounded-full bg-white/40" />}
      <span className="flex w-full min-w-0 items-center gap-3">
      <svg aria-hidden="true" className="h-7 w-7 shrink-0 short:h-5 short:w-5 lg:h-9 lg:w-9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        <rect height="16" rx="2.5" width="18" x="3" y="5" />
        <path d="M3 10h18M8 3v4M16 3v4" />
        <path d="m9 15 2 2 4-4" />
      </svg>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-display text-base leading-tight font-bold short:text-sm lg:text-xl">{dailySheet.title}</span>
        <span className="max-w-full truncate text-[11px] font-semibold tabular-nums opacity-85 short:hidden lg:text-sm">{subtitle}</span>
      </span>
      <svg aria-hidden="true" className="h-5 w-5 shrink-0 opacity-80 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      </span>
    </button>
  );
}

/**
 * Dikey telefonda günlük girişinin sabit şeridi: ekranın altına yapışık, tam genişlikte, açık sayfanın kapalı başlığı gibi.
 * Yalnızca ana ekranda çizilir (IntroScreen), ayar ve oyun ekranlarında değil. Geniş ve yatay ekranda gizlidir.
 */
export function DailyDock({ status, onOpen }: { status: DailyStatus | null; onOpen: () => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 hidden portrait-phone:block">
      <div className="pointer-events-auto">
        <DailyEntry onOpen={onOpen} status={status} variant="dock" />
      </div>
    </div>
  );
}

/** Haritayı tamamla oyunlarının karoları: her biri ayrı sayfada, kendi rengi ve simgesiyle. */
const MAP_TILES = {
  countries: {
    color: "border-indigo-200/60 bg-indigo-500 [--press-edge:#3730a3]",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
      </>
    ),
  },
  provinces: { color: "border-sky-200/60 bg-sky-600 [--press-edge:#0c4a6e]", icon: <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" /> },
  districts: {
    color: "border-teal-200/60 bg-teal-500 [--press-edge:#115e59]",
    icon: (
      <>
        <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
        <path d="M9 4v13.5M15 6.5V20" />
      </>
    ),
  },
};

/** Ülkeler (/ulkeler), İller (/iller) ya da İlçeler (/ilceler): haritanın bütün parçalarını yerine yerleştirme. */
function MapTile({ kind, href }: { kind: keyof typeof MAP_TILES; href: string }) {
  const text = messages()[kind];
  const tile = MAP_TILES[kind];
  return (
    <Link className={`${TILE_CLASS} ${STACKED_TILE} ${tile.color} text-white`} href={href}>
      <svg aria-hidden="true" className="h-6 w-6 shrink-0 short:h-5 short:w-5 max-[23rem]:h-5 max-[23rem]:w-5 lg:h-10 lg:w-10" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        {tile.icon}
      </svg>
      <span className={TITLE_CLASS}>{text.title}</span>
    </Link>
  );
}
