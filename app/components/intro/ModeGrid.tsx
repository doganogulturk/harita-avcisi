"use client";

import Image from "next/image";
import Link from "next/link";
import { flagUrl, GAME_DURATION_SECONDS, QUESTIONS_PER_ROUND, type GameMode } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { type IntroGame, setIntroPlayKind, useIntroPlayKind } from "@/lib/intro-preferences";
import { gameInfo, GameIcon, groupInfo } from "./games";

type ModeGridProps = {
  /** Kartın açılış animasyonu, başlıktan sonra sırayla gelir. */
  introDelayMs: number;
  /** Kartlar arasındaki açılış gecikmesi farkı. */
  introStepMs: number;
  onSelect: (game: IntroGame) => void;
  onShowLeaderboard: () => void;
  /** Yarış kartındaki canlı bilgi: sıralamaların birincileri ("Türkiye'de 1. Murat · 10/10 · 00:42"). */
  rankedLeaders?: CardLeader[];
};

export type CardLeader = { map: GameMode; name: string; avatarUrl: string | null; score: string; time: string };

/**
 * Adım 1, oyun menüsü: OYNA kutusu (üstte Yarış / Antrenman anahtarı, altında büyük tuş; tuş seçilen oyunun ayar
 * ekranını açar), altında liderler panosu; yanında ya da altında Arkadaşlarla karosu (Düello, Oda ve kodla katılma) ve
 * Haritayı tamamla kutusu (Ülkeler, İller, İlçeler). Dikey telefonda hepsi alt alta, geniş ve yatay ekranda iki sütun.
 * Tuşlar basılabilir oyun tuşlarıdır (globals.css, .press). Ekran yetmezse liste kayar.
 */
export function ModeGrid({ introDelayMs, introStepMs, onSelect, onShowLeaderboard, rankedLeaders = [] }: ModeGridProps) {
  const { home } = messages();
  const playKind = useIntroPlayKind();
  const delay = (step: number) => ({ "--intro-delay": `${introDelayMs + introStepMs * step}ms` }) as React.CSSProperties;

  return (
    <div className="-mx-1.5 grid min-h-0 w-[calc(100%+0.75rem)] flex-1 content-center items-center gap-4 overflow-y-auto px-1.5 pt-1 pb-3 short:gap-3 sm:grid-cols-2 sm:gap-6 lg:gap-10">
      <div className="intro-focus flex min-w-0 flex-col items-center gap-4 short:gap-2 lg:gap-6" style={delay(0)}>
        {/* Alçak telefonda (SE gibi) slogan gizlenir: ana ekran kaydırmadan sığsın. */}
        <p className="text-center text-sm font-bold text-cyan-100/80 short:hidden [@media(max-height:40rem)]:hidden lg:text-lg">{home.tagline}</p>
        <PlayHero kind={playKind} onClick={() => onSelect(playKind)} />
        <LeadersBoard isPractice={playKind === "practice"} leaders={rankedLeaders} onShowLeaderboard={onShowLeaderboard} />
      </div>

      <div className="intro-focus flex min-w-0 flex-col gap-3 short:gap-2 lg:gap-4" style={delay(1)}>
        <FriendsTile onClick={() => onSelect("friends")} />
        {/* Haritayı tamamla oyunları bir kutuda, büyükten küçüğe; kutunun başlığı üçünün ortak türünü söyler. */}
        <section aria-labelledby="map-games" className="rounded-3xl bg-white/[0.07] p-2.5 ring-1 ring-white/15 short:p-2 lg:p-4">
          <div className="mb-2 flex items-baseline justify-between gap-2 px-0.5 short:mb-1.5 lg:mb-3">
            <h2 className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-cyan-100/85 uppercase lg:text-xs" id="map-games">
              <span aria-hidden="true">🧩</span>
              {home.mapGames}
            </h2>
            <p className="truncate text-[11px] font-semibold text-cyan-100/60 max-[22.5rem]:hidden lg:text-sm">{home.mapGamesNote}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            <MapTile href="/ulkeler" kind="countries" />
            <MapTile href="/iller" kind="provinces" />
            <MapTile href="/ilceler" kind="districts" />
          </div>
        </section>
      </div>
    </div>
  );
}

