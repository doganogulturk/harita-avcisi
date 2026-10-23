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
  remainingGameSeconds: number;
  score: number;
  /** Verilmezse turu yeniden başlatma / tur değiştirme kontrolleri gösterilmez (oda turu tek seferliktir). */
  onPlay?: (choice: PlayChoice) => void;
  /** Tur kontrollerinin yerinde gösterilen etiket, ör. "Cuma akşamı · Tur 2/3". */
  roundLabel?: string;
  onFinishPractice: () => void;
  onExit: () => void;
  /** Çıkış tuşunun açıklaması; turdan çıkmanın sonucu moda göre değişir. */
  exitTitle?: string;
  onSignOut: () => void;
  /**
   * Seri kutlaması ve sonraki soruya geri sayım (GameMap'teki streakCelebration / nextQuestionCountdown). Dikey
   * telefonda haritanın üstünde değil, üst barın ikinci satırının ortasında gösterilir.
   */
  celebration?: string | null;
  countdown?: string | null;
  /** Yanlış cevapta tıklanan yerin adı (GameMap'teki wrongPickNotice); dikey telefonda soru şeridinde, geri sayımın yanında. */
  wrongPick?: string | null;
};

const PLATE_SIZES = {
  md: { plate: "h-9 lg:h-11", strip: "w-5 text-[9px] lg:w-6 lg:text-[10px]", code: "px-3 text-2xl lg:px-4 lg:text-3xl" },
  sm: { plate: "h-7 lg:h-9", strip: "w-4 text-[8px] lg:w-5 lg:text-[9px]", code: "px-2 text-lg lg:px-3 lg:text-2xl" },
};

/** Sorulan plaka, gerçek bir plakanın sol ucundaki mavi TR şeridiyle birlikte gösterilir. */
export function PlateBadge({ plate, size = "md" }: { plate: number; size?: keyof typeof PLATE_SIZES }) {
  const style = PLATE_SIZES[size];
  return (
    <span
      aria-label={`Plaka ${formatPlate(plate)}`}
      className={`flex shrink-0 items-stretch overflow-hidden rounded-md border-2 border-slate-900 bg-white shadow-sm ${style.plate}`}
      role="img"
    >
      <span aria-hidden="true" className={`flex items-end justify-center bg-blue-700 pb-0.5 font-bold text-white ${style.strip}`}>
        TR
      </span>
      <span aria-hidden="true" className={`flex items-center font-mono leading-none font-bold tracking-wider text-slate-900 tabular-nums ${style.code}`}>
        {formatPlate(plate)}
      </span>
    </span>
  );
}

/**
 * Turu bırakıp ana menüye döner. Yanlışlıkla başlatılan bir tur için tek çıkış yolunun
 * süreyi beklemek ya da 10 soruyu oynamak olmaması gerekiyor; onay sorulmaz.
 */
