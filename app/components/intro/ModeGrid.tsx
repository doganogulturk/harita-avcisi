"use client";

import { type FormEvent, useState } from "react";
import { type IntroGame } from "@/lib/intro-preferences";
import { CORNER_TAB_SIZE, CornerTab, CornerTile } from "../CornerTab";
import { GameIcon, GAMES, type GameInfo } from "./games";

type ModeGridProps = {
  /** Kartın açılış animasyonu, başlıktan sonra sırayla gelir. */
  introDelayMs: number;
  /** Kartlar arasındaki açılış gecikmesi farkı. */
  introStepMs: number;
  onSelect: (game: IntroGame) => void;
  onShowLeaderboard: () => void;
  /** Düello ve oda kartındaki "Kodla katıl"; 6 karakterlik kod geçerliyse o sayfaya gider. */
  onJoin: (game: "duel" | "room", code: string) => void;
};

/** Adım 1: dört oyun, 2×2 büyük kart (dikey telefonda alt alta). Kartın tamamı seçim yüzeyidir; kart içi bağlantılar ayrı çalışır. */
export function ModeGrid({ introDelayMs, introStepMs, onSelect, onShowLeaderboard, onJoin }: ModeGridProps) {
  return (
    <div className="grid min-h-0 w-full flex-1 grid-cols-1 grid-rows-4 gap-3 sm:grid-cols-2 sm:grid-rows-2 lg:gap-5">
      {GAMES.map((game, index) => (
        <ModeCard
          delayMs={introDelayMs + introStepMs * index}
          game={game}
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
  delayMs: number;
  onSelect: () => void;
  onShowLeaderboard?: () => void;
  onJoin?: (code: string) => void;
};

function ModeCard({ game, delayMs, onSelect, onShowLeaderboard, onJoin }: ModeCardProps) {
  const { theme } = game;
  const [isJoining, setIsJoining] = useState(false);
  const [code, setCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);

  const secondary = onShowLeaderboard
    ? { label: "Sıralamayı gör", icon: "trophy" as const, onClick: onShowLeaderboard }
    : onJoin
      ? { label: "Kodla katıl", icon: "code" as const, onClick: () => setIsJoining(true) }
      : null;

  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) return setJoinError("Kod 6 karakterdir.");
    onJoin?.(normalized);
  };

  return (
    <div
      className={`group card-sweep intro-focus relative flex min-h-0 min-w-0 flex-col rounded-3xl border-2 p-(--card-pad) transition-all duration-200 [--card-pad:1rem] [--tile:3rem] hover:-translate-y-1 hover:shadow-xl short:[--card-pad:0.75rem] short:[--tile:2.5rem] sm:[--card-pad:1.25rem] sm:[--tile:3.25rem] lg:[--card-pad:2rem] lg:[--tile:5rem] border-slate-200 ${theme.surface} ${theme.card}`}
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

      {/* Oyunun simgesi sol üst köşeye yapışık bir karodur; sekmelerle aynı biçimde ama tuş değil. */}
      <div className="absolute top-0 left-0 z-10">
        <CornerTile colorClass={theme.tile}>
          <GameIcon className="h-6 w-6 short:h-5 short:w-5 sm:h-7 sm:w-7 lg:h-10 lg:w-10" game={game.id} />
        </CornerTile>
      </div>

      {/* Kartın eylem tuşu sağ üst köşedeki sekmedir; kartın tuşuyla aynı işi yapar. Klavye ve ekran okuyucu için kart
          tuşu yeterli. */}
      <div className="absolute top-0 right-0 z-10">
        <CornerTab colorClass={theme.badge} isDecorative label={game.cardAction} onClick={onSelect} />
      </div>

      {/* İkincil iş (Sıralamayı gör, Kodla katıl) çaprazdaki sol alt köşede, daha küçük ve soluk tonda bir sekmedir. Kod
          alanı açıkken sekme çekilir, alan alt satırda açılır. */}
      {secondary && !isJoining && (
        <div className="absolute bottom-0 left-0 z-10">
          <CornerTab colorClass={theme.soft} corner="bottom-left" icon={<SecondaryIcon icon={secondary.icon} />} label={secondary.label} onClick={secondary.onClick} size="sm" />
        </div>
      )}

      <div className="pointer-events-none relative flex min-w-0 lg:mt-7">
        <div className="min-w-0 flex-1">
          {/* Köşe karosunun yer tutucusu: başlık ve açıklama karonun altına girmeden sağından akar. */}
          <span
            aria-hidden="true"
            className="float-left -mt-(--card-pad) -ml-(--card-pad) mr-3 mb-1 h-(--tile) w-(--tile) lg:-mt-[calc(var(--card-pad)+1.75rem)] lg:mr-5"
          />
          {/* Köşe sekmesinin yer tutucusu: başlık ve açıklama sekmenin altına girmeden yanından akar. Geniş ekranda kart
              yüksek olduğu için başlık bloğu sekmenin altından başlar (lg:mt-7); yer tutucu orada başlığı itmesin. */}
          <span aria-hidden="true" className={`invisible float-right -mt-(--card-pad) -mr-(--card-pad) mb-1 ml-3 flex items-center font-bold lg:hidden ${CORNER_TAB_SIZE}`}>
            {game.cardAction}
            <span className="h-4 w-4 lg:h-5 lg:w-5" />
          </span>
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

      {/* Satırın boş kısmı tıklamayı alttaki kart tuşuna geçirir; yalnızca içindeki tuşlar tıklanır. Kod alanı açılınca
          satır aynı yükseklikte kalır: kart taşarsa odaklanan alan kartın içeriğini yukarı kaydırır. */}
      <div className="pointer-events-none relative mt-2 flex min-h-7 items-center justify-between gap-2 short:mt-1 lg:mt-4 lg:min-h-9">
        {isJoining && onJoin ? (
          <form className="pointer-events-auto relative z-10 flex min-w-0 flex-1 flex-wrap items-center gap-1.5" onSubmit={join}>
            <input
              aria-label={`${game.title} kodu`}
              autoCapitalize="characters"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              className={`h-9 w-28 min-w-0 rounded-full border-2 bg-white px-3 short:h-8 text-center font-mono text-sm font-bold tracking-[0.2em] text-slate-900 uppercase outline-none focus:ring-2 lg:h-11 lg:w-36 lg:text-base ${theme.outline}`}
              enterKeyHint="go"
              spellCheck={false}
              maxLength={6}
              onChange={(event) => {
                setCode(event.target.value);
                setJoinError(null);
              }}
              placeholder="KX7P2M"
              value={code}
            />
            <button
              className={`hit-area h-9 rounded-full px-4 text-sm font-bold shadow-sm short:h-8 transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none lg:h-11 lg:px-5 lg:text-base ${theme.badge}`}
              type="submit"
            >
              Katıl
            </button>
            <button
              aria-label="Vazgeç"
              className="hit-area flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
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
          // Sol altta ikincil sekme durur (yukarıda); satır onun yüksekliğini korur.
          <span />
        )}
      </div>
    </div>
  );
}

function SecondaryIcon({ icon }: { icon: "trophy" | "code" }) {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} viewBox="0 0 24 24">
      {icon === "trophy" ? (
        <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
      ) : (
        <path d="M5 9h14M5 15h14M10 3 8 21M16 3l-2 18" />
      )}
    </svg>
  );
}
