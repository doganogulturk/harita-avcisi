"use client";

import { type FormEvent, useState } from "react";
import { type IntroGame } from "@/lib/intro-preferences";
import { GameIcon, GAMES, type GameInfo } from "./games";

type ModeGridProps = {
  lastGame: IntroGame | "none";
  /** Kartın açılış animasyonu, başlıktan sonra sırayla gelir. */
  introDelayMs: number;
  /** Kartlar arasındaki açılış gecikmesi farkı. */
  introStepMs: number;
  onSelect: (game: IntroGame) => void;
  onShowLeaderboard: () => void;
  /** Düello ve oda kartındaki "Kodla katıl"; 6 karakterlik kod geçerliyse o sayfaya gider. */
  onJoin: (game: "duel" | "room", code: string) => void;
};

/** Adım 1: dört oyun, 2×2 büyük kart. Kartın tamamı seçim yüzeyidir; kart içi bağlantılar ayrı çalışır. */
export function ModeGrid({ lastGame, introDelayMs, introStepMs, onSelect, onShowLeaderboard, onJoin }: ModeGridProps) {
  return (
    <div className="grid min-h-0 w-full flex-1 grid-cols-2 grid-rows-2 gap-3 lg:gap-5">
      {GAMES.map((game, index) => (
        <ModeCard
          delayMs={introDelayMs + introStepMs * index}
          game={game}
          isLast={lastGame === game.id}
          key={game.id}
          onJoin={game.id === "duel" || game.id === "room" ? (code) => onJoin(game.id as "duel" | "room", code) : undefined}
          onSelect={() => onSelect(game.id)}
          onShowLeaderboard={game.id === "ranked" ? onShowLeaderboard : undefined}
        />
      ))}
    </div>
  );
}

type ModeCardProps = {
  game: GameInfo;
  isLast: boolean;
  delayMs: number;
  onSelect: () => void;
  onShowLeaderboard?: () => void;
  onJoin?: (code: string) => void;
};

