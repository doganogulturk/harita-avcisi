"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useState } from "react";
import { flagUrl, GAME_DURATION_SECONDS, QUESTIONS_PER_ROUND, type GameMode } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { type IntroGame } from "@/lib/intro-preferences";
import { gameInfo, GameIcon } from "./games";

type ModeGridProps = {
  /** Kartın açılış animasyonu, başlıktan sonra sırayla gelir. */
  introDelayMs: number;
  /** Kartlar arasındaki açılış gecikmesi farkı. */
  introStepMs: number;
  onSelect: (game: IntroGame) => void;
  onShowLeaderboard: () => void;
  /** Arkadaşlarımla kartındaki kod alanı: kod bir düelloya ya da odaya götürür. Hata varsa metnini döndürür. */
  onJoin: (code: string) => Promise<string | null>;
  /** Yarış kartındaki canlı bilgi: sıralamaların birincileri ("Türkiye'de 1. Murat · 10/10 · 00:42"). */
  rankedLeaders?: CardLeader[];
};

export type CardLeader = { map: GameMode; name: string; avatarUrl: string | null; score: string; time: string };

/**
 * Adım 1, oyun menüsü: büyük OYNA tuşu (yarışın ayar ekranı), altında liderler panosu; yanında ya da altında diğer
 * oyunların renkli karoları ve davet kodu alanı. Karolar üç satırda gruplanır: tek başına (Antrenman), arkadaşlarla
 * (Düello, Oda), haritayı tamamla (İller, İlçeler). Dikey telefonda hepsi alt alta, geniş ve yatay
 * ekranda iki sütun. Tuşlar basılabilir oyun tuşlarıdır (globals.css, .press). Ekran yetmezse liste kayar.
 */
export function ModeGrid({ introDelayMs, introStepMs, onSelect, onShowLeaderboard, onJoin, rankedLeaders = [] }: ModeGridProps) {
  const { home } = messages();
  const delay = (step: number) => ({ "--intro-delay": `${introDelayMs + introStepMs * step}ms` }) as React.CSSProperties;

  return (
    <div className="-mx-1.5 grid min-h-0 w-[calc(100%+0.75rem)] flex-1 content-center items-center gap-4 overflow-y-auto px-1.5 pt-1 pb-3 short:gap-3 sm:grid-cols-2 sm:gap-6 lg:gap-10">
      <div className="intro-focus flex min-w-0 flex-col items-center gap-4 short:gap-2 lg:gap-6" style={delay(0)}>
        <p className="text-center text-sm font-bold text-cyan-100/80 short:hidden lg:text-lg">{home.tagline}</p>
        <PlayHero onClick={() => onSelect("ranked")} />
        <LeadersBoard leaders={rankedLeaders} onShowLeaderboard={onShowLeaderboard} />
      </div>

      <div className="intro-focus flex min-w-0 flex-col gap-3 short:gap-2 lg:gap-4" style={delay(1)}>
        <p className="text-[11px] font-bold tracking-[0.15em] text-cyan-100/60 uppercase lg:text-xs">{home.moreGames}</p>
        {/* Üç satır: Antrenman tam genişlikte; Düello ve Oda; İller ve İlçeler. Yan sütun sınırlı genişlikte, bir satıra
            ikiden fazla karo konunca adlar taşıyordu. */}
        <div className="grid grid-cols-2 gap-2 lg:gap-4">
          {TILES.map((tile) => (
            <GameTile key={tile.id} onClick={() => onSelect(tile.id)} tile={tile} />
          ))}
          <MapTile href="/iller" kind="provinces" />
          <MapTile href="/ilceler" kind="districts" />
        </div>
        <JoinForm onJoin={onJoin} outlineClass={gameInfo("duel").theme.outline} submitClass={gameInfo("duel").theme.badge} />
      </div>
    </div>
  );
}

