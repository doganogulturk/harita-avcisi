"use client";

import { type FormEvent, useState } from "react";
import { messages } from "@/lib/i18n";
import { type IntroGame } from "@/lib/intro-preferences";
import { CornerTab } from "../CornerTab";
import { gameInfo, GameIcon, GROUPS, type GroupInfo } from "./games";

type ModeGridProps = {
  /** Kartın açılış animasyonu, başlıktan sonra sırayla gelir. */
  introDelayMs: number;
  /** Kartlar arasındaki açılış gecikmesi farkı. */
  introStepMs: number;
  onSelect: (game: IntroGame) => void;
  onShowLeaderboard: () => void;
  /** Arkadaşlarımla kartındaki kod alanı: kod bir düelloya ya da odaya götürür. Hata varsa metnini döndürür. */
  onJoin: (code: string) => Promise<string | null>;
  /** Tek başıma kartındaki canlı bilgi: sıralamaların birincileri ("Türkiye'de 1. Murat · 10/10 · 00:42"). */
  rankedLeaders?: CardLeader[];
};

export type CardLeader = { place: string; name: string; score: string; time: string };

/**
 * Adım 1: iki büyük kart, Tek başıma ve Arkadaşlarımla (dikey telefonda alt alta). Kartın sol ve sağ alt köşesinden grubun
 * iki oyununun sekmesi içeri kıvrılır (Yarış, Antrenman · Düello, Oda); sekme o oyunun ayar ekranını açar, ara adım yoktur. Kartın kendisi bir
 * çerçevedir, dokunmak bir şey yapmaz. Ekran yetmezse (küçük telefon) liste kayar, yazılar üst üste binmez. Kaydırma
 * alanının kenar boşluğu, kartın gölgesi kırpılmasın diye.
 */
export function ModeGrid({ introDelayMs, introStepMs, onSelect, onShowLeaderboard, onJoin, rankedLeaders = [] }: ModeGridProps) {
  return (
    <div className="-mx-1.5 -mb-1.5 grid min-h-0 w-[calc(100%+0.75rem)] flex-1 grid-cols-1 grid-rows-[repeat(2,minmax(min-content,1fr))] gap-3 overflow-y-auto px-1.5 pt-1 pb-1.5 sm:grid-cols-2 sm:grid-rows-[minmax(min-content,1fr)] lg:max-h-[36rem] lg:gap-5">
      {GROUPS.map((group, index) => (
        <GroupCard
          delayMs={introDelayMs + introStepMs * index}
          group={group}
          key={group.id}
          onSelect={onSelect}
          {...(group.id === "solo" ? { leaders: rankedLeaders, onShowLeaderboard } : { onJoin })}
        />
      ))}
    </div>
  );
}

type GroupCardProps = {
  group: GroupInfo;
  delayMs: number;
  onSelect: (game: IntroGame) => void;
  leaders?: CardLeader[];
  onShowLeaderboard?: () => void;
  onJoin?: (code: string) => Promise<string | null>;
};

function GroupCard({ group, delayMs, onSelect, leaders = [], onShowLeaderboard, onJoin }: GroupCardProps) {
  const { theme } = group;

  return (
    <section
      aria-label={group.title}
      className={`intro-focus relative flex min-h-0 min-w-0 flex-col overflow-hidden rounded-3xl border-2 border-slate-200 p-(--card-pad) [--card-pad:1rem] short:[--card-pad:0.75rem] sm:[--card-pad:1.5rem] lg:[--card-pad:2.25rem] ${theme.surface}`}
      style={{ "--intro-delay": `${delayMs}ms` } as React.CSSProperties}
    >
      {/* Grubun simgesi kartın sağ üst köşesinde büyük ve silik durur; kartı uzaktan tanınır kılar. */}
      <GameIcon
        className={`pointer-events-none absolute -top-6 -right-6 h-36 w-36 opacity-[0.08] short:h-24 short:w-24 sm:h-48 sm:w-48 lg:h-64 lg:w-64 ${theme.watermark}`}
        game={group.id}
      />

      <div className="relative min-w-0">
        <h2 className="font-display text-3xl leading-none font-bold text-slate-900 short:text-2xl sm:text-4xl lg:text-6xl">{group.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-500 short:mt-1 short:text-xs max-[25rem]:text-xs lg:mt-4 lg:max-w-lg lg:text-lg">{group.description}</p>

        {/* Ortada kartın canlı kısmı: birinciler ve sıralama bağlantısı ya da davet kodu. */}
        {onShowLeaderboard && (
          <div className="mt-3 flex flex-col items-start gap-1 short:mt-1.5 lg:mt-5 lg:gap-1.5">
            {leaders.map((leader) => (
              <p
                className="flex max-w-full items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs text-slate-700 shadow-sm lg:px-3 lg:py-1 lg:text-sm"
                key={leader.place}
              >
                <span aria-hidden="true">🏆</span>
                <span className="shrink-0 font-semibold text-slate-500">{leader.place}</span>
                <span className="min-w-0 truncate font-bold">{leader.name}</span>
                <span className="shrink-0 font-semibold tabular-nums">
                  · {leader.score} · {leader.time}
                </span>
              </p>
            ))}
            <button
              className={`hit-area mt-0.5 flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:px-4 lg:py-1.5 lg:text-sm ${theme.soft}`}
              onClick={onShowLeaderboard}
              type="button"
            >
              <TrophyIcon />
              {messages().home.showLeaderboard}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
        {onJoin && <JoinForm onJoin={onJoin} outlineClass={theme.outline} submitClass={theme.badge} />}
      </div>

      <div className="min-h-3 flex-1" />

      {/* Grubun iki oyunu kartın alt köşelerinden içeri kıvrılan sekmelerdir (soldaki ve sağdaki), her biri kendi oyununun
          renginde; dokununca o oyunun ayar ekranı açılır. Bu boşluk sekmelerin yeridir, içerik altlarına girmez. */}
      <div aria-hidden="true" className="h-9 shrink-0 short:h-8 lg:h-12" />
      {group.games.map((id, index) => {
        const game = gameInfo(id);
        return (
          <div className={`absolute bottom-0 z-10 ${index === 0 ? "left-0" : "right-0"}`} key={id}>
            <CornerTab colorClass={game.theme.badge} corner={index === 0 ? "bottom-left" : "bottom-right"} fillClass={game.theme.badgeFill} label={game.title} onClick={() => onSelect(id)} />
          </div>
        );
      })}
    </section>
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
    <form className="mt-3 flex min-w-0 flex-wrap items-center gap-1.5 short:mt-1.5 lg:mt-5 lg:gap-2" onSubmit={(event) => void join(event)}>
      <label className="w-full text-xs font-semibold text-slate-500 lg:text-sm" htmlFor="join-code">
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
        placeholder="KX7P2M"
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