/** OYNA tuşunun iki görünüşü: Yarış yeşil, Antrenman sarı (Antrenman'ın kendi rengi). */
const PLAY_STYLE = {
  ranked: {
    button: "border-emerald-300/60 bg-emerald-500 text-white [--press-edge:#047857] focus-visible:ring-emerald-200",
    shadow: "drop-shadow-[0_2px_0_rgb(4_120_87)]",
    hint: "text-emerald-50/90",
    knob: "border-emerald-300/70 bg-emerald-500 text-white",
    knobEdge: "#047857",
    stripe: "#10b981",
  },
  practice: {
    button: "border-amber-200/70 bg-amber-400 text-amber-950 [--press-edge:#b45309] focus-visible:ring-amber-100",
    shadow: "drop-shadow-[0_2px_0_rgb(253_230_138)]",
    hint: "text-amber-950/80",
    knob: "border-amber-200/80 bg-amber-400 text-amber-950",
    knobEdge: "#b45309",
    stripe: "#fbbf24",
  },
} as const;

/** Yarış: dama desenli yarış bayrağı. */
function RaceFlagIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" viewBox="0 0 24 24">
      <path d="M5 3v18" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2.2} />
      <path d="M6 4h14v10H6Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.6} />
      <path d="M6 4h3.5v3.33H6ZM13 4h3.5v3.33H13ZM9.5 7.33H13v3.33H9.5ZM16.5 7.33H20v3.33h-3.5ZM6 10.67h3.5V14H6ZM13 10.67h3.5V14H13Z" fill="currentColor" />
    </svg>
  );
}

/** Antrenman: antrenman kukası (koni). */
function ConeIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0 lg:h-5 lg:w-5" viewBox="0 0 24 24">
      <path d="M9.6 4.2a1 1 0 0 1 .97-.7h2.86a1 1 0 0 1 .97.7L18.6 18H5.4Z" fill="currentColor" />
      <path d="M8.3 9h7.4M7.1 13.5h9.8" stroke="var(--cone-stripe, #fff)" strokeWidth={1.8} />
      <rect fill="currentColor" height="2.6" rx="1" width="18" x="3" y="17.8" />
    </svg>
  );
}

/**
 * Ana ekranın asıl kutusu: üstte Yarış / Antrenman anahtarı, altında büyük, hafifçe nabız gibi atan OYNA. Anahtar tek
 * parça bir ray; seçili oyunun simgeli jetonu raya oturur, dokununca yaylanarak öbür tarafa geçer (seçim hatırlanır).
 * Rayın iki yarısı birer seçenektir: seçili olmayana dokunmak onu seçer, jetona dokunmak öbürüne geçirir. Tuşun rengi
 * ve altındaki kural seçime göre değişir. Anahtar tuşun içinde değil: anahtara dokunurken tur başlamasın.
 */
