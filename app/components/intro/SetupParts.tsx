"use client";

import Image from "next/image";
import { createContext, useContext } from "react";
import { CornerTab } from "../CornerTab";
import { SetupPreviewMap } from "../MapDemo";
import { flagUrl, type GameMode, type QuestionPrompt } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { type IntroGame } from "@/lib/intro-preferences";
import { type WorldScope } from "@/lib/world-countries";
import { gameInfo, GameIcon, type GameInfo, type GroupInfo } from "./games";

/** Seçili seçeneğin rengi oyunun rengini izler; SetupShell içindeki seçiciler buradan okur. */
const SelectedClass = createContext("border-cyan-600 bg-cyan-600 text-white");

type SetupShellProps = {
  group: GroupInfo;
  /** Grubun içinde seçili oyun (Yarış, Antrenman, Düello, Oda); renkleri ve künyesi ondan gelir. */
  game: GameInfo;
  onGameChange: (game: IntroGame) => void;
  map: GameMode;
  onMapChange: (map: GameMode) => void;
  /** Soru tipi ya da mod (İsim / Bayrak / Başkent, İsim / Plaka). */
  modes: { id: string; label: string }[];
  mode: string;
  onModeChange: (mode: string) => void;
  /** Önizlemede sorulan soru tipi ve vurgulanan kapsam (kıta seçilmedikçe vurgu yok). */
  previewPrompt: QuestionPrompt;
  previewScope?: WorldScope;
  onBack: () => void;
  /** Tuşun hemen üstündeki kısa açıklama. */
  note?: string;
  error?: string | null;
  actionLabel: string;
  isActionDisabled: boolean;
  onAction: () => void;
  children?: React.ReactNode;
};

/**
 * Adım 2, iki grupta da aynı düzen. Solda üstte geri tuşu ve grubun adı; altında sırayla oyun (Yarış | Antrenman ya da
 * Düello | Oda), harita (Türkiye | Dünya) ve soru tipi; en altta bu seçimlerle dönen canlı önizleme. Sağda oyunun kendi
 * ayarları ve panelin sağ üst köşesinde eylem sekmesi. Oyunu ne oynayacağını belirleyen üç seçim yan yana durur;
 * önizleme her seçimin sonucunu hemen gösterir.
 */
