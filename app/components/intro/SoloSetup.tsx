"use client";

import Image from "next/image";
import { flagUrl, turkeyChoice, worldChoice, type BoardId, type GameMode, type PlayChoice, type PlayKind, type WorldPrompt } from "@/lib/game";
import { useIsOnline } from "@/lib/hooks/useIsOnline";
import { messages } from "@/lib/i18n";
import { setIntroMap, setQuestionPrompt, setTurkeyPrompt, setWorldScope } from "@/lib/intro-preferences";
import { provinces } from "@/lib/turkish-plates";
import { capitalOf } from "@/lib/world-capitals";
import { CONTINENTS, scopeCountryCount, scopeLocationIds, type WorldScope } from "@/lib/world-countries";
import { type CardLeader } from "./ModeGrid";
import { ModeTiles, type ModeBoard } from "./ModeTiles";
import { GameIcon, gameInfo } from "./games";

/** Kapsamda sorulacak ülke sayısı; başkent turunda başkenti listede olmayanlar (tartışmalılar, bağlı topraklar) sayılmaz. */
function questionCount(scope: WorldScope, prompt: WorldPrompt): number {
  return prompt === "capital" ? [...scopeLocationIds(scope)].filter((code) => capitalOf(code)).length : scopeCountryCount(scope);
}

const WORLD_PROMPT: Partial<Record<BoardId, WorldPrompt>> = { "world-hard": "name", "world-flags": "flag", "world-capitals": "capital" };

const TURKEY_BOARDS: BoardId[] = ["turkey", "turkey-plates"];
const WORLD_BOARDS: BoardId[] = ["world-hard", "world-flags", "world-capitals"];

/** Bölüm başlığı: Türk bayrağı ya da dünya simgesi ve haritanın adı, yanında ince bir çizgi. */
function SectionTitle({ map }: { map: GameMode }) {
  return (
    <h3 className="flex items-center gap-2 font-display text-lg font-bold text-white short:text-base lg:text-2xl">
      {map === "turkey" ? (
        <Image alt="" className="h-4 w-auto rounded-[2px] lg:h-5" height={20} src={flagUrl("tr")} unoptimized width={30} />
      ) : (
        <svg aria-hidden="true" className="h-5 w-5 text-cyan-300 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
        </svg>
      )}
      {messages().setup.maps[map]}
      <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
    </h3>
  );
}

type SoloSetupProps = {
  kind: PlayKind;
  scope: WorldScope;
  /** Sıralamaların birincileri; yarışta her karonun üzerinde yazar. */
  leaders: Partial<Record<BoardId, CardLeader>>;
  /** Haritası yüklenmiş modlar; yüklenmeyen haritanın karosu "hazırlanıyor" der. */
  readyModes: GameMode[];
  /** Yarışta giriş yapılmamışsa bunu önceden söyler; giriş adımı sürpriz olmasın. */
  needsSignIn: boolean;
  onBack: () => void;
  onPlay: (choice: PlayChoice) => void;
};

/**
 * Adım 2, Yarış ve Antrenman: beş mod karosu; dokunulan karonun turu hemen başlar. Ayar paneli yoktur. Antrenmanda dünya
 * modları için kıta seçimi karoların üstünde tek satırdır. Seçilen mod hatırlanır (sonuç ekranındaki "başka tur").
 */