function ModeCard({ game, isLast, delayMs, onSelect, onShowLeaderboard, onJoin }: ModeCardProps) {
  const { theme } = game;
  const [isJoining, setIsJoining] = useState(false);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) return setJoinError("Kod 6 karakterdir.");
    onJoin?.(normalized);
  };

  return (
    <div
      className={`group card-sweep intro-focus relative flex min-h-0 min-w-0 flex-col rounded-3xl border-2 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl short:p-3 sm:p-5 lg:p-8 ${theme.surface} ${theme.card} ${
        isLast ? `${theme.lastCard} shadow-md` : "border-slate-200"
      }`}
      style={
        {
          "--intro-delay": `${delayMs}ms`,
          "--card-glow": theme.glow,
        } as React.CSSProperties
      }
    >
      {/* Kartın tamamını kaplayan asıl tuş; kart içi bağlantılar onun üzerinde durur. */}
      <button
        aria-label={`${game.title}: ${game.description}`}
        className="absolute inset-0 z-0 rounded-[1.4rem] focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:outline-none"
        onClick={onSelect}
        type="button"
      />

      {/* Köşede büyük, silik simge: kartı uzaktan tanınır kılar. */}
      <GameIcon
        className={`pointer-events-none absolute -right-6 -bottom-8 h-40 w-40 opacity-[0.07] transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.12] short:h-28 short:w-28 lg:h-56 lg:w-56 ${theme.watermark}`}
        game={game.id}
      />

      {isLast && (
        <span
          className={`pointer-events-none absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold shadow-sm short:top-2 short:right-2 lg:top-5 lg:right-5 lg:text-xs ${theme.badge}`}
        >
          Son oynadığın
        </span>
      )}

      <div className="pointer-events-none relative flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:gap-4 lg:gap-5 short:flex-row short:items-center short:gap-2.5">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl short:h-9 short:w-9 short:rounded-xl lg:h-20 lg:w-20 lg:rounded-3xl ${theme.tile}`}
        >
          <GameIcon className="h-6 w-6 short:h-5 short:w-5 lg:h-10 lg:w-10" game={game.id} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-2xl leading-none font-bold text-slate-900 short:text-xl sm:text-3xl lg:text-5xl">{game.title}</p>
          <p className="mt-1.5 line-clamp-3 text-xs text-slate-500 short:line-clamp-2 sm:text-sm lg:mt-3 lg:max-w-lg lg:text-lg">{game.description}</p>
        </div>
      </div>

      <div className="min-h-0 flex-1" />

      <div className="pointer-events-none relative mt-3 hidden flex-wrap gap-1.5 short:hidden sm:flex lg:gap-2">
        {game.facts.map((fact) => (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 lg:px-3 lg:text-sm" key={fact}>
            {fact}
          </span>
        ))}
      </div>

      {/* Satırın boş kısmı tıklamayı alttaki kart tuşuna geçirir; yalnızca içindeki tuşlar tıklanır. */}
      <div className="pointer-events-none relative mt-2 flex min-h-9 items-center justify-between gap-2 short:mt-1 lg:mt-4 lg:min-h-12">
        {isJoining && onJoin ? (
          <form className="pointer-events-auto relative z-10 flex min-w-0 flex-1 flex-wrap items-center gap-1.5" onSubmit={join}>
            <input
              aria-label={`${game.title} kodu`}
              autoCapitalize="characters"
              autoFocus
              className="w-28 min-w-0 rounded-xl border border-slate-300 bg-white px-2 py-1.5 text-center font-mono text-sm font-bold tracking-[0.2em] uppercase outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 lg:w-36 lg:text-base"
              maxLength={6}
              onChange={(event) => {
                setCode(event.target.value);
                setJoinError(null);
              }}
              placeholder="KX7P2M"
              value={code}
            />
            <button className={`rounded-xl px-3 py-1.5 text-sm font-bold ${theme.badge}`} type="submit">
              Katıl
            </button>
            <button
              aria-label="Vazgeç"
              className="rounded-full px-2 py-1 text-sm font-semibold text-slate-400 hover:text-slate-700"
              onClick={() => {
                setIsJoining(false);
                setJoinError(null);
              }}
              type="button"
            >
              ✕
            </button>
            {joinError && <span className="w-full text-xs font-semibold text-rose-600">{joinError}</span>}
          </form>
        ) : (
          <>
            {onShowLeaderboard && <CardLink className={theme.link} label="Sıralamayı gör" onClick={onShowLeaderboard} />}
            {onJoin && (
              <CardLink
                className="text-slate-500 decoration-slate-300 hover:text-slate-800 hover:decoration-slate-500"
                label="Kodla katıl"
                onClick={() => setIsJoining(true)}
              />
            )}
            {!onShowLeaderboard && !onJoin && <span />}
            {/* Kart tuşunun görünen yüzü; aynı işi yapar. Klavye ve ekran okuyucu için kart tuşu yeterli. */}
            <button
              aria-hidden="true"
              className={`group/action pill-shine pointer-events-auto relative z-10 flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold shadow-md transition-all duration-200 group-hover:gap-2.5 hover:-translate-y-0.5 hover:scale-105 hover:shadow-lg hover:brightness-110 active:translate-y-0 active:scale-95 active:shadow-sm short:px-3 short:py-1.5 lg:px-5 lg:py-3 lg:text-base ${theme.badge}`}
              onClick={onSelect}
              tabIndex={-1}
              type="button"
            >
              {game.cardAction}
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover/action:translate-x-1 lg:h-5 lg:w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function CardLink({ label, className, onClick }: { label: string; className: string; onClick: () => void }) {
  return (
    <button
      className={`pointer-events-auto relative z-10 text-sm font-semibold underline underline-offset-4 transition focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:text-base ${className}`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
