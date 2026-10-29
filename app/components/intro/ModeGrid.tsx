"use client";

import Image from "next/image";
import { type FormEvent, useState } from "react";
import { flagUrl, type GameMode } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { type IntroGame } from "@/lib/intro-preferences";
import { CornerTab } from "../CornerTab";
import { gameInfo, GameIcon, HOME_CARDS, type HomeCardInfo } from "./games";

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
 * Adım 1: Yarış kartı, altında ince Antrenman şeridi ve Arkadaşlarımla kartı (dikey telefonda alt alta). Geniş ekranda sol
 * sütunda Yarış ve Antrenman, sağda iki satır boyunca Arkadaşlarımla durur. Oyunun sekmesi kartın sağ alt köşesinden içeri
 * kıvrılır (Arkadaşlarımla kartında iki sekme: Düello, Oda); sekme o oyunun ayar ekranını açar, ara adım yoktur. Kartın
 * kendisi bir çerçevedir, dokunmak bir şey yapmaz. Ekran yetmezse (küçük telefon) liste kayar, yazılar üst üste binmez.
 * Kaydırma alanının kenar boşluğu, kartın gölgesi kırpılmasın diye. İki sütunda yükseklik sınırlı: dikey iPad gibi uzun
 * ekranlarda kartlar ekran boyunca uzayıp içleri boş kalmasın, ortada dursun.
 */
export function ModeGrid({ introDelayMs, introStepMs, onSelect, onShowLeaderboard, onJoin, rankedLeaders = [] }: ModeGridProps) {
  return (
    <div className="-mx-1.5 -mb-1.5 grid min-h-0 w-[calc(100%+0.75rem)] flex-1 grid-cols-1 grid-rows-[minmax(min-content,1fr)_min-content_minmax(min-content,1fr)] gap-3 overflow-y-auto px-1.5 pt-1 pb-1.5 sm:max-h-[36rem] sm:grid-cols-2 sm:grid-rows-[minmax(min-content,1fr)_min-content] lg:max-h-[48rem] lg:gap-5">
      {HOME_CARDS.map((card, index) =>
        card.id === "practice" ? (
          <PracticeCard card={card} delayMs={introDelayMs + introStepMs * index} key={card.id} onSelect={onSelect} />
        ) : (
          <HomeCard
            card={card}
            delayMs={introDelayMs + introStepMs * index}
            key={card.id}
            onSelect={onSelect}
            {...(card.id === "ranked" ? { leaders: rankedLeaders, onShowLeaderboard } : { onJoin })}
          />
        ),
      )}
    </div>
  );
}

type HomeCardProps = {
  card: HomeCardInfo;
  delayMs: number;
  onSelect: (game: IntroGame) => void;
  leaders?: CardLeader[];
  onShowLeaderboard?: () => void;
  onJoin?: (code: string) => Promise<string | null>;
};

function HomeCard({ card, delayMs, onSelect, leaders = [], onShowLeaderboard, onJoin }: HomeCardProps) {
  const { theme } = card;
  const isPair = card.games.length > 1;

  return (
    <section
      aria-label={card.title}
      className={`intro-focus relative mb-1.5 flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border-2 p-(--card-pad) [--card-pad:1rem] short:[--card-pad:0.75rem] sm:[--card-pad:1.5rem] lg:[--card-pad:2.25rem] ${isPair ? "sm:col-start-2 sm:row-span-2 sm:row-start-1" : ""} ${theme.surface} ${theme.depth}`}
      style={{ "--intro-delay": `${delayMs}ms` } as React.CSSProperties}
    >
      {/* Zeminde silik nokta deseni (harita ızgarası gibi); kart düz bir kutu değil, bir oyun kartı gibi durur. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: `radial-gradient(${theme.dots} 1px, transparent 1.5px)`, backgroundSize: "16px 16px" }}
      />
      {/* Kartın simgesi sağ üst köşede büyük ve silik durur; kartı uzaktan tanınır kılar. */}
      <GameIcon
        className={`pointer-events-none absolute -top-6 -right-6 h-36 w-36 opacity-[0.08] short:h-24 short:w-24 sm:h-48 sm:w-48 lg:h-64 lg:w-64 ${theme.watermark}`}
        game={card.id}
      />

      <div className="relative min-w-0">
        <div className="flex items-center gap-3 lg:gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-sm short:h-9 short:w-9 short:rounded-xl lg:h-16 lg:w-16 ${theme.badge}`}>
            <GameIcon className="h-6 w-6 short:h-5 short:w-5 lg:h-9 lg:w-9" game={card.id} />
          </span>
          <h2 className="min-w-0 font-display text-3xl leading-none font-bold text-slate-900 short:text-2xl sm:text-4xl lg:text-6xl">{card.title}</h2>
        </div>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500 short:mt-1 short:text-xs max-[25rem]:text-xs lg:mt-4 lg:max-w-lg lg:text-lg">{card.description}</p>
      </div>

      {/* Kartın canlı kısmı (liderler panosu ya da davet kodu) başlıkla sekmeler arasında kalan yerde dikeyde ortalanır. */}
      <div className="relative flex min-h-0 flex-1 flex-col justify-center py-3 short:py-1.5 lg:py-5">
        {onShowLeaderboard && <LeadersBoard leaders={leaders} onShowLeaderboard={onShowLeaderboard} />}
        {onJoin && <JoinForm onJoin={onJoin} outlineClass={theme.outline} submitClass={theme.badge} />}
      </div>

      {/* Oyunlar kartın alt köşelerinden içeri kıvrılan büyük sekmelerdir; dokununca o oyunun ayar ekranı açılır. Arkadaşlarımla
          kartında iki sekme kartın ortasında buluşur: her biri kendi oyununun renginde, dış köşede dolu ve ortaya doğru
          şeffaflaşarak. Yarış kartında tek sekme sağ altta dolu renkte durur. Bu boşluk sekmelerin yeridir. */}
      <div aria-hidden="true" className="h-11 shrink-0 short:h-8 lg:h-16" />
      {card.games.map((id, index) => {
        const game = gameInfo(id);
        const icon = <GameIcon className="h-5 w-5 short:h-4 short:w-4 lg:h-7 lg:w-7" game={id} />;
        if (!isPair) {
          return (
            <div className="absolute right-0 bottom-0 z-10" key={id}>
              <CornerTab colorClass={game.theme.badge} corner="bottom-right" fillClass={game.theme.badgeFill} icon={icon} label={messages().home.tabs[id]} onClick={() => onSelect(id)} size="lg" />
            </div>
          );
        }
        return (
          <div className={`absolute bottom-0 z-10 w-1/2 ${index === 0 ? "left-0" : "right-0"}`} key={id}>
            <CornerTab
              colorClass={`${index === 0 ? "bg-gradient-to-r" : "bg-gradient-to-l"} ${game.theme.fade}`}
              corner={index === 0 ? "bottom-left" : "bottom-right"}
              fillClass={game.theme.badgeFill}
              icon={icon}
              label={messages().home.tabs[id]}
              onClick={() => onSelect(id)}
              size="lg"
              stretch
            />
          </div>
        );
      })}
    </section>
  );
}

