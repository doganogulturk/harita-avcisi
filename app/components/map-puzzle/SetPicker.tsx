"use client";

import Link from "next/link";
import { CornerLabel, LABEL_COLOR } from "../districts/ProvincePicker";
import { BackArrow, ROUND_BUTTON } from "./MapPuzzle";
import { messages } from "@/lib/i18n";

/** Harita seçimi (İller: Türkiye ve bölgeler, Ülkeler: dünya ve kıtalar): başlık, altında kartlar (telefonda tek sütun). */
export function SetPicker({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  const { mapPuzzle: common } = messages();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 short:gap-2 lg:px-8 lg:pt-5">
      <div className="flex shrink-0 items-center gap-3">
        <Link aria-label={common.home} className={ROUND_BUTTON} href="/" title={common.home}>
          <BackArrow />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none font-bold lg:text-5xl">{title}</h1>
          <p className="mt-1 text-xs font-semibold text-cyan-100/75 short:hidden lg:text-base">{note}</p>
        </div>
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-6">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">{children}</ul>
      </div>
    </div>
  );
}

type SetCardProps = {
  name: string;
  count: string;
  /** Adın etiket rengi (bölgenin, kıtanın rengi); verilmezse denizin koyu tonu. */
  color?: string;
  textClass?: string;
  /** Kartın ortasındaki silüet: viewBox ve içindeki yollar. */
  viewBox?: string;
  children?: React.ReactNode;
  onPick: () => void;
};

/**
 * Harita kartı: saydam, ortada silüet (bütün ülke ya da dünya soluk, seçilen bölge ya da kıta beyaz; yeri bir bakışta
 * görünür). Sol altta adı, sağ altta parça sayısı.
 */
export function SetCard({ name, count, color = LABEL_COLOR, textClass = "text-white", viewBox, children, onPick }: SetCardProps) {
  return (
    <li>
      <button
        aria-label={`${name}, ${count}`}
        className="relative block h-36 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-white/15 bg-white/[0.07] text-left text-white transition hover:bg-white/[0.12] active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none sm:h-40 lg:h-44"
        onClick={onPick}
        type="button"
      >
        {viewBox && (
          <svg aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] top-[10%] h-[62%] w-[84%] drop-shadow-[0_2px_0_rgb(0_0_0/0.18)]" preserveAspectRatio="xMidYMid meet" viewBox={viewBox}>
            {children}
          </svg>
        )}
        <CornerLabel className={`max-w-[78%] px-3 pt-1.5 pb-1 font-display leading-tight font-bold ${name.length > 13 ? "text-base tracking-tight" : "text-lg lg:text-xl"} ${textClass}`} color={color} corner="bl">
          <span className="truncate">{name}</span>
        </CornerLabel>
        <CornerLabel className="px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white tabular-nums" color={LABEL_COLOR} corner="br">
          {count}
        </CornerLabel>
      </button>
    </li>
  );
}
