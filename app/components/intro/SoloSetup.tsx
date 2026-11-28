"use client";

import { turkeyChoice, worldChoice, type BoardId, type GameMode, type PlayChoice, type PlayKind, type WorldPrompt } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { setIntroMap, setQuestionPrompt, setTurkeyPrompt, setWorldScope, useAnswerStyle } from "@/lib/intro-preferences";
import { provinces } from "@/lib/turkish-plates";
import { capitalOf } from "@/lib/world-capitals";
import { neighborPool } from "@/lib/neighbors";
import { CONTINENTS, countries, countriesIn, isContinentScope, scopeCountryCount, scopeLocationIds, type WorldScope } from "@/lib/world-countries";
import { SectionTitle } from "./SetupParts";
import { type ModeBoard } from "./ModeTiles";
import { ModeList } from "./ModeList";
import { StylePicker } from "./StylePicker";
import { GameIcon, gameInfo } from "./games";

/**
 * Kapsamda sorulacak ülke sayısı; başkent turunda başkenti listede olmayanlar (tartışmalılar, bağlı topraklar) sayılmaz.
 * Komşuluk turunda yalnızca kapsamda kara komşusu olan ülkeler sorulur (app/page.tsx poolFor ile aynı kural).
 */
function questionCount(scope: WorldScope, prompt: WorldPrompt, isNeighbors: boolean): number {
  if (isNeighbors) {
    const pool = (isContinentScope(scope) ? countriesIn(scope) : countries).filter((country) => prompt !== "capital" || capitalOf(country.code));
    return neighborPool("world", pool).length;
  }
  return prompt === "capital" ? [...scopeLocationIds(scope)].filter((code) => capitalOf(code)).length : scopeCountryCount(scope);
}

const WORLD_PROMPT: Partial<Record<BoardId, WorldPrompt>> = { "world-hard": "name", "world-flags": "flag", "world-capitals": "capital" };

const TURKEY_BOARDS: BoardId[] = ["turkey", "turkey-plates"];
const WORLD_BOARDS: BoardId[] = ["world-hard", "world-flags", "world-capitals"];

type SoloSetupProps = {
  kind: PlayKind;
  scope: WorldScope;
  /** Haritası yüklenmiş modlar; yüklenmeyen haritanın karosu "hazırlanıyor" der. */
  readyModes: GameMode[];
  onBack: () => void;
  onPlay: (choice: PlayChoice) => void;
};

/**
 * Adım 2, Oyna ve Antrenman: beş mod karosu; dokunulan karonun turu hemen başlar. Ayar paneli yoktur. Antrenmanda dünya
 * modları için kıta seçimi karoların üstünde tek satırdır. Seçilen mod hatırlanır (sonuç ekranındaki "başka tur"). Her ikisi de
 * giriş istemez ve bağlantı olmadan da oynanır.
 */
export function SoloSetup({ kind, scope, readyModes, onBack, onPlay }: SoloSetupProps) {
  const game = gameInfo(kind);
  const { setup } = messages();
  const isPractice = kind === "practice";
  const style = useAnswerStyle();

  // Komşuluk Oyna'da da Antrenman'da da seçilebilir ve beş modun hepsinde açıktır. Oyna'da komşuluk turu 10 soru ve 120
  // saniyedir ama kaydedilmez (sonuç ekranı söyler): kayıt, sorunun konusunu bilmediği için rozetleri ve zayıf yer listesini bozardı.
  const isNeighbors = style === "neighbors";

  // Seçilen soru biçimi turun seçimine eklenir; "tekrar oyna", "bunları çalış" ve oyun içi mod değiştirme onu korur.
  // Komşuluk turu aynı zamanda şıklı bir turdur.
  const withStyle = (choice: PlayChoice): PlayChoice => {
    if (isNeighbors) return { ...choice, choices: true, neighbors: true };
    return style === "choose" ? { ...choice, choices: true } : choice;
  };

  const pick = (board: ModeBoard) => {
    setIntroMap(board.mode);
    const worldPrompt = WORLD_PROMPT[board.id];
    if (worldPrompt) {
      setQuestionPrompt(worldPrompt);
      onPlay(withStyle(worldChoice(kind, scope, worldPrompt)));
    } else {
      const turkeyPrompt = board.id === "turkey-plates" ? "plate" : "name";
      setTurkeyPrompt(turkeyPrompt);
      onPlay(withStyle(turkeyChoice(kind, turkeyPrompt)));
    }
  };

  const countFor = (id: BoardId) => {
    const worldPrompt = WORLD_PROMPT[id];
    return worldPrompt ? questionCount(isPractice ? scope : "all", worldPrompt, isNeighbors) : provinces.length;
  };

  const disabledReasonFor = (id: BoardId) => (readyModes.includes(id.startsWith("turkey") ? "turkey" : "world") ? null : setup.preparing);

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

      {/* Soru biçimi: üç büyük kart. Seçim hatırlanır; seçili kart oyunun renginde dolar. Eskiden küçük bir pil satırıydı
          ve ayar olduğu anlaşılmıyordu. */}
      <StylePicker isSaved={!isPractice} selectedClass={game.theme.selected} />

      {/* Türkiye ve Dünya, her biri tek renkli (Türkiye kırmızı, Dünya mavi) gruplanmış bir liste: solda modun görseli, ortada adı,
          sağda Başla. Alçak ve geniş ekranda iki bölüm yan yana. */}
      <div className="grid shrink-0 gap-5 short:gap-4 short:grid-cols-[2fr_3fr] lg:grid-cols-[2fr_3fr] lg:gap-8">
        <ModeList
          countFor={countFor}
          disabledReasonFor={disabledReasonFor}
          ids={TURKEY_BOARDS}
          map="turkey"
          onPick={pick}
          title={<SectionTitle map="turkey" />}
        />

        <ModeList
          countFor={countFor}
          disabledReasonFor={disabledReasonFor}
          belowTitle={
            isPractice ? (
              <div aria-label={setup.worldScope} className="flex flex-wrap gap-1.5 lg:gap-2" role="radiogroup">
                {[{ id: "all" as WorldScope, label: setup.all }, ...CONTINENTS.map((continent) => ({ id: continent.id as WorldScope, label: continent.label }))].map((option) => (
                  <button
                    aria-checked={scope === option.id}
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none sm:px-3 lg:px-3.5 lg:py-1.5 lg:text-sm ${
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
            ) : null
          }
          ids={WORLD_BOARDS}
          map="world"
          onPick={pick}
          title={<SectionTitle map="world" />}
        />
      </div>
    </div>
  );
}