export function SetupShell({
  group,
  game,
  onGameChange,
  map,
  onMapChange,
  modes,
  mode,
  onModeChange,
  previewPrompt,
  previewScope = "all",
  onBack,
  note,
  error,
  actionLabel,
  isActionDisabled,
  onAction,
  children,
}: SetupShellProps) {
  return (
    <SelectedClass.Provider value={game.theme.selected}>
      {/* Dikey telefonda harita kartı ve ayarlar alt alta durur; ayarlar uzunsa ekran kayar, harita ezilmez. */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 max-md:overflow-y-auto md:flex-row md:gap-4 lg:gap-5">
        {/* Dikeyde kart içeriğinden kısa olmaz ama boş kalan yeri alır: önizleme büyür, ekranın altı boş kalmaz. */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 rounded-3xl border-2 border-slate-200 bg-white p-3 max-md:flex-[1_0_auto] short:gap-1.5 lg:gap-3 lg:p-5">
          <div className="flex shrink-0 items-center gap-2.5 lg:gap-3">
            <BackButton onClick={onBack} />
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl short:h-8 short:w-8 lg:h-12 lg:w-12 lg:rounded-2xl ${game.theme.tile}`}>
              <GameIcon className="h-5 w-5 lg:h-7 lg:w-7" game={group.id} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none font-bold text-slate-900 short:text-xl lg:text-4xl">{group.title}</p>
              {/* Her künyenin önünde bir nokta durur; satırın başına düşen nokta kabın solundaki taşma alanında kalıp
                  gizlenir. Satır kırılınca "• Sıralamaya işlenir" gibi noktayla başlayan satır olmaz. */}
              <p className="mt-0.5 overflow-hidden text-xs text-slate-500 lg:mt-1 lg:text-sm">
                <span className="-ml-3 flex flex-wrap items-center gap-x-2">
                  {game.facts.map((fact) => (
                    <span className="flex items-center gap-2 whitespace-nowrap" key={fact}>
                      <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                      {fact}
                    </span>
                  ))}
                </span>
              </p>
            </div>
          </div>

          <TabSelector
            label={messages().setup.game}
            onChange={onGameChange}
            options={group.games.map((id) => ({ id, label: gameInfo(id).title, icon: <GameIcon className="h-4 w-4 lg:h-5 lg:w-5" game={id} /> }))}
            selectedClass={game.theme.selected}
            size="lg"
            value={game.id}
          />

          {/* Alçak (yatay telefon) ekranda harita ve soru tipi yan yana; önizlemeye yer kalsın. */}
          <div className="flex shrink-0 flex-col gap-2 short:grid short:grid-cols-2 short:gap-1.5">
            <TabSelector
              label={messages().setup.map}
              onChange={onMapChange}
              options={MAP_IDS.map((id) => ({ id, label: messages().setup.maps[id], icon: <MapIcon map={id} /> }))}
              value={map}
            />
            <TabSelector label={messages().setup.promptType} onChange={onModeChange} options={modes} size="sm" value={mode} />
          </div>

          {/* Harita dar ekranlarda üstte kalır; ezilmemesi için kendi asgari yüksekliği var. Soru tipinin ne demek olduğu
              haritanın sol alt köşesinde (denizde) kısa bir not olarak durur. */}
          <div className="relative flex min-h-[10rem] flex-1 items-center justify-center overflow-hidden short:min-h-[6rem] md:min-h-0">
            <SetupPreviewMap mode={map} prompt={previewPrompt} scope={previewScope} />
            <p className="pointer-events-none absolute bottom-0 left-0 max-w-[85%] rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 shadow-sm lg:px-3 lg:py-1 lg:text-sm">
              {(messages().setup.notes[map] as Partial<Record<QuestionPrompt, string>>)[previewPrompt] ?? ""}
            </p>
          </div>
        </div>

        {/* Yatay telefonda ekranın büyük kısmı ayarlara ayrılır, seçiciler rahat sığar. Eylem tuşu giriş kartlarındaki gibi
            panelin sağ üst köşesinden içeri kıvrılan sekmedir; panelin başlığı seçili oyundur. */}
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border-2 border-slate-200 bg-white md:w-[44%] lg:w-[24rem] xl:w-[26rem]">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <p className="pt-3 pl-4 text-xs font-bold tracking-[0.15em] text-slate-400 uppercase short:pt-2.5 short:pl-3 lg:pt-5 lg:pl-7">{game.title}</p>
            <CornerTab colorClass={game.theme.badge} disabled={isActionDisabled} fillClass={game.theme.badgeFill} label={actionLabel} onClick={onAction} />
          </div>

          <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 pb-4 short:px-3 short:pt-2 short:pb-3 lg:px-7 lg:pt-4 lg:pb-7">
            {/* Ayarlar taşarsa kendi içinde kayar. */}
            <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 short:gap-2 lg:gap-5">{children}</div>

            {error && <p className="mt-2 text-center text-sm font-semibold text-rose-600">{error}</p>}
            {note && <p className="mt-3 text-center text-xs text-slate-500 short:hidden">{note}</p>}
          </div>
        </aside>
      </div>
    </SelectedClass.Provider>
  );
}

/** Oyun seçimine dönüş: grubun adının solunda yalnızca okun durduğu yuvarlak tuş. */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label={messages().setup.backToGames}
      className="hit-area flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:h-8 short:w-8 lg:h-11 lg:w-11"
      onClick={onClick}
      title={messages().setup.backToGames}
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

const MAP_IDS: GameMode[] = ["turkey", "world"];

function MapIcon({ map }: { map: GameMode }) {
  if (map === "turkey") {
    return <Image alt="" className="h-4 w-auto rounded-[2px] shadow-sm" height={16} src={flagUrl("tr")} unoptimized width={21} />;
  }
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  );
}

const TAB_SIZES = {
  lg: "py-2 font-display text-lg short:py-1 short:text-base lg:py-2.5 lg:text-xl",
  md: "py-1.5 font-display text-base short:py-1 short:text-sm lg:py-2 lg:text-lg",
  sm: "py-1.5 text-sm short:py-1 short:text-xs lg:py-2 lg:text-base",
};

/**
 * Eşit parçalı seçici: oyun, harita ve soru tipi. Seçili parça beyaz kartla öne çıkar; `selectedClass` verilirse
 * (oyun seçicisi) oyunun rengiyle dolar, en üstteki asıl karar olduğu görünür.
 */
function TabSelector<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
  selectedClass = "bg-white text-slate-900 shadow-sm",
}: {
  label: string;
  options: { id: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  size?: keyof typeof TAB_SIZES;
  selectedClass?: string;
}) {
  return (
    <div
      aria-label={label}
      className="grid shrink-0 gap-1 rounded-2xl bg-slate-100 p-1"
      role="radiogroup"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          aria-checked={value === option.id}
          className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-1 font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${TAB_SIZES[size]} ${
            value === option.id ? selectedClass : "text-slate-500 hover:text-slate-800"
          }`}
          key={option.id}
          onClick={() => onChange(option.id)}
          role="radio"
          type="button"
        >
          {/* Alçak ekranda seçiciler yan yana daralır; simge yazıya yer bırakır. */}
          {option.icon && <span className="flex shrink-0 short:hidden">{option.icon}</span>}
          <span className="truncate">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

const NOTE_VISIBILITY = { all: "", tall: "short:hidden", short: "hidden short:block" };

/**
 * Ayar satırı: etiket üstte, seçici altta. Alçak (yatay telefon) ekranda etiket solda, seçici sağda durur; panelin
 * yüksekliği ayarlara ve eylem tuşuna böyle yetiyor.
 */
export function Field({
  label,
  htmlFor,
  note,
  noteOn = "all",
  children,
}: {
  label: string;
  htmlFor?: string;
  note?: string;
  /**
   * Notun hangi ekranlarda görüneceği: "tall" alçak ekranda gizler (not seçeneklerde zaten yazanı tekrarlıyorsa),
   * "short" yalnızca alçak ekranda gösterir (seçeneklerin kendi açıklaması orada gizlendiyse).
   */
  noteOn?: "all" | "tall" | "short";
  children: React.ReactNode;
}) {
  const labelClass = "mb-2 block text-sm font-bold text-slate-900 short:mb-0 short:text-xs";
  return (
    <div className="short:grid short:grid-cols-[4.5rem_minmax(0,1fr)] short:items-center short:gap-x-2">
      {htmlFor ? (
        <label className={labelClass} htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <p className={labelClass}>{label}</p>
      )}
      <div className="min-w-0">{children}</div>
      {note && <p className={`mt-2 text-xs text-slate-500 short:col-span-2 short:mt-1 ${NOTE_VISIBILITY[noteOn]}`}>{note}</p>}
    </div>
  );
}

/** İki-üç seçenekli açık seçici (İsim / Bayrak, Şehir / Plaka, 15 dk / 30 dk / 1 saat). */
export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const selectedClass = useContext(SelectedClass);
  return (
    <div aria-label={label} className="inline-flex max-w-full shrink-0 flex-wrap rounded-full border border-slate-200 bg-white p-0.5" role="radiogroup">
      {options.map((option) => (
        <button
          aria-checked={value === option.id}
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition short:px-3 short:py-1 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${
            value === option.id ? `${selectedClass} shadow-sm` : "text-slate-500 hover:text-slate-800"
          }`}
          key={option.id}
          onClick={() => onChange(option.id)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ScopeChip({
  label,
  count,
  isSelected,
  className = "",
  onClick,
}: {
  label: string;
  count: number;
  isSelected: boolean;
  className?: string;
  onClick: () => void;
}) {
  const selectedClass = useContext(SelectedClass);
  return (
    <button
      aria-checked={isSelected}
      className={`flex items-baseline justify-between gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold transition short:px-2 short:py-1 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${className} ${
        isSelected ? `${selectedClass} shadow-sm` : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
      }`}
      onClick={onClick}
      role="radio"
      type="button"
    >
      {label}
      <span className={`text-xs font-semibold tabular-nums ${isSelected ? "opacity-75" : "text-slate-400"}`}>{count}</span>
    </button>
  );
}