function ExitButton({ onClick, title = "Ana menü · Bu turun skoru kaydedilmez" }: { onClick: () => void; title?: string }) {
  return (
    <button
      aria-label="Turu bırak ve ana menüye dön"
      className="hit-area flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:h-9 lg:w-9"
      onClick={onClick}
      title={title}
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8M17 16l4-4-4-4M21 12H10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Puan her arttığında bir an büyüyüp yeşile döner (globals.css, .score-bump); `key` animasyonu yeniden başlatır. */
function ScoreValue({ score }: { score: number }) {
  return (
    <span className={score > 0 ? "score-bump" : ""} key={score}>
      {score}
    </span>
  );
}

function timeTone(remainingGameSeconds: number, tones: [danger: string, warning: string, calm: string]) {
  if (remainingGameSeconds <= 10) return tones[0];
  if (remainingGameSeconds <= 30) return tones[1];
  return tones[2];
}

/** Sorulan şey: ülke / il adı, bayrak ya da plaka; bayrak ve plakada cevaptan sonra yanında adı. */
function QuestionPrompt({ choice, question, answerState, isNarrow = false }: { choice: PlayChoice; question: Question | undefined; answerState: AnswerState; isNarrow?: boolean }) {
  const answerName = `truncate font-bold text-cyan-700 ${isNarrow ? "text-base" : "text-base lg:text-2xl"}`;
  if (question && isFlagChoice(choice) && "code" in question) {
    return (
      <>
        <h1 className="sr-only">Bu bayrak hangi ülkenin?</h1>
        {/* Yeni soruda eski bayrak bir an bile görünmesin diye her ülke için ayrı öğe. */}
        <Image
          alt="Sorulan ülkenin bayrağı"
          className={`w-auto shrink-0 rounded-sm border border-slate-200 shadow-sm ${isNarrow ? "h-12" : "h-9 lg:h-11"}`}
          height={44}
          key={question.code}
          src={flagUrl(question.code)}
          unoptimized
          width={59}
        />
        {/* Adı cevaptan sonra göster; oyuncu yanlış bildiği bayrağı da öğrensin. */}
        {answerState && <span className={answerName}>{question.name}</span>}
      </>
    );
  }
  if (question && isPlateChoice(choice) && "plate" in question) {
    return (
      <>
        <h1 className="sr-only">Bu plaka hangi ilin?</h1>
        <PlateBadge key={question.plate} plate={question.plate} />
        {/* İlin adı cevaptan sonra gösterilir; oyuncu yanlış bildiği plakayı da öğrensin. */}
        {answerState && <span className={answerName}>{question.city}</span>}
      </>
    );
  }
  return (
    <h1
      className={`text-center leading-tight font-bold tracking-tight text-cyan-700 ${isNarrow ? "line-clamp-2 text-xl" : "line-clamp-1 text-xl lg:text-3xl"}`}
    >
      {question && questionName(question)}
    </h1>
  );
}

const NARROW_BUTTON =
  "hit-area flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none";

/**
 * Oyun sırasındaki üst bar. Yatay ekranda haritaya azami alan bırakmak için tek satırdır. Dikey telefonda yukarıda yer
 * bol olduğu için iki satırdır: üstte solda turdan çık / antrenmanı bitir, tam ortada soru, sağda yeni tur; altta solda
 * doğru sayısı, ortada bildirimler (seri, sonraki soru), sağda kalan süre. İki düzen aynı anda çizilir, ekran
 * genişliğine göre biri gizlenir (gizlenen ekran okuyucuya da görünmez).
 */
export function GameTopBar({
  player,
  choice,
  onPlay,
  question,
  answerState,
  answers,
  questionCount,
  remainingGameSeconds,
  score,
  onFinishPractice,
  onExit,
  exitTitle,
  roundLabel,
  onSignOut,
  celebration = null,
  countdown = null,
  wrongPick = null,
}: GameTopBarProps) {
  const isPractice = choice.kind === "practice";
  const timeClass = timeTone(remainingGameSeconds, ["text-rose-600", "text-amber-600", "text-slate-600"]);

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white">
      {/* Dikey telefon. Üstte solda turdan çık / antrenmanı bitir, ortada doğru sayısı ve kalan süre, sağda yeni tur. Altta
          tam genişlikte soru şeridi: soru (ad, bayrak ya da plaka) ve cevaptan sonraki bildirimler (seri, sonraki soru).
          Düellodaki şeritle aynı düzen; soru yanlardaki tuşlarla yer paylaşmadığı için uzun adlar ve bayrak rahat sığar. */}
      <div className="px-3 pt-2 pb-2 sm:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          <div className="flex justify-start">
            {isPractice ? (
              <button className={NARROW_BUTTON} onClick={onFinishPractice} type="button">
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Bitir
              </button>
            ) : (
              <button aria-label="Turu bırak ve ana menüye dön" className={NARROW_BUTTON} onClick={onExit} title={exitTitle} type="button">
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                  <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8M17 16l4-4-4-4M21 12H10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Çık
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1 text-sm font-bold text-slate-900 tabular-nums" title="Doğru">
              <svg aria-hidden="true" className="h-3.5 w-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>
                <ScoreValue score={score} />
                <span className="text-slate-400">/{isPractice ? answers.length : questionCount}</span>
              </span>
            </p>
            {!isPractice && (
              <p className={`flex items-center gap-1 text-sm font-bold tabular-nums ${timeClass}`}>
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2M9 2h6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {formatTime(remainingGameSeconds)}
              </p>
            )}
          </div>

          <div className="flex min-w-0 justify-end">
            {onPlay ? (
              isPractice ? (
                <button aria-label="Antrenmanı yeniden başlat" className={`${NARROW_BUTTON} px-2.5`} onClick={() => onPlay(choice)} title="Yeniden başlat" type="button">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4.5h4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <RoundControls choice={choice} isCompact onPlay={onPlay} />
              )
            ) : (
              roundLabel && <span className="truncate rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800">{roundLabel}</span>
            )}
          </div>
        </div>

        <div className="mt-2 flex min-h-14 flex-col items-center justify-center rounded-2xl bg-slate-50 px-3 py-1.5">
          <div className="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            <QuestionPrompt answerState={answerState} choice={choice} isNarrow question={question} />
          </div>
          <div aria-live="polite" className="mt-1 flex flex-wrap items-center justify-center gap-1.5 empty:mt-0">
            {wrongPick && <span className="max-w-full truncate rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-rose-600">{wrongPick}</span>}
            {celebration && (
              <span className="streak-pop rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-amber-950" key={celebration}>
                {celebration}
              </span>
            )}
            {countdown && <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-cyan-800 tabular-nums">{countdown}</span>}
          </div>
        </div>
      </div>

      {/* Yatay ekran ve masaüstü: tek satır, üç sütun; soru adı yanlardaki içerik ne kadar geniş olursa olsun ortada
          kalır. Telefonda oyuncunun resmi ve adı gösterilmez. */}
      <div className="hidden grid-cols-[1fr_auto_1fr] items-center gap-3 px-3 py-2 sm:grid lg:gap-6 lg:px-5 lg:py-3">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <ExitButton onClick={onExit} title={exitTitle} />
          <div className="hidden lg:block">
            <PlayerBadge align="left" onSignOut={onSignOut} player={player} size="sm" />
          </div>
        </div>

        <div className="flex min-w-0 items-center justify-center gap-2 lg:gap-3">
          <QuestionPrompt answerState={answerState} choice={choice} question={question} />
        </div>

        {isPractice ? (
          <div className="flex items-center justify-end gap-3 lg:gap-5">
            <span className="hidden shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase lg:inline lg:text-xs">
              {choiceLabel(choice)}
            </span>
            <p className="shrink-0 text-sm font-bold text-slate-900 tabular-nums lg:text-xl" title="Doğru / cevaplanan">
              <ScoreValue score={score} />
              <span className="text-slate-400">/{answers.length}</span>
            </p>
            <button
              className="hit-area shrink-0 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:text-sm"
              onClick={onFinishPractice}
              type="button"
            >
              Bitir
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 lg:gap-5">
            {/* Yalnızca geniş ekranda: yatay telefonda uzun soru adlarıyla çakışır, puan zaten "2/10" diye yazıyor. */}
            <div aria-label="Soru ilerlemesi" className="hidden shrink-0 items-center gap-1 lg:flex">
              {Array.from({ length: questionCount }, (_, index) => (
                <span
                  className={`h-2 w-3 rounded-full lg:w-4 ${answers[index] === "correct" ? "bg-emerald-500" : answers[index] === "incorrect" ? "bg-rose-500" : "bg-slate-200"}`}
                  key={index}
                />
              ))}
            </div>

            <p className="shrink-0 text-sm font-bold text-slate-900 tabular-nums lg:text-xl">
              <ScoreValue score={score} />
              <span className="text-slate-400">/{questionCount}</span>
            </p>

            <p className={`shrink-0 text-sm font-bold tabular-nums lg:text-xl ${timeClass}`}>{formatTime(remainingGameSeconds)}</p>

            {onPlay ? (
              <RoundControls choice={choice} onPlay={onPlay} />
            ) : (
              roundLabel && (
                <span className="hidden shrink-0 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 md:inline lg:text-sm">{roundLabel}</span>
              )
            )}
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
