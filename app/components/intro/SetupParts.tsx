"use client";

import Image from "next/image";
import { createContext, useContext } from "react";
import { CornerTab } from "../CornerTab";
import { ScopePreviewMap } from "../ScopePreviewMap";
import { flagUrl, type GameMode } from "@/lib/game";
import { type WorldScope } from "@/lib/world-countries";
import { GameIcon, type GameInfo } from "./games";

/** Seçili seçeneğin rengi oyunun rengini izler; SetupShell içindeki seçiciler buradan okur. */
const SelectedClass = createContext("border-cyan-600 bg-cyan-600 text-white");

type SetupShellProps = {
  game: GameInfo;
  map: GameMode;
  /** Önizleme haritasında vurgulanacak kapsam; kıta seçilmedikçe vurgu yok. */
  previewScope?: WorldScope;
  onMapChange: (map: GameMode) => void;
  onBack: () => void;
  /** Tuşun hemen üstündeki kısa açıklama. */
  note?: string;
  error?: string | null;
  actionLabel: string;
  isActionDisabled: boolean;
  onAction: () => void;
  children: React.ReactNode;
};

/**
 * Adım 2, dört oyunda aynı düzen: solda üstte geri tuşu ve oyunun adı, altında Türkiye / Dünya ve oynanacak haritanın
 * küçük önizlemesi; sağda daha geniş bir panelde oyunun kendi ayarları ve panelin sağ üst köşesinde eylem sekmesi.
 */
export function SetupShell({
  game,
  map,
  previewScope = "normal",
  onMapChange,
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
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 rounded-3xl border-2 border-slate-200 bg-white p-3 max-md:flex-none lg:gap-4 lg:p-5">
          <div className="flex shrink-0 items-center gap-2.5 lg:gap-3">
            <BackButton onClick={onBack} />
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl lg:h-12 lg:w-12 lg:rounded-2xl ${game.theme.tile}`}>
              <GameIcon className="h-5 w-5 lg:h-7 lg:w-7" game={game.id} />
            </span>
            <div className="min-w-0">
              <p className="font-display text-2xl leading-none font-bold text-slate-900 lg:text-4xl">{game.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 lg:mt-1 lg:text-sm">
                {game.facts.map((fact, index) => (
                  <span className="flex items-center gap-2" key={fact}>
                    {index > 0 && <span className="h-1 w-1 rounded-full bg-slate-300" />}
                    {fact}
                  </span>
                ))}
              </p>
            </div>
          </div>

          {/* Önizleme bu seçime göre değiştiği için Türkiye / Dünya haritanın hemen üstündedir. */}
          <MapSelector onChange={onMapChange} value={map} />

          {/* Harita dar ekranlarda üstte kalır; ezilmemesi için kendi asgari yüksekliği var. */}
          <div className="relative flex min-h-[8rem] flex-1 items-center justify-center overflow-hidden md:min-h-0">
            <ScopePreviewMap mode={map} scope={previewScope} />
          </div>
        </div>

        {/* Harita yalnızca önizleme; yatay telefonda ekranın büyük kısmı ayarlara ayrılır, seçiciler rahat sığar.
            Eylem tuşu giriş kartlarındaki gibi panelin sağ üst köşesinden içeri kıvrılan sekmedir. */}
        <aside className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border-2 border-slate-200 bg-white md:w-[58%] lg:w-[30rem] xl:w-[34rem]">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <p className="pt-3 pl-4 text-xs font-bold tracking-[0.15em] text-slate-400 uppercase short:pt-2.5 short:pl-3 lg:pt-5 lg:pl-7">Ayarlar</p>
            <CornerTab colorClass={game.theme.badge} disabled={isActionDisabled} label={actionLabel} onClick={onAction} />
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

/** Oyun seçimine dönüş: oyunun adının solunda yalnızca okun durduğu yuvarlak tuş. */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Oyun seçimine dön"
      className="hit-area flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:h-11 lg:w-11"
      onClick={onClick}
      title="Oyun seçimine dön"
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

const MAP_OPTIONS: { id: GameMode; label: string }[] = [
  { id: "turkey", label: "Türkiye" },
  { id: "world", label: "Dünya" },
];

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

/** Türkiye / Dünya: önizleme haritasının üstünde, iki eşit parça. */
function MapSelector({ value, onChange }: { value: GameMode; onChange: (map: GameMode) => void }) {
  return (
    <div aria-label="Harita" className="grid shrink-0 grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="radiogroup">
      {MAP_OPTIONS.map((option) => (
        <button
          aria-checked={value === option.id}
          className={`flex items-center justify-center gap-2 rounded-xl py-2 font-display text-lg font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:py-1 short:text-base lg:py-2.5 lg:text-xl ${
            value === option.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
          key={option.id}
          onClick={() => onChange(option.id)}
          role="radio"
          type="button"
        >
          <MapIcon map={option.id} />
          {option.label}
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
  disabled,
  onClick,
}: {
  label: string;
  count: number;
  isSelected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const selectedClass = useContext(SelectedClass);
  return (
    <button
      aria-checked={isSelected}
      className={`flex items-baseline justify-between gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold transition short:px-2 short:py-1 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none disabled:opacity-40 ${
        isSelected ? `${selectedClass} shadow-sm` : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
      }`}
      disabled={disabled}
      onClick={onClick}
      role="radio"
      type="button"
    >
      {label}
      <span className={`text-xs font-semibold tabular-nums ${isSelected ? "opacity-75" : "text-slate-400"}`}>{count}</span>
    </button>
  );
}