/**
 * Antrenman: Yarış kartının altında başlıksız ince bir şerit; tek satırlık not ve sağ altta köşeden içeri kıvrılan
 * "Antrenman yap" sekmesi. Şerit genişse (29rem ve üstü) not sekmenin solunda durur; darsa (telefon) not kendi satırında,
 * sekme altında sağdadır, böylece not hiçbir genişlikte kırpılmaz. Sekmenin üstündeki kıvrım sığsın diye üstünde boşluk
 * bırakılır.
 */
function PracticeCard({ card, delayMs, onSelect }: { card: HomeCardInfo; delayMs: number; onSelect: (game: IntroGame) => void }) {
  const { theme } = card;
  return (
    <section
      aria-label={card.title}
      className={`intro-focus @container relative mb-1.5 min-w-0 overflow-hidden rounded-3xl border-2 ${theme.surface} ${theme.depth}`}
      style={{ "--intro-delay": `${delayMs}ms` } as React.CSSProperties}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{ backgroundImage: `radial-gradient(${theme.dots} 1px, transparent 1.5px)`, backgroundSize: "16px 16px" }}
      />
      <div className="relative flex flex-col items-end @min-[29rem]:flex-row">
        <p className="min-w-0 self-stretch line-clamp-2 px-4 pt-3 text-sm text-slate-500 short:pt-2 short:text-xs sm:px-6 lg:px-9 lg:text-base @min-[29rem]:flex-1 @min-[29rem]:self-center @min-[29rem]:py-3 @min-[29rem]:pr-2 short:@min-[29rem]:py-2 lg:@min-[29rem]:py-4">
          {messages().home.practiceNote}
        </p>
        <div className="shrink-0 pt-2 @min-[29rem]:pt-4 lg:@min-[29rem]:pt-6">
          <CornerTab
            colorClass={theme.badge}
            corner="bottom-right"
            fillClass={theme.badgeFill}
            icon={<GameIcon className="h-5 w-5 short:h-4 short:w-4 lg:h-7 lg:w-7" game="practice" />}
            label={messages().home.tabs.practice}
            onClick={() => onSelect("practice")}
            size="lg"
          />
        </div>
      </div>
    </section>
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
    <div className="max-w-md rounded-2xl bg-white/85 p-2.5 shadow-sm ring-1 ring-amber-200 short:p-2 lg:p-4">
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

/** Davetle gelen oyuncunun girişi: kod hep açık durur, ek dokunuş gerekmez. Kod düelloya mı odaya mı ait, sunucu söyler. */
function JoinForm({ onJoin, outlineClass, submitClass }: { onJoin: (code: string) => Promise<string | null>; outlineClass: string; submitClass: string }) {
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

  return (
    // Liderler panosuyla aynı ince çerçeveli kutu; başlığı da onunki gibi.
    <form
      className="flex max-w-md min-w-0 flex-wrap items-center gap-1.5 rounded-2xl bg-white/85 p-2.5 shadow-sm ring-1 ring-orange-200 short:p-2 lg:gap-2 lg:p-4"
      onSubmit={(event) => void join(event)}
    >
      <label className="flex w-full items-center gap-1.5 text-[11px] font-bold tracking-[0.15em] text-orange-700 uppercase lg:text-xs" htmlFor="join-code">
        <span aria-hidden="true">🔑</span>
        {messages().home.haveCode}
      </label>
      <input
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
