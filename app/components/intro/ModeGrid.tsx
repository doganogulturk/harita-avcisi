"use client";

import { type FormEvent, useState } from "react";
import { type IntroGroup } from "@/lib/intro-preferences";
import { CORNER_TAB_SIZE, CornerTab } from "../CornerTab";
import { gameInfo, GameIcon, GROUPS, type GroupInfo } from "./games";

type ModeGridProps = {
  /** Kartın açılış animasyonu, başlıktan sonra sırayla gelir. */
  introDelayMs: number;
  /** Kartlar arasındaki açılış gecikmesi farkı. */
  introStepMs: number;
  onSelect: (group: IntroGroup) => void;
  onShowLeaderboard: () => void;
  /** Arkadaşlarla kartındaki kod alanı: kod bir düelloya ya da odaya götürür. Hata varsa metnini döndürür. */
  onJoin: (code: string) => Promise<string | null>;
  /** Tek başına kartındaki canlı bilgi: sıralamaların birincileri ("Türkiye'de 1. Murat · 10/10 · 00:42"). */
  rankedLeaders?: CardLeader[];
};

export type CardLeader = { place: string; name: string; score: string; time: string };

/**
 * Adım 1: iki büyük kart, Tek başına ve Arkadaşlarla (dikey telefonda alt alta). Oyuncunun ilk kararı kiminle
 * oynayacağıdır; Yarış / Antrenman ve Düello / Oda seçimi ikinci adımdadır. Kartın tamamı seçim yüzeyidir; kart içi
 * bağlantılar ve kod alanı ayrı çalışır. Ekran yetmezse (küçük telefon) liste kayar, yazılar üst üste binmez. Kaydırma
 * alanının kenar boşluğu, kartın üzerine gelince kalkması ve gölgesi kırpılmasın diye.
 */
export function ModeGrid({ introDelayMs, introStepMs, onSelect, onShowLeaderboard, onJoin, rankedLeaders = [] }: ModeGridProps) {
  return (
    <div className="-mx-1.5 -mb-1.5 grid min-h-0 w-[calc(100%+0.75rem)] flex-1 grid-cols-1 grid-rows-[repeat(2,minmax(min-content,1fr))] gap-3 overflow-y-auto px-1.5 pt-1 pb-1.5 sm:grid-cols-2 sm:grid-rows-[minmax(min-content,1fr)] lg:max-h-[36rem] lg:gap-5">
      {GROUPS.map((group, index) => (
        <GroupCard
          delayMs={introDelayMs + introStepMs * index}
          group={group}
          key={group.id}
          leaders={group.id === "solo" ? rankedLeaders : []}
          onJoin={group.id === "friends" ? onJoin : undefined}
          onSelect={() => onSelect(group.id)}
          onShowLeaderboard={group.id === "solo" ? onShowLeaderboard : undefined}
        />
      ))}
    </div>
  );
}

type GroupCardProps = {
  group: GroupInfo;
  leaders: CardLeader[];
  delayMs: number;
  onSelect: () => void;
  onShowLeaderboard?: () => void;
  onJoin?: (code: string) => Promise<string | null>;
};