function PlayHero({ kind, onClick }: { kind: "ranked" | "practice"; onClick: () => void }) {
  const { home } = messages();
  const style = PLAY_STYLE[kind];
  const options = [
    { id: "ranked" as const, label: gameInfo("ranked").title, icon: <RaceFlagIcon /> },
    { id: "practice" as const, label: gameInfo("practice").title, icon: <ConeIcon /> },
  ];
  return (
    <div className="flex w-full max-w-md flex-col gap-2 short:gap-1.5 lg:gap-3">
      <div aria-label={home.playKind} className="relative grid h-11 grid-cols-2 rounded-full border-2 border-white/20 bg-[#123f5e] short:h-9 lg:h-12" role="radiogroup">
        {options.map((option) => (
          <button
            aria-checked={kind === option.id}
            className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-full text-sm font-bold text-white/70 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:text-base"
            key={option.id}
            onClick={() => setIntroPlayKind(kind === option.id ? (option.id === "ranked" ? "practice" : "ranked") : option.id)}
            role="radio"
            // Kukanın şeritleri rayın koyu renginde.
            style={{ "--cone-stripe": "#123f5e" } as React.CSSProperties}
            type="button"
          >
            {option.icon}
            {option.label}
          </button>
        ))}
        {/* Jeton: seçili oyunun simgesi ve adı; altındaki kalın kenarla basılabilir oyun tuşu gibi durur. */}
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute top-0.5 bottom-1.5 left-0.5 flex w-[calc(50%-0.125rem)] items-center justify-center gap-1.5 rounded-full border-2 text-sm font-bold transition-transform duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] motion-reduce:transition-none lg:text-base ${style.knob}`}
          style={{ transform: kind === "practice" ? "translateX(100%)" : "none", boxShadow: `0 4px 0 ${style.knobEdge}`, "--cone-stripe": style.stripe } as React.CSSProperties}
        >
          {options.find((option) => option.id === kind)?.icon}
          {options.find((option) => option.id === kind)?.label}
        </span>
      </div>
      <button
        className={`press play-breathe flex w-full cursor-pointer flex-col items-center rounded-3xl border-2 px-6 pt-4 pb-3.5 transition-colors [--press-depth:7px] focus-visible:ring-4 focus-visible:outline-none short:pt-2.5 short:pb-2 lg:pt-6 lg:pb-5 ${style.button}`}
        onClick={onClick}
        type="button"
      >
        <span className={`flex items-center gap-3 font-display text-5xl leading-none font-bold tracking-wide uppercase short:text-3xl lg:text-7xl ${style.shadow}`}>
          <svg aria-hidden="true" className="h-9 w-9 short:h-6 short:w-6 lg:h-14 lg:w-14" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" />
          </svg>
          {home.play}
        </span>
        <span className={`mt-2 text-xs font-bold short:mt-1 lg:text-base ${style.hint}`}>
          {kind === "ranked" ? home.playHint(QUESTIONS_PER_ROUND, GAME_DURATION_SECONDS) : home.practiceHint}
        </span>
      </button>
    </div>
  );
}

/** Karonun görünüşü: simge solda, ad ve not sağda. */
const TILE_CLASS =
  "press press-sm relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-3 text-left max-[22.5rem]:gap-1.5 max-[22.5rem]:px-2 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none lg:gap-3.5 lg:rounded-3xl lg:px-4 xl:px-5";
/** Kutudaki karo: simge üstte, ad altında; alçak ekranda yan yana. */
const STACKED_TILE = "flex-col justify-center gap-0.5! px-1.5! py-1.5 text-center short:flex-row short:gap-1.5! short:py-1 lg:gap-1.5! lg:py-4";

const TITLE_CLASS = "max-w-full truncate font-display text-base leading-tight font-bold short:text-sm max-[22.5rem]:text-sm lg:text-xl xl:text-2xl";

/** Arkadaşlarla: Düello, Oda ve kodla katılma tek kapıda; tam genişlikte, oyunun turuncusunda. */
function FriendsTile({ onClick }: { onClick: () => void }) {
  const { home } = messages();
  return (
    <button className={`${TILE_CLASS} border-orange-300/60 bg-orange-500 py-2.5 text-white [--press-edge:#c2410c] short:py-1.5 lg:py-5`} onClick={onClick} type="button">
      <GameIcon className="h-7 w-7 shrink-0 short:h-5 short:w-5 lg:h-10 lg:w-10" game="friends" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={TITLE_CLASS}>{groupInfo("friends").title}</span>
        <span className="max-w-full truncate text-[11px] font-semibold opacity-85 short:hidden lg:text-sm">{home.tileNotes.friends}</span>
      </span>
      <span aria-hidden="true" className="font-display text-xl leading-none opacity-80 lg:text-2xl">
        →
      </span>
    </button>
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
      <svg aria-hidden="true" className="h-6 w-6 shrink-0 short:h-5 short:w-5 max-[22.5rem]:h-5 max-[22.5rem]:w-5 lg:h-10 lg:w-10" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        {tile.icon}
      </svg>
      <span className={TITLE_CLASS}>{text.title}</span>
    </Link>
  );
}

