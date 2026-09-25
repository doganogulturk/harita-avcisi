import Image from "next/image";
import { PlayerBadge } from "./PlayerBadge";
import { RoundControls } from "./RoundControls";
import {
  choiceLabel,
  flagUrl,
  formatPlate,
  formatTime,
  GAME_DURATION_SECONDS,
  isFlagChoice,
  isPlateChoice,
  questionName,
  type AnswerState,
  type PlayChoice,
  type Player,
  type Question,
} from "@/lib/game";

type GameTopBarProps = {
  player: Player | null;
  choice: PlayChoice;
  question: Question | undefined;
  answerState: AnswerState;
  answers: AnswerState[];
  questionCount: number;
  remainingQuestionSeconds: number;
  remainingGameSeconds: number;
  score: number;
  onPlay: (choice: PlayChoice) => void;
  onFinishPractice: () => void;
  onExit: () => void;
  onSignOut: () => void;
};

/**
 * Turu bırakıp ana menüye döner. Yanlışlıkla başlatılan bir tur için tek çıkış yolunun
 * süreyi beklemek ya da 10 soruyu oynamak olmaması gerekiyor; onay sorulmaz.
 */
/** Sorulan plaka, gerçek bir plakanın sol ucundaki mavi TR şeridiyle birlikte gösterilir. */
function PlateBadge({ plate }: { plate: number }) {
  return (
    <span
      aria-label={`Plaka ${formatPlate(plate)}`}
      className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-md border-2 border-slate-900 bg-white shadow-sm lg:h-11"
      role="img"
    >
      <span aria-hidden="true" className="flex w-5 items-end justify-center bg-blue-700 pb-0.5 text-[9px] font-bold text-white lg:w-6 lg:text-[10px]">
        TR
      </span>
      <span aria-hidden="true" className="flex items-center px-3 font-mono text-2xl leading-none font-bold tracking-wider text-slate-900 tabular-nums lg:px-4 lg:text-3xl">
        {formatPlate(plate)}
      </span>
    </span>
  );
}

function ExitButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      aria-label="Turu bırak ve ana menüye dön"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:h-9 lg:w-9"
      onClick={onClick}
      title="Ana menü · Bu turun skoru kaydedilmez"
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8M17 16l4-4-4-4M21 12H10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function timeTone(remainingGameSeconds: number, tones: [danger: string, warning: string, calm: string]) {
  if (remainingGameSeconds <= 10) return tones[0];
  if (remainingGameSeconds <= 30) return tones[1];
  return tones[2];
}

/** Oyun sırasında haritaya azami alan bırakmak için tüm durum bilgisini tek satırda toplar. */
export function GameTopBar({
  player,
  choice,
  onPlay,
  question,
  answerState,
  answers,
  questionCount,
  remainingQuestionSeconds,
  remainingGameSeconds,
  score,
  onFinishPractice,
  onExit,
  onSignOut,
}: GameTopBarProps) {
  const isPractice = choice.kind === "practice";

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      {/* Üç sütun: soru adı, yanlardaki içerik ne kadar geniş olursa olsun tam ortada kalır. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 lg:gap-6 lg:px-5 lg:py-3">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <ExitButton onClick={onExit} />
          <PlayerBadge align="left" onSignOut={onSignOut} player={player} size="sm" />
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2 lg:gap-3">
          {question && isFlagChoice(choice) && "code" in question ? (
            <>
              <h1 className="sr-only">Bu bayrak hangi ülkenin?</h1>
              {/* Yeni soruda eski bayrak bir an bile görünmesin diye her ülke için ayrı öğe. */}
              <Image
                alt="Sorulan ülkenin bayrağı"
                className="h-9 w-auto shrink-0 rounded-sm border border-slate-200 shadow-sm lg:h-11"
                height={44}
                key={question.code}
                src={flagUrl(question.code)}
                unoptimized
                width={59}
              />
              {/* Adı cevaptan sonra göster; oyuncu yanlış bildiği bayrağı da öğrensin. */}
              {answerState && <span className="truncate text-base font-bold text-cyan-700 lg:text-2xl">{question.name}</span>}
            </>
          ) : question && isPlateChoice(choice) && "plate" in question ? (
            <>
              <h1 className="sr-only">Bu plaka hangi ilin?</h1>
              <PlateBadge key={question.plate} plate={question.plate} />
              {/* İlin adı cevaptan sonra gösterilir; oyuncu yanlış bildiği plakayı da öğrensin. */}
              {answerState && <span className="truncate text-base font-bold text-cyan-700 lg:text-2xl">{question.city}</span>}
            </>
          ) : (
            <h1 className="truncate text-center text-xl leading-tight font-bold tracking-tight text-cyan-700 lg:text-3xl">
              {question && questionName(question)}
            </h1>
          )}
          {answerState && (
            <span className="shrink-0 rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-cyan-800 lg:text-xs">
              Sonraki: {remainingQuestionSeconds} sn
            </span>
          )}
        </div>

        {isPractice ? (
          <div className="flex items-center justify-end gap-3 lg:gap-5">
            <span className="hidden shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase md:inline lg:text-xs">
              {choiceLabel(choice)}
            </span>
            <p className="shrink-0 text-sm font-bold text-slate-900 tabular-nums lg:text-xl" title="Doğru / cevaplanan">
              {score}
              <span className="text-slate-400">/{answers.length}</span>
            </p>
            <button
              className="shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:text-sm"
              onClick={onFinishPractice}
              type="button"
            >
              Bitir
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 lg:gap-5">
            <div aria-label="Soru ilerlemesi" className="hidden shrink-0 items-center gap-1 md:flex">
              {Array.from({ length: questionCount }, (_, index) => (
                <span
                  className={`h-2 w-3 rounded-full lg:w-4 ${answers[index] === "correct" ? "bg-emerald-500" : answers[index] === "incorrect" ? "bg-rose-500" : "bg-slate-200"}`}
                  key={index}
                />
              ))}
            </div>

            <p className="shrink-0 text-sm font-bold text-slate-900 tabular-nums lg:text-xl">
              {score}
              <span className="text-slate-400">/{questionCount}</span>
            </p>

            <p className={`shrink-0 text-sm font-bold tabular-nums lg:text-xl ${timeTone(remainingGameSeconds, ["text-rose-600", "text-amber-600", "text-slate-600"])}`}>
              {formatTime(remainingGameSeconds)}
            </p>

            <RoundControls choice={choice} onPlay={onPlay} />
          </div>
        )}
      </div>

      {!isPractice && (
        <div
          aria-label="Kalan süre"
          aria-valuemax={GAME_DURATION_SECONDS}
          aria-valuemin={0}
          aria-valuenow={remainingGameSeconds}
          className="h-1 w-full bg-slate-100"
          role="progressbar"
        >
          <div
            className={`h-full transition-[width] duration-300 ease-linear ${timeTone(remainingGameSeconds, ["bg-rose-500", "bg-amber-500", "bg-cyan-500"])}`}
            style={{ width: `${(remainingGameSeconds / GAME_DURATION_SECONDS) * 100}%` }}
          />
        </div>
      )}
    </header>
  );
}
