"use client";

import { useState } from "react";
import { type NeighborAsk } from "@/lib/neighbors";
import { AskedLocation } from "./RoundReview";
import { formatPlate, isPlateChoice, locationName, type AnswerRecord, type PlayChoice } from "@/lib/game";
import { messages } from "@/lib/i18n";

/** Yanlışlar bu sayıyı aşarsa (uzun antrenman) ilk bu kadarı görünür, gerisi "Hepsini göster" ile açılır. */
const WRONG_PREVIEW = 6;

type Numbered = { answer: AnswerRecord; number: number };

function numberAnswers(answers: AnswerRecord[]): { wrong: Numbered[]; right: Numbered[] } {
  const numbered = answers.map((answer, index) => ({ answer, number: index + 1 }));
  return {
    wrong: numbered.filter(({ answer }) => answer.location !== answer.selected),
    right: numbered.filter(({ answer }) => answer.location === answer.selected),
  };
}

function Chevron({ isOpen }: { isOpen: boolean }) {
  return (
    <svg aria-hidden="true" className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Bu turun yanlış cevapları (Oyna ve Antrenman sonuç ekranı, özet kartında numaralı karelerin hemen altında). Her yanlış
 * tek satırdır: solda sıra ve sorulan yer, sağında oyuncunun tıkladığı yer ("Sen: Sivas"). Her zaman açıktır; uzun
 * antrenmanda ilk birkaçı görünür, gerisi "Hepsini göster" ile açılır. Hiç yanlış yoksa hiçbir şey çizilmez
 * (kusursuz tur zaten kutlanır; bkz. RoundCelebration).
 */
/**
 * Komşuluk turunda sorunun konusunu cevabın önüne yazar: olumlu soruda "Kayseri ile komşu: Sivas", olumsuz soruda "Kayseri ile komşu
 * değil: Malatya"; diğer turlarda yalnızca cevabı.
 */
function Asked({ choice, location, ask }: { choice: PlayChoice; location: string; ask?: NeighborAsk | null }) {
  if (!ask) return <AskedLocation choice={choice} location={location} />;
  const review = messages().review;
  const subjectName = locationName(choice.mode, ask.subject);
  return (
    <span className="flex min-w-0 items-baseline gap-1.5">
      <span className={`shrink-0 text-xs font-semibold ${ask.isNegative ? "text-rose-600" : "text-slate-500"}`}>
        {ask.isNegative ? review.notNeighborOf(subjectName) : review.neighborOf(subjectName)}
      </span>
      <AskedLocation choice={choice} location={location} />
    </span>
  );
}

export function WrongAnswers({ choice, answers, subjects = null }: { choice: PlayChoice; answers: AnswerRecord[]; subjects?: NeighborAsk[] | null }) {
  const text = messages().review;
  const { wrong } = numberAnswers(answers);
  const [showAll, setShowAll] = useState(false);
  if (wrong.length === 0) return null;
  const visible = showAll ? wrong : wrong.slice(0, WRONG_PREVIEW);

  return (
    <section>
      <h2 className="text-base font-bold text-rose-700">{text.wrong(wrong.length)}</h2>
      <ol className="mt-2 flex flex-col gap-1.5">
        {visible.map(({ answer, number }) => {
          const picked = locationName(choice.mode, answer.selected);
          const pickedLabel = isPlateChoice(choice) ? `${formatPlate(Number(answer.selected))} ${picked}` : picked;
          return (
            <li className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/70 px-2.5 py-1.5" key={number}>
              <span className="w-4 shrink-0 text-xs font-bold text-rose-400 tabular-nums">{number}</span>
              <span className="min-w-0 flex-1 text-sm">
                <Asked choice={choice} location={answer.location} ask={subjects?.[number - 1]} />
              </span>
              <span className="max-w-[48%] shrink-0 truncate text-xs font-semibold text-rose-700" title={text.you(pickedLabel)}>
                {text.you(pickedLabel)}
              </span>
            </li>
          );
        })}
      </ol>
      {wrong.length > WRONG_PREVIEW && (
        <button
          className="mt-2 text-sm font-semibold text-rose-700 underline underline-offset-4 hover:text-rose-900"
          onClick={() => setShowAll(!showAll)}
          type="button"
        >
          {showAll ? text.showFewerWrong : text.showAllWrong(wrong.length)}
        </button>
      )}
    </section>
  );
}

/**
 * Bu turun doğru cevapları: kapalı başlayan, açılınca kompakt etiketler gösteren bölüm (sonuç ekranının sağ sütunu).
 * Oyuncunun asıl bakacağı yanlışlar özet kartındadır; doğrular merak edenin açtığı ikincil bilgidir.
 */
export function RightAnswers({
  choice,
  answers,
  subjects = null,
  className = "",
  isOpenByDefault = false,
}: {
  choice: PlayChoice;
  answers: AnswerRecord[];
  subjects?: NeighborAsk[] | null;
  className?: string;
  /** Sağ sütunda başka bir şey yoksa (komşuluk turu) doğrular açık başlar. */
  isOpenByDefault?: boolean;
}) {
  const text = messages().review;
  const { right } = numberAnswers(answers);
  const [isOpen, setIsOpen] = useState(isOpenByDefault);
  if (right.length === 0) return null;

  return (
    <section className={className}>
      <button
        aria-expanded={isOpen}
        className="flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        {text.right(right.length)}
        <Chevron isOpen={isOpen} />
      </button>
      {isOpen && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {right.map(({ answer, number }) => (
            <li className="flex items-center gap-1.5 rounded-full bg-emerald-50 py-1 pr-3 pl-2 text-sm ring-1 ring-emerald-100" key={number}>
              <span className="text-[11px] font-bold text-emerald-500 tabular-nums">{number}</span>
              <Asked choice={choice} location={answer.location} ask={subjects?.[number - 1]} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
