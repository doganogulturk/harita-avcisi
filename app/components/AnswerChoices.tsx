"use client";

import Image from "next/image";
import { useEffect } from "react";
import { PlateBadge } from "./GameTopBar";
import { flagUrl, isCapitalChoice, isFlagChoice, isPlateChoice, isSameLocation, locationName, type AnswerState, type PlayChoice } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { capitalOf } from "@/lib/world-capitals";

type AnswerChoicesProps = {
  choice: PlayChoice;
  /** Şıklar, yer kimlikleri olarak, gösterim sırasıyla (lib/choices.ts). */
  options: readonly string[];
  correctLocation: string;
  selectedLocation: string | null;
  answerState: AnswerState;
  onPick: (locationId: string) => void;
};

/** Bir şıkkın içeriği, modun kendi gösterimiyle: yer adı, bayrak, başkent ya da plaka. Ad, cevaptan sonra altta görünür. */
function OptionBody({ choice, id, isRevealed }: { choice: PlayChoice; id: string; isRevealed: boolean }) {
  const name = locationName(choice.mode, id);
  const caption = isRevealed ? <span className="max-w-full truncate text-xs font-semibold opacity-80">{name}</span> : null;

  if (isFlagChoice(choice)) {
    return (
      <>
        <Image alt="" className="h-7 w-auto rounded-sm border border-slate-300 shadow-sm lg:h-9" height={36} src={flagUrl(id)} unoptimized width={48} />
        {caption}
      </>
    );
  }
  if (isCapitalChoice(choice)) {
    return (
      <>
        <span className="max-w-full truncate font-display text-base font-bold lg:text-xl">{capitalOf(id) ?? name}</span>
        {caption}
      </>
    );
  }
  if (isPlateChoice(choice)) {
    return (
      <>
        <PlateBadge plate={Number(id)} size="sm" />
        {caption}
      </>
    );
  }
  return <span className="max-w-full truncate font-display text-base font-bold lg:text-xl">{name}</span>;
}

/**
 * Şıklı soru: haritada işaretli yerin dört şıkkı (GameMap, isMarking). Cevaptan sonra doğru şık yeşil, yanlış seçilen
 * kırmızı olur ve her şıkkın altında yerin adı görünür; diğerleri solar. 1-4 tuşları şık seçer (masaüstü).
 */
export function AnswerChoices({ choice, options, correctLocation, selectedLocation, answerState, onPick }: AnswerChoicesProps) {
  const isAnswered = answerState !== null;

  useEffect(() => {
    if (isAnswered) return;
    const pickWithNumber = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const option = options[Number(event.key) - 1];
      if (option) onPick(option);
    };
    document.addEventListener("keydown", pickWithNumber);
    return () => document.removeEventListener("keydown", pickWithNumber);
  }, [isAnswered, onPick, options]);

  return (
    <div
      aria-label={messages().game.choicesAria}
      className="grid shrink-0 grid-cols-2 gap-2 bg-slate-900/40 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:grid-cols-4 short:grid-cols-4 short:gap-1.5 short:p-1.5 lg:gap-3 lg:p-3"
      role="group"
    >
      {options.map((id, index) => {
        const isCorrect = isSameLocation(choice.mode, id, correctLocation);
        const isPicked = isSameLocation(choice.mode, id, selectedLocation);
        // Cevaptan sonra: doğru şık yeşil, yanlış seçilen kırmızı, diğerleri solar.
        const tone = !isAnswered
          ? "border-slate-200 bg-white text-slate-900 hover:border-cyan-400 hover:bg-cyan-50"
          : isCorrect
            ? "border-emerald-600 bg-emerald-300 text-emerald-950"
            : isPicked
              ? "border-rose-600 bg-rose-300 text-rose-950"
              : "border-slate-200 bg-white/60 text-slate-500 opacity-60";
        return (
          <button
            aria-label={locationName(choice.mode, id)}
            className={`press press-sm relative flex min-h-14 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-2xl border-2 px-2 py-2 text-center transition focus-visible:ring-4 focus-visible:ring-cyan-300 focus-visible:outline-none disabled:cursor-default short:min-h-10 short:py-1 lg:min-h-20 lg:px-3 ${tone}`}
            disabled={isAnswered}
            key={id}
            onClick={() => onPick(id)}
            style={{ "--press-edge": isAnswered && isCorrect ? "#047857" : isAnswered && isPicked ? "#be123c" : "#94a3b8" } as React.CSSProperties}
            type="button"
          >
            <span aria-hidden="true" className="absolute top-1 left-2 hidden text-[10px] font-bold text-slate-400 lg:block">
              {index + 1}
            </span>
            <OptionBody choice={choice} id={id} isRevealed={isAnswered} />
          </button>
        );
      })}
    </div>
  );
}