/** Liderin haritası: Türkiye bayrağı ya da dünya simgesi, yuvarlak. */
function MapBadge({ map }: { map: GameMode }) {
  if (map === "turkey") {
    return <Image alt="" className="h-5 w-5 shrink-0 rounded-full object-cover ring-1 ring-slate-200 lg:h-6 lg:w-6" height={24} src={flagUrl("tr")} unoptimized width={24} />;
  }
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700 ring-1 ring-sky-200 lg:h-6 lg:w-6">
      <svg aria-hidden="true" className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
      </svg>
    </span>
  );
}

/**
 * Yarış kartındaki liderler panosu: Türkiye'nin ve Dünya'nın birincisi, taçlı ve altın halkalı profil resmiyle;
 * skor altın renkli bir rozette. Oyuncuya "zirve burada" der; panonun altından sıralama açılır.
 */
function LeadersBoard({ leaders, isPractice, onShowLeaderboard }: { leaders: CardLeader[]; isPractice: boolean; onShowLeaderboard: () => void }) {
  const { home, boards } = messages();
  return (
    // Antrenman sıralamaya girmez: pano soluklaşır ve bunu söyler; sıralama yine açılabilir.
    <div className={`w-full max-w-md rounded-2xl bg-white/95 p-2.5 shadow-sm ring-1 ring-amber-200 transition-opacity short:p-2 lg:p-4 ${isPractice ? "opacity-70" : ""}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-amber-700 uppercase lg:text-xs">
        <span aria-hidden="true">👑</span>
        {home.leaders}
        {isPractice && <span className="ml-auto truncate text-[11px] font-semibold tracking-normal text-slate-500 normal-case max-[22.5rem]:hidden lg:text-xs">{home.practiceNoRank}</span>}
      </p>
      {leaders.length > 0 && (
        <ol className="mt-1.5 flex flex-col gap-1 lg:mt-2.5 lg:gap-2">
          {leaders.map((leader) => (
            <li className="flex min-w-0 items-center gap-2 lg:gap-3" key={leader.map}>
              <MapBadge map={leader.map} />
              <span className="sr-only">{leader.map === "turkey" ? boards.turkey : boards.world}</span>
              <span className="relative shrink-0">
                {leader.avatarUrl ? (
                  <Image
                    alt=""
                    className="h-7 w-7 rounded-full object-cover ring-2 ring-amber-400 lg:h-9 lg:w-9"
                    height={36}
                    referrerPolicy="no-referrer"
                    src={leader.avatarUrl}
                    unoptimized
                    width={36}
                  />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800 ring-2 ring-amber-400 lg:h-9 lg:w-9 lg:text-sm">
                    {leader.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <span aria-hidden="true" className="absolute -top-2 -right-1.5 rotate-12 text-xs lg:text-sm">
                  👑
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-900 lg:text-base">{leader.name}</span>
              <span className="shrink-0 rounded-full bg-gradient-to-b from-amber-300 to-amber-400 px-2 py-0.5 font-display text-xs font-bold text-amber-950 tabular-nums shadow-sm lg:px-2.5 lg:text-sm">
                {leader.score}
              </span>
              <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-500 tabular-nums lg:w-12 lg:text-sm">{leader.time}</span>
            </li>
          ))}
        </ol>
      )}
      <button
        className="hit-area mt-1.5 flex items-center gap-1 text-xs font-bold text-amber-800 underline-offset-4 transition hover:underline focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none lg:mt-2.5 lg:text-sm"
        onClick={onShowLeaderboard}
        type="button"
      >
        <TrophyIcon />
        {home.showLeaderboard}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}


function TrophyIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} viewBox="0 0 24 24">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
    </svg>
  );
}