/** Ana ekranın asıl tuşu: büyük, yeşil, hafifçe nabız gibi atan OYNA; altında yarışın kuralı tek satırda. */
function PlayHero({ onClick }: { onClick: () => void }) {
  const { home } = messages();
  return (
    <button
      className="press play-breathe flex w-full max-w-md cursor-pointer flex-col items-center rounded-3xl border-2 border-emerald-300/60 bg-emerald-500 px-6 pt-4 pb-3.5 text-white [--press-depth:7px] [--press-edge:#047857] focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:outline-none short:pt-2.5 short:pb-2 lg:pt-6 lg:pb-5"
      onClick={onClick}
      type="button"
    >
      <span className="flex items-center gap-3 font-display text-5xl leading-none font-bold tracking-wide uppercase drop-shadow-[0_2px_0_rgb(4_120_87)] short:text-3xl lg:text-7xl">
        <svg aria-hidden="true" className="h-9 w-9 short:h-6 short:w-6 lg:h-14 lg:w-14" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" />
        </svg>
        {home.play}
      </span>
      <span className="mt-2 text-xs font-bold text-emerald-50/90 short:mt-1 lg:text-base">{home.playHint(QUESTIONS_PER_ROUND, GAME_DURATION_SECONDS)}</span>
    </button>
  );
}

type Tile = { id: Exclude<IntroGame, "ranked">; color: string; edge: string };

/** Diğer oyunların karoları; her biri oyunun kendi renginde. */
const TILES: Tile[] = [
  { id: "practice", color: "bg-amber-400 text-amber-950 border-amber-200/70", edge: "#b45309" },
  { id: "duel", color: "bg-orange-500 text-white border-orange-300/60", edge: "#c2410c" },
  { id: "room", color: "bg-violet-600 text-white border-violet-300/50", edge: "#4c1d95" },
];

/** Karonun görünüşü: simge solda, ad ve not sağda. Dikey boşluk ayrı: tam genişlikteki Antrenman daha alçaktır. */
const TILE_CLASS =
  "press press-sm relative flex min-w-0 cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-3 text-left max-[22.5rem]:gap-1.5 max-[22.5rem]:px-2 focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none lg:gap-3.5 lg:rounded-3xl lg:px-4 xl:px-5";
const TILE_PADDING = "py-2.5 short:py-1.5 lg:py-5";
const WIDE_TILE_PADDING = "col-span-2 py-1.5 short:py-1 lg:py-3";

function TileText({ title, note }: { title: string; note: string }) {
  return (
    <span className="flex min-w-0 flex-col">
      <span className="max-w-full truncate font-display text-base leading-tight font-bold short:text-sm max-[22.5rem]:text-sm lg:text-xl xl:text-2xl">{title}</span>
      <span className="max-w-full truncate text-[11px] font-semibold opacity-80 short:hidden lg:text-sm">{note}</span>
    </span>
  );
}

