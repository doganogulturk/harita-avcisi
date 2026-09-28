"use client";

import Image from "next/image";
import { createContext, useContext } from "react";
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
 * Adım 2, dört oyunda aynı düzen: solda oynanacak haritanın önizlemesi, sağda en üstte Türkiye / Dünya,
 * altında oyunun kendi ayarları ve en altta büyük eylem tuşu.
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
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-4 lg:gap-5">
        {/* Harita dar ekranlarda üstte kalır; ezilmemesi için kendi asgari yüksekliği var. */}
        <div className="relative flex min-h-[8rem] flex-1 items-center justify-center overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-3 md:min-h-0 lg:p-4">
          <ScopePreviewMap mode={map} scope={previewScope} />
        </div>

        <aside className="flex w-full shrink-0 flex-col rounded-3xl border-2 border-slate-200 bg-white p-4 md:w-[20rem] lg:w-[26rem] lg:p-7">
          {/* Ayarlar taşarsa kendi içinde kayar; eylem tuşu alçak ekranlarda da hep görünür kalır. */}
          <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 short:gap-3 lg:gap-5">
            <div>
              <BackLink onClick={onBack} />
              <div className="mt-2.5 flex items-center gap-3 short:mt-1.5">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl short:h-9 short:w-9 lg:h-12 lg:w-12 ${game.theme.tile}`}>
                  <GameIcon className="h-6 w-6 short:h-5 short:w-5 lg:h-7 lg:w-7" game={game.id} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-3xl leading-none font-bold text-slate-900 short:text-2xl lg:text-4xl">{game.title}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500 lg:text-sm">
                    {game.facts.map((fact, index) => (
                      <span className="flex items-center gap-2" key={fact}>
                        {index > 0 && <span className="h-1 w-1 rounded-full bg-slate-300" />}
                        {fact}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </div>

            <MapSelector onChange={onMapChange} value={map} />

            {children}
          </div>

          {note && <p className="mt-3 text-center text-xs text-slate-500 short:hidden">{note}</p>}
          {error && <p className="mt-2 text-center text-sm font-semibold text-rose-600">{error}</p>}
          <button className={`mt-3 short:mt-2 lg:mt-4 ${game.theme.button}`} disabled={isActionDisabled} onClick={onAction} type="button">
            {actionLabel}
            {!isActionDisabled && (
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </aside>
      </div>
    </SelectedClass.Provider>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button className="flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-cyan-700" onClick={onClick} type="button">
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Oyun modu
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

/** Türkiye / Dünya: ayarların en üstünde, iki eşit parça. */
function MapSelector({ value, onChange }: { value: GameMode; onChange: (map: GameMode) => void }) {
  return (
    <div aria-label="Harita" className="grid shrink-0 grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="radiogroup">
      {MAP_OPTIONS.map((option) => (
        <button
          aria-checked={value === option.id}
          className={`flex items-center justify-center gap-2 rounded-xl py-2 font-display text-lg font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:py-1.5 short:text-base lg:py-2.5 lg:text-xl ${
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

export function Field({ label, htmlFor, note, children }: { label: string; htmlFor?: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      {htmlFor ? (
        <label className="mb-2 block text-sm font-bold text-slate-900 short:mb-1.5" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <p className="mb-2 text-sm font-bold text-slate-900 short:mb-1.5">{label}</p>
      )}
      {children}
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
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
          className={`rounded-full px-4 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${
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
      className={`flex items-baseline justify-between gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none disabled:opacity-40 ${
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