export function SoloSetup({ kind, scope, leaders, readyModes, needsSignIn, onBack, onPlay }: SoloSetupProps) {
  // Yarış turu sunucuda açılır; bağlantı yokken başlatılırsa skoru kaydedilemez. Antrenman bağlantısız da oynanır.
  const isOnline = useIsOnline();
  const isBlockedOffline = kind === "ranked" && !isOnline;
  const game = gameInfo(kind);
  const { setup } = messages();
  const isPractice = kind === "practice";

  const pick = (board: ModeBoard) => {
    setIntroMap(board.mode);
    const worldPrompt = WORLD_PROMPT[board.id];
    if (worldPrompt) {
      setQuestionPrompt(worldPrompt);
      onPlay(worldChoice(kind, scope, worldPrompt));
    } else {
      const turkeyPrompt = board.id === "turkey-plates" ? "plate" : "name";
      setTurkeyPrompt(turkeyPrompt);
      onPlay(turkeyChoice(kind, turkeyPrompt));
    }
  };

  const countFor = (id: BoardId) => {
    const worldPrompt = WORLD_PROMPT[id];
    return worldPrompt ? questionCount(isPractice ? scope : "all", worldPrompt) : provinces.length;
  };

  const tileProps = {
    countFor,
    disabledReasonFor: (id: BoardId) =>
      isBlockedOffline ? setup.offline : readyModes.includes(id.startsWith("turkey") ? "turkey" : "world") ? null : setup.preparing,
    leaderFor: isPractice ? undefined : (id: BoardId) => leaders[id] ?? null,
    onPick: pick,
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-3 short:gap-2 lg:gap-6">
      <div className="flex shrink-0 items-center gap-3 lg:gap-4">
        <button
          aria-label={setup.backToGames}
          className="hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/85 transition hover:border-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:h-8 short:w-8 lg:h-12 lg:w-12"
          onClick={onBack}
          title={setup.backToGames}
          type="button"
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl short:h-8 short:w-8 lg:h-14 lg:w-14 lg:rounded-2xl ${game.theme.badge}`}>
          <GameIcon className="h-6 w-6 short:h-5 short:w-5 lg:h-8 lg:w-8" game={kind} />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-3xl leading-none font-bold text-white short:text-2xl lg:text-5xl">{game.title}</h2>
          <p className="mt-1 truncate text-xs font-semibold text-cyan-100/75 short:mt-0.5 lg:text-base">{game.facts.join(" · ")}</p>
        </div>
      </div>

      {/* Türkiye ve Dünya ayrı bölümler: dikey ekranda alt alta, alçak ve geniş ekranda yan yana (Dünya'nın üç modu
          daha geniş sütunda). Antrenmanın kıta seçimi yalnızca dünya modlarını etkilediği için Dünya bölümündedir. */}
      <div className="grid shrink-0 gap-5 short:grid-cols-[2fr_3fr] short:gap-4 lg:grid-cols-[2fr_3fr] lg:gap-8">
        <section aria-label={setup.maps.turkey} className="flex min-w-0 flex-col gap-2.5 short:gap-1.5 lg:gap-3">
          <SectionTitle map="turkey" />
          <ModeTiles {...tileProps} gridClass="flex-1 grid-cols-1 sm:grid-cols-2" ids={TURKEY_BOARDS} />
        </section>

        <section aria-label={setup.maps.world} className="flex min-w-0 flex-col gap-2.5 short:gap-1.5 lg:gap-3">
          <SectionTitle map="world" />
          {isPractice && (
            <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" aria-label={setup.worldScope} role="radiogroup">
              {[{ id: "all" as WorldScope, label: setup.all }, ...CONTINENTS.map((continent) => ({ id: continent.id as WorldScope, label: continent.label }))].map((option) => (
                <button
                  aria-checked={scope === option.id}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:px-3 short:py-1 short:text-xs ${
                    scope === option.id ? "border-amber-300 bg-amber-400 text-amber-950" : "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
                  }`}
                  key={option.id}
                  onClick={() => setWorldScope(option.id)}
                  role="radio"
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          <ModeTiles {...tileProps} gridClass="flex-1 grid-cols-1 sm:grid-cols-2 short:grid-cols-3 lg:grid-cols-3" ids={WORLD_BOARDS} />
        </section>
      </div>

      {needsSignIn && isOnline && <p className="shrink-0 text-xs font-semibold text-cyan-100/70 lg:text-sm">{setup.signInFirst}</p>}
    </div>
  );
}
