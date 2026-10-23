"use client";

import Image from "next/image";
import { useState } from "react";
import { PlateBadge } from "./GameTopBar";
import { flagUrl, formatPlate, isFlagChoice, isPlateChoice, locationName, type AnswerRecord, type PlayChoice } from "@/lib/game";

/** Antrenmanda cevap sayısı sınırsız; liste açılınca bu yüksekliği aşarsa kendi içinde kayar. */
const LIST_MAX_HEIGHT = "max-h-72";

/** Sorulan yer: bayrak turunda bayrak, plaka turunda plaka; adı her zaman yanında. */
function AskedLocation({ choice, location }: { choice: PlayChoice; location: string }) {
  const name = locationName(choice.mode, location);
  return (
    <span className="flex min-w-0 items-center gap-2">
      {isFlagChoice(choice) && (
        <Image alt="" className="h-4 w-auto shrink-0 rounded-[2px] border border-slate-200" height={16} src={flagUrl(location)} unoptimized width={22} />
      )}
      {isPlateChoice(choice) && <PlateBadge plate={Number(location)} size="sm" />}
      <span className="truncate font-bold text-slate-900">{name}</span>
    </span>
  );
}

/**
 * Turun soru soru dökümü. Kapalıyken skorun altında soru başına küçük bir kare durur (yeşil doğru, kırmızı yanlış);
 * dar ekranda yer kaplamadan turun özetini verir. "Soruları gör" ile her soru bir satır olur: sorulan yer ve yanlışsa
 * oyuncunun tıkladığı yer.
 */
export function RoundReview({ choice, answers }: { choice: PlayChoice; answers: AnswerRecord[] }) {
  const [isOpen, setIsOpen] = useState(false);
  if (answers.length === 0) return null;

  return (
    <div>
      <div aria-hidden="true" className="flex flex-wrap gap-1">
        {answers.map((answer, index) => (
          <span
            className={`flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-[11px] font-bold tabular-nums ${
              answer.location === answer.selected ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-700"
            }`}
            key={index}
          >
            {index + 1}
          </span>
        ))}
      </div>

      <button
        aria-expanded={isOpen}
        className="mt-2 flex items-center gap-1 text-sm font-semibold text-cyan-700 underline-offset-4 hover:underline"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {isOpen ? "Soruları gizle" : "Soruları gör"}
        <svg aria-hidden="true" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <ol className={`mt-2 flex flex-col gap-1 overflow-y-auto pr-1 ${LIST_MAX_HEIGHT}`}>
          {answers.map((answer, index) => {
            const isCorrect = answer.location === answer.selected;
            const picked = locationName(choice.mode, answer.selected);
            return (
              <li className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-sm" key={index}>
                <span className="w-5 shrink-0 text-xs font-bold text-slate-400 tabular-nums">{index + 1}</span>
                <span className="min-w-0 flex-1">
                  <AskedLocation choice={choice} location={answer.location} />
                </span>
                {isCorrect ? (
                  <span className="shrink-0 font-bold text-emerald-600">✓</span>
                ) : (
                  <span className="min-w-0 max-w-[45%] truncate text-xs font-semibold text-rose-600" title={`Tıkladığın: ${picked}`}>
                    ✗ {isPlateChoice(choice) ? `${formatPlate(Number(answer.selected))} ` : ""}
                    {picked}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