function GroupCard({ group, leaders, delayMs, onSelect, onShowLeaderboard, onJoin }: GroupCardProps) {
  const { theme } = group;

  return (
    <div
      className={`group card-sweep intro-focus relative flex min-h-0 min-w-0 flex-col rounded-3xl border-2 p-(--card-pad) transition-all duration-200 [--card-pad:1rem] hover:-translate-y-1 hover:shadow-xl short:[--card-pad:0.75rem] sm:[--card-pad:1.5rem] lg:[--card-pad:2.25rem] border-slate-200 ${theme.surface} ${theme.card}`}
      style={
        {
          "--intro-delay": `${delayMs}ms`,
          "--card-glow": theme.glow,
        } as React.CSSProperties
      }
    >
      {/* Kartın tamamını kaplayan asıl tuş; kart içi bağlantılar onun üzerinde durur. */}
      <button
        aria-label={`${group.title}: ${group.description}`}
        className="absolute inset-0 z-0 rounded-[1.4rem] focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:outline-none"
        onClick={onSelect}
        type="button"
      />

      {/* Grubun simgesi kartın sağ alt köşesinde büyük ve silik durur; kartı uzaktan tanınır kılar. */}
      <GameIcon
        className={`pointer-events-none absolute -right-6 -bottom-8 h-40 w-40 opacity-[0.1] transition-all duration-300 group-hover:scale-105 group-hover:opacity-[0.16] short:h-28 short:w-28 sm:h-52 sm:w-52 lg:h-72 lg:w-72 ${theme.watermark}`}
        game={group.id}
      />

      {/* Kartın eylem tuşu sağ üst köşedeki sekmedir; kartın tuşuyla aynı işi yapar. Klavye ve ekran okuyucu için kart
          tuşu yeterli. */}
      <div className="absolute top-0 right-0 z-10">
        <CornerTab colorClass={theme.badge} fillClass={theme.badgeFill} isDecorative label={group.cardAction} onClick={onSelect} />
      </div>

      {/* İkincil iş (Sıralamayı gör) çaprazdaki sol alt köşede, daha küçük ve soluk tonda bir sekmedir. */}
      {onShowLeaderboard && (
        <div className="absolute bottom-0 left-0 z-10">
          <CornerTab colorClass={theme.soft} corner="bottom-left" fillClass={theme.softFill} icon={<TrophyIcon />} label="Sıralamayı gör" onClick={onShowLeaderboard} size="sm" />
        </div>
      )}

      <div className="pointer-events-none relative flex min-w-0">
        <div className="min-w-0 flex-1">
          {/* Köşe sekmesinin yer tutucusu: başlık ve açıklama sekmenin altına girmeden yanından akar. Geniş ekranda açıklama
              dar tutulduğu (lg:max-w-lg) için sekmeye ulaşmaz; yer tutucu orada gerekmez. */}
          <span aria-hidden="true" className={`invisible float-right -mt-(--card-pad) -mr-(--card-pad) mb-1 ml-3 flex items-center font-bold lg:hidden ${CORNER_TAB_SIZE}`}>
            {group.cardAction}
            <span className="h-4 w-4 lg:h-5 lg:w-5" />
          </span>
          <p className="font-display text-3xl leading-none font-bold text-slate-900 short:text-2xl sm:text-4xl lg:text-6xl">{group.title}</p>
          <p className="mt-2 line-clamp-3 text-sm text-slate-500 short:mt-1 short:line-clamp-2 short:text-xs lg:mt-4 lg:max-w-lg lg:text-lg 2xl:text-xl">{group.description}</p>
          {/* Grubun iki oyunu: kartın içinde ne olduğunu söyler; seçim ikinci adımdadır. */}
          <ul className="mt-3 flex flex-wrap gap-1.5 short:mt-1.5 lg:mt-5 lg:gap-2">
            {group.games.map((id) => {
              const game = gameInfo(id);
              return (
                <li className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold lg:px-3.5 lg:py-1.5 lg:text-base ${game.theme.tile}`} key={id}>
                  <GameIcon className="h-3.5 w-3.5 lg:h-5 lg:w-5" game={id} />
                  {game.title}
                </li>
              );
            })}
          </ul>
          {/* Canlı bilgi (Türkiye'nin ve Dünya'nın birincisi): kart yalnızca bir menü değil, oyunun içinden bir an
              gösterir. Dar ekranda yalnızca ad kısalır; skor ve süre hep görünür. */}
          {leaders.length > 0 && (
            <ul className="mt-3 flex max-w-full flex-col items-start gap-1 short:hidden lg:mt-5 lg:gap-1.5">
              {leaders.map((leader) => (
                <li
                  className="flex max-w-full items-center gap-1 rounded-full bg-white/80 px-2.5 py-0.5 text-xs text-slate-700 shadow-sm lg:px-3 lg:py-1 lg:text-sm"
                  key={leader.place}
                >
                  <span aria-hidden="true">🏆</span>
                  <span className="shrink-0 font-semibold text-slate-500">{leader.place} 1.</span>
                  <span className="min-w-0 truncate font-bold">{leader.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    · {leader.score} · {leader.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1" />

      {onJoin ? (
        <JoinForm onJoin={onJoin} outlineClass={theme.outline} submitClass={theme.badge} />
      ) : (
        // Sol altta ikincil sekme durur (yukarıda); satır onun yüksekliğini korur.
        <div className="pointer-events-none mt-2 min-h-7 lg:min-h-9" />
      )}
    </div>
  );
}

/**
 * Davetle gelen oyuncunun girişi: kod hep açık durur, ek dokunuş gerekmez. Kod düelloya mı odaya mı ait, sunucu söyler.
 * Satırın boş kısmı tıklamayı alttaki kart tuşuna geçirir; yalnızca alan ve tuş tıklanır.
 */
function JoinForm({ onJoin, outlineClass, submitClass }: { onJoin: (code: string) => Promise<string | null>; outlineClass: string; submitClass: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) return setError("Kod 6 karakterdir.");
    setIsBusy(true);
    const joinError = await onJoin(normalized);
    setIsBusy(false);
    setError(joinError);
  };

  return (
    <form className="pointer-events-none relative z-10 mt-3 flex min-w-0 flex-wrap items-center gap-1.5 short:mt-1.5 lg:mt-5 lg:gap-2" onSubmit={(event) => void join(event)}>
      <span className="pointer-events-none w-full text-xs font-semibold text-slate-500 short:hidden lg:text-sm">Kodun var mı?</span>
      <input
        aria-label="Düello ya da oda kodu"
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        className={`pointer-events-auto h-10 w-32 min-w-0 rounded-full border-2 bg-white px-3 text-center font-mono text-sm font-bold tracking-[0.2em] text-slate-900 uppercase outline-none focus:ring-2 short:h-8 lg:h-12 lg:w-44 lg:text-base ${outlineClass}`}
        enterKeyHint="go"
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
        className={`hit-area pointer-events-auto h-10 rounded-full px-5 text-sm font-bold shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 short:h-8 short:px-4 lg:h-12 lg:px-6 lg:text-base ${submitClass}`}
        disabled={isBusy}
        type="submit"
      >
        {isBusy ? "…" : "Katıl"}
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