function GameTile({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  const { home } = messages();
  // Antrenman satırda tek başınadır: tam genişlikte ve daha alçak.
  const padding = tile.id === "practice" ? WIDE_TILE_PADDING : TILE_PADDING;
  return (
    <button className={`${TILE_CLASS} ${padding} ${tile.color}`} onClick={onClick} style={{ "--press-edge": tile.edge } as React.CSSProperties} type="button">
      <GameIcon className="h-7 w-7 shrink-0 short:h-5 short:w-5 max-[22.5rem]:h-5 max-[22.5rem]:w-5 lg:h-10 lg:w-10" game={tile.id} />
      <TileText note={home.tileNotes[tile.id]} title={gameInfo(tile.id).title} />
    </button>
  );
}

/** Haritayı tamamla oyunlarının karoları: her biri ayrı sayfada; rengi, simgesi ve köşesinde "Yeni" rozeti. */
const MAP_TILES = {
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

/** İller (/iller) ya da İlçeler (/ilceler): haritanın bütün parçalarını yerine yerleştirme. */
function MapTile({ kind, href }: { kind: keyof typeof MAP_TILES; href: string }) {
  const text = messages()[kind];
  const { mapPuzzle } = messages();
  const tile = MAP_TILES[kind];
  return (
    <Link className={`${TILE_CLASS} ${TILE_PADDING} ${tile.color} text-white`} href={href}>
      <svg aria-hidden="true" className="h-7 w-7 shrink-0 short:h-5 short:w-5 max-[22.5rem]:h-5 max-[22.5rem]:w-5 lg:h-10 lg:w-10" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24">
        {tile.icon}
      </svg>
      <TileText note={text.tileNote} title={text.title} />
      <span className="absolute -top-2 -right-1.5 rotate-6 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow ring-2 ring-[#0b3a5b]">
        {mapPuzzle.badgeNew}
      </span>
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
function LeadersBoard({ leaders, onShowLeaderboard }: { leaders: CardLeader[]; onShowLeaderboard: () => void }) {
  const { home, boards } = messages();
  return (
    <div className="w-full max-w-md rounded-2xl bg-white/95 p-2.5 shadow-sm ring-1 ring-amber-200 short:p-2 lg:p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-amber-700 uppercase lg:text-xs">
        <span aria-hidden="true">👑</span>
        {home.leaders}
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

/**
 * Davetle gelen oyuncunun girişi: ana ekranda yalnızca "🔑 Kodun var mı?" satırı durur; dokununca kod alanı ve Katıl tuşu
 * açılır, alana odaklanılır. Kod düelloya mı odaya mı ait, sunucu söyler.
 */
function JoinForm({ onJoin, outlineClass, submitClass }: { onJoin: (code: string) => Promise<string | null>; outlineClass: string; submitClass: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) return setError(messages().home.codeLength);
    setIsBusy(true);
    const joinError = await onJoin(normalized);
    setIsBusy(false);
    setError(joinError);
  };

  if (!isOpen) {
    return (
      <button
        aria-expanded={false}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/25 px-4 py-2.5 text-sm font-bold text-white/85 transition hover:border-white/50 hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:py-1.5 lg:py-3.5 lg:text-base"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <span aria-hidden="true">🔑</span>
        {messages().home.haveCode}
        <span className="text-orange-300">{messages().home.join}</span>
        <span aria-hidden="true" className="text-orange-300">→</span>
      </button>
    );
  }

  return (
    // Liderler panosuyla aynı ince çerçeveli kutu; başlığı da onunki gibi.
    <form
      className="flex min-w-0 flex-wrap items-center gap-1.5 rounded-2xl bg-white/95 p-2.5 shadow-sm ring-1 ring-orange-200 short:p-2 lg:gap-2 lg:p-4"
      onSubmit={(event) => void join(event)}
    >
      <label className="flex w-full items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-orange-700 uppercase lg:text-xs" htmlFor="join-code">
        <span aria-hidden="true">🔑</span>
        {messages().home.haveCode}
      </label>
      <input
        // Satıra dokunarak açıldı; oyuncu hemen yazabilsin.
        autoFocus
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        className={`h-10 w-32 min-w-0 rounded-full border-2 bg-white px-3 text-center font-mono text-sm font-bold tracking-[0.2em] text-slate-900 uppercase outline-none focus:ring-2 short:h-8 lg:h-12 lg:w-44 lg:text-base ${outlineClass}`}
        enterKeyHint="go"
        id="join-code"
        aria-label={messages().home.codeLabel}
        maxLength={6}
        onChange={(event) => {
          setCode(event.target.value);
          setError(null);
        }}
        placeholder="KOD123"
        spellCheck={false}
        value={code}
      />
      <button
        className={`hit-area h-10 rounded-full px-5 text-sm font-bold shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 short:h-8 short:px-4 lg:h-12 lg:px-6 lg:text-base ${submitClass}`}
        disabled={isBusy}
        type="submit"
      >
        {isBusy ? "…" : messages().home.join}
      </button>
      {error && <span className="w-full text-xs font-semibold text-rose-600">{error}</span>}
    </form>
  );
}

function TrophyIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} viewBox="0 0 24 24">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
    </svg>
  );
}
