import Image from "next/image";
import { useEffect } from "react";
import { playSound } from "@/lib/sound";
import { PlayerBadge } from "./PlayerBadge";
import { RoundControls } from "./RoundControls";
import {
  choiceLabel,
  flagUrl,
  formatPlate,
  formatTime,
  GAME_DURATION_SECONDS,
  isCapitalChoice,
  isFlagChoice,
  isPlateChoice,
  locationName,
  questionName,
  type AnswerState,
  type PlayChoice,
  type Player,
  type Question,
} from "@/lib/game";
import { messages } from "@/lib/i18n";
import { type NeighborAsk } from "@/lib/neighbors";
import { capitalOf } from "@/lib/world-capitals";

type GameTopBarProps = {
  player: Player | null;
  choice: PlayChoice;
  question: Question | undefined;
  /** Komşuluk sorusunun konusu ve biçimi ("X ile komşu olan / olmayan hangisi?"); yalnızca choice.neighbors iken. */
  neighborAsk?: NeighborAsk | null;
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
      aria-label={messages().game.plate(formatPlate(plate))}
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
function ExitButton({ onClick, title = messages().game.exitTitle }: { onClick: () => void; title?: string }) {
  return (
    <button
      aria-label={messages().game.exitAria}
      className="hit-area flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/80 transition hover:border-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:h-9 lg:w-9"
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

/** Şıklı soruda üst çubuğun sorusu: yerin adı verilmez (haritada işaretlidir), ne sorulduğu söylenir. */
function markedPromptText(choice: PlayChoice): string {
  const prompts = messages().game.markedPrompt;
  if (isFlagChoice(choice)) return prompts.flag;
  if (isCapitalChoice(choice)) return prompts.capital;
  if (isPlateChoice(choice)) return prompts.plate;
  return choice.mode === "turkey" ? prompts.turkey : prompts.world;
}

/**
 * Olumsuz komşuluk sorusu, kalıptan: "{subject}" konunun yerine, *…* arası vurgulu ("{subject} ile komşu *olmayan* hangisi?").
 * Kalıp dile göre sözcük sırasını belirler (İngilizcede konu sondadır).
 */
function NegativeQuestion({ template, subject }: { template: string; subject: React.ReactNode }) {
  return (
    <>
      {template.split(/(\{subject\}|\*[^*]+\*)/).map((part, index) => {
        if (part === "{subject}") return <span key={index}>{subject}</span>;
        if (part.startsWith("*") && part.endsWith("*")) {
          return (
            <span className="text-rose-600 underline decoration-rose-400 decoration-[3px] underline-offset-4" key={index}>
              {part.slice(1, -1)}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}

/** Komşuluk sorusunun metni, şıkların gösterimine göre: il/ülke adı, plaka, bayrak ya da başkent. */
function neighborQuestionKind(choice: PlayChoice): "turkey" | "plate" | "world" | "flag" | "capital" {
  if (isPlateChoice(choice)) return "plate";
  if (isFlagChoice(choice)) return "flag";
  if (isCapitalChoice(choice)) return "capital";
  return choice.mode;
}

/** Sorulan şey: ülke / il adı, bayrak, başkent ya da plaka; bayrak, başkent ve plakada cevaptan sonra yanında adı. */
function QuestionPrompt({
  choice,
  question,
  answerState,
  neighborAsk = null,
  isNarrow = false,
}: {
  choice: PlayChoice;
  question: Question | undefined;
  answerState: AnswerState;
  neighborAsk?: NeighborAsk | null;
  isNarrow?: boolean;
}) {
  const answerName = `truncate font-bold text-cyan-700 ${isNarrow ? "text-base" : "text-base lg:text-2xl"}`;
  // Komşuluk sorusu: konu sorunun kendisidir ("Kayseri ile komşu olan hangisi?"); cevap şıklarda aranır, haritada konu işaretlidir.
  // Konu modun kendi gösterimiyle yazılır: plaka turunda plaka, bayrak turunda bayrak, diğerlerinde adı. Olumsuz soruda "olmayan"
  // kırmızı ve altı çizili yazılır: süreli turda en sık hata olumsuzluğu okumamaktır.
  if (question && choice.neighbors && neighborAsk) {
    const subjectId = neighborAsk.subject;
    const subjectName = locationName(choice.mode, subjectId);
    const subject = isPlateChoice(choice) ? (
      <span className="mx-0.5 inline-flex align-middle">
        <PlateBadge plate={Number(subjectId)} size="sm" />
      </span>
    ) : isFlagChoice(choice) ? (
      <Image
        alt={subjectName}
        className={`mx-0.5 inline w-auto rounded-sm border border-slate-200 align-middle shadow-sm ${isNarrow ? "h-7" : "h-6 lg:h-8"}`}
        height={32}
        key={subjectId}
        src={flagUrl(subjectId)}
        unoptimized
        width={43}
      />
    ) : (
      subjectName
    );
    return (
      <>
        <h1
          className={`text-center font-display leading-tight font-bold tracking-tight text-cyan-700 ${isNarrow ? "line-clamp-2 text-2xl" : "line-clamp-1 text-xl lg:text-3xl"}`}
        >
          {neighborAsk.isNegative ? (
            <NegativeQuestion subject={subject} template={messages().game.neighborQuestionNot[neighborQuestionKind(choice)]} />
          ) : (
            <>
              {messages().game.neighborQuestion[neighborQuestionKind(choice)].before}
              {subject}
              {messages().game.neighborQuestion[neighborQuestionKind(choice)].after}
            </>
          )}
        </h1>
        {answerState && <span className={`shrink-0 ${answerName} text-slate-500`}>· {questionName(question)}</span>}
      </>
    );
  }
  if (question && choice.choices) {
    return (
      <>
        <h1
          className={`text-center font-display leading-tight font-bold tracking-tight text-cyan-700 ${isNarrow ? "line-clamp-2 text-2xl" : "line-clamp-1 text-xl lg:text-3xl"}`}
        >
          {markedPromptText(choice)}
        </h1>
        {/* Yerin adı cevaptan sonra gösterilir; oyuncu yanlış bildiği yeri de öğrensin. */}
        {answerState && <span className={`shrink-0 ${answerName} text-slate-500`}>· {questionName(question)}</span>}
      </>
    );
  }
  if (question && isFlagChoice(choice) && "code" in question) {
    return (
      <>
        <h1 className="sr-only">{messages().game.flagQuestion}</h1>
        {/* Yeni soruda eski bayrak bir an bile görünmesin diye her ülke için ayrı öğe. */}
        <Image
          alt={messages().game.flagAlt}
          className={`w-auto shrink-0 rounded-sm border border-slate-200 shadow-sm ${isNarrow ? "h-12" : "h-9 lg:h-11"}`}
          height={44}
          key={question.code}
          src={flagUrl(question.code)}
          unoptimized
          width={59}
        />
        {/* Adı cevaptan sonra göster; oyuncu yanlış bildiği bayrağı da öğrensin. */}
        {answerState && <span className={answerName}>{questionName(question)}</span>}
      </>
    );
  }
  const capital = question && isCapitalChoice(choice) && "code" in question ? capitalOf(question.code) : undefined;
  if (question && capital) {
    return (
      <>
        <span aria-hidden="true" className={`shrink-0 ${isNarrow ? "text-xl" : "text-xl lg:text-2xl"}`}>
          🏛️
        </span>
        <h1 className={`min-w-0 truncate leading-tight font-bold tracking-tight text-cyan-700 ${isNarrow ? "text-xl" : "text-xl lg:text-3xl"}`}>
          <span className="sr-only">{messages().game.capitalBefore}</span>
          {capital}
          <span className="sr-only">{messages().game.capitalAfter}</span>
        </h1>
        {/* Ülkenin adı cevaptan sonra gösterilir; oyuncu yanlış bildiği başkenti de öğrensin. */}
        {answerState && <span className={`shrink-0 ${answerName} text-slate-500`}>· {questionName(question)}</span>}
      </>
    );
  }
  if (question && isPlateChoice(choice) && "plate" in question) {
    return (
      <>
        <h1 className="sr-only">{messages().game.plateQuestion}</h1>
        <PlateBadge key={question.plate} plate={question.plate} />
        {/* İlin adı cevaptan sonra gösterilir; oyuncu yanlış bildiği plakayı da öğrensin. */}
        {answerState && <span className={answerName}>{question.city}</span>}
      </>
    );
  }
  return (
    <h1
      className={`text-center font-display leading-tight font-bold tracking-tight text-cyan-700 ${isNarrow ? "line-clamp-2 text-2xl" : "line-clamp-1 text-xl lg:text-3xl"}`}
    >
      {question && questionName(question)}
    </h1>
  );
}

const NARROW_BUTTON =
  "hit-area flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/25 px-3 text-xs font-bold text-white/85 transition hover:border-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none";

/** Arka arkaya doğru cevap sayısı (sondan); seri rozeti bunu gösterir. */
function currentStreak(answers: AnswerState[]) {
  let streak = 0;
  for (let index = answers.length - 1; index >= 0 && answers[index] === "correct"; index -= 1) streak += 1;
  return streak;
}

/** Üst bardaki seri rozeti: iki doğrudan itibaren görünür, seri uzadıkça kızışır. */
function StreakChip({ streak }: { streak: number }) {
  if (streak < 2) return null;
  const tone = streak >= 5 ? "bg-rose-500 text-white" : streak >= 3 ? "bg-orange-500 text-white" : "bg-amber-400 text-amber-950";
  return (
    <span
      className={`score-bump flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums lg:px-2.5 lg:text-sm ${tone}`}
      key={streak}
      title={messages().game.streak(streak)}
    >
      <span aria-hidden="true">🔥</span>
      {streak}x
    </span>
  );
}

/** Akış satırlarının solundaki yazı; iki satırın çubukları aynı hizadan başlasın diye eşit genişlikte. */
const METER_LABEL = "flex w-[4.5rem] shrink-0 items-center gap-1 text-sm font-bold whitespace-nowrap tabular-nums lg:w-24 lg:text-lg";

/**
 * Turun iki akışı alt alta: soru akışı ve süre akışı. Soru akışında turun soruları kadar bölüm vardır; cevaplananlar
 * yeşil ya da kırmızı, beklenen soru beyaz ve hafifçe parlar, gelecekler soluk. Solunda o ana kadarki doğru ve sorulan
 * soru sayısı ("1/2"; tur 0/0 ile başlar). Süre akışında kalan süre yazısı ve eriyen çubuk; son 10 saniyede kırmızıya
 * döner ve yanıp söner. Turun nerede olduğunu bir bakışta söyler; üst barda ayrıca puan ve süre yazmaz.
 */
function RoundMeters({
  answers,
  answerState,
  questionCount,
  score,
  remainingGameSeconds,
}: {
  answers: AnswerState[];
  answerState: AnswerState;
  questionCount: number;
  score: number;
  remainingGameSeconds: number;
}) {
  const { game } = messages();
  return (
    <div className="flex flex-col gap-1.5 lg:gap-2">
      <div className="flex min-w-0 items-center gap-2 lg:gap-3">
        <span className={`${METER_LABEL} text-white`} title={game.correctOfAnswered}>
          <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-emerald-400 lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <ScoreValue score={score} />
            <span className="text-white/45">/{answers.length}</span>
          </span>
        </span>
        <div
          aria-label={game.progress}
          aria-valuemax={questionCount}
          aria-valuemin={0}
          aria-valuenow={answers.length}
          className="flex min-w-0 flex-1 items-center gap-1"
          role="progressbar"
        >
          {Array.from({ length: questionCount }, (_, index) => {
            const answer = answers[index];
            // Cevap gösterilirken sıradaki soru henüz gelmedi; beyaz bölüm yalnızca soru beklerken yanar.
            const isCurrent = !answer && !answerState && index === answers.length;
            return (
              <span
                className={`h-2 min-w-1.5 flex-1 rounded-full transition-colors lg:h-2.5 ${
                  answer === "correct" ? "bg-emerald-400" : answer === "incorrect" ? "bg-rose-400" : isCurrent ? "time-pulse bg-white" : "bg-white/20"
                }`}
                key={index}
              />
            );
          })}
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 lg:gap-3">
        <span className={`${METER_LABEL} ${timeTone(remainingGameSeconds, ["text-rose-300", "text-amber-300", "text-white"])}`} title={game.timeLeft}>
          <svg aria-hidden="true" className="h-3.5 w-3.5 shrink-0 lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2.5 2M9 2h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {formatTime(remainingGameSeconds)}
        </span>
        <div
          aria-label={game.timeLeft}
          aria-valuemax={GAME_DURATION_SECONDS}
          aria-valuemin={0}
          aria-valuenow={remainingGameSeconds}
          className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15 lg:h-2.5"
          role="progressbar"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-300 ease-linear ${timeTone(remainingGameSeconds, ["time-pulse bg-rose-500", "bg-amber-400", "bg-emerald-400"])}`}
            style={{ width: `${(remainingGameSeconds / GAME_DURATION_SECONDS) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** Oyun sırasında üst bar: koyu deniz zemini; soru beyaz, basılabilir bir kartta durur. */
const HUD_CLASS = "shrink-0 bg-[#0b3a5b] text-white";
/** Sorunun durduğu beyaz kart; altındaki kalın kenarla oyun kartı gibi durur. */
const QUESTION_CARD = "rounded-2xl border-b-4 border-slate-300 bg-white text-slate-900";

/**
 * Oyun sırasındaki üst bar. Dikey telefonda üstte solda turdan çık / antrenmanı bitir, ortada seri rozeti, sağda yeni
 * tur; altında (yarışta) soru ve süre akışı, en altta soru kartı. Yatay ekranda üstte tek satır (çıkış, soru, seri ve
 * yeni tur), altında tam genişlikte soru ve süre akışı. İki düzen aynı anda çizilir, ekran genişliğine göre biri gizlenir
 * (gizlenen ekran okuyucuya da görünmez).
 */
export function GameTopBar({
  neighborAsk = null,
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
}: GameTopBarProps) {
  const isPractice = choice.kind === "practice";
  // Olumsuz komşuluk sorusunda soru kartının alt kenarı kırmızıdır; soru tipinin değiştiği ilk bakışta görünsün.
  const questionCard = neighborAsk?.isNegative ? QUESTION_CARD.replace("border-slate-300", "border-rose-400") : QUESTION_CARD;
  const streak = currentStreak(answers);

  // Son on saniyede her saniye kısa bir tık; süre baskısı hissedilsin.
  useEffect(() => {
    if (!isPractice && remainingGameSeconds > 0 && remainingGameSeconds <= 10) playSound("tick");
  }, [isPractice, remainingGameSeconds]);

  return (
    <header className={HUD_CLASS}>
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
                {messages().game.finish}
              </button>
            ) : (
              <button aria-label={messages().game.exitAria} className={NARROW_BUTTON} onClick={onExit} title={exitTitle} type="button">
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24">
                  <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8M17 16l4-4-4-4M21 12H10" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {messages().game.quit}
              </button>
            )}
          </div>

          {/* Ortada seri rozeti; antrenmanda doğru / cevaplanan da burada (yarışta puan ve süre akış satırlarındadır). */}
          <div className="flex items-center gap-3">
            {isPractice && (
              <p className="flex items-center gap-1 text-sm font-bold text-white tabular-nums" title={messages().game.correctOfAnswered}>
                <svg aria-hidden="true" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>
                  <ScoreValue score={score} />
                  <span className="text-white/45">/{answers.length}</span>
                </span>
              </p>
            )}
            <StreakChip streak={streak} />
          </div>

          <div className="flex min-w-0 justify-end">
            {onPlay ? (
              isPractice ? (
                <button aria-label={messages().game.restartPractice} className={`${NARROW_BUTTON} px-2.5`} onClick={() => onPlay(choice)} title={messages().game.restart} type="button">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4.5h4.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ) : (
                <RoundControls choice={choice} isCompact onPlay={onPlay} />
              )
            ) : (
              roundLabel && <span className="truncate rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-cyan-100">{roundLabel}</span>
            )}
          </div>
        </div>

        {!isPractice && (
          <div className="mt-2">
            <RoundMeters answerState={answerState} answers={answers} questionCount={questionCount} remainingGameSeconds={remainingGameSeconds} score={score} />
          </div>
        )}

        <div className={`mt-2 flex min-h-14 flex-col items-center justify-center px-3 py-1.5 ${questionCard}`}>
          <div className="flex max-w-full min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            <QuestionPrompt answerState={answerState} choice={choice} isNarrow question={question} neighborAsk={neighborAsk} />
          </div>
          <div aria-live="polite" className="mt-1 flex flex-wrap items-center justify-center gap-1.5 empty:mt-0">
            {celebration && (
              <span className="streak-pop rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-amber-950" key={celebration}>
                {celebration}
              </span>
            )}
            {countdown && <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-bold whitespace-nowrap text-cyan-800 tabular-nums">{countdown}</span>}
          </div>
        </div>
      </div>

      {/* Yatay ekran ve masaüstü: tek satır, üç sütun; soru adı yanlardaki içerik ne kadar geniş olursa olsun ortada
          kalır. Telefonda oyuncunun resmi ve adı gösterilmez. */}
      <div className="hidden grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-3 py-2 sm:grid lg:gap-6 lg:px-5 lg:py-3">
        <div className="flex min-w-0 items-center gap-2 lg:gap-3">
          <ExitButton onClick={onExit} title={exitTitle} />
          <div className="hidden lg:block">
            <PlayerBadge align="left" onSignOut={onSignOut} player={player} size="sm" />
          </div>
        </div>

        <div className={`flex min-w-0 items-center justify-center gap-2 px-4 py-1 lg:gap-3 lg:px-6 lg:py-1.5 ${questionCard}`}>
          <QuestionPrompt answerState={answerState} choice={choice} question={question} neighborAsk={neighborAsk} />
        </div>

        {isPractice ? (
          <div className="flex min-w-0 items-center justify-end gap-3 lg:gap-5">
            {/* Tur etiketi ikincil bilgidir: yer dar kalırsa seri, skor ve Bitir yerinde kalır, etiket kısalır (uzun bir soru olunca). */}
            <span
              className="hidden min-w-0 truncate rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase lg:block lg:text-xs"
              title={choiceLabel(choice)}
            >
              {choiceLabel(choice)}
            </span>
            <StreakChip streak={streak} />
            <p className="shrink-0 text-sm font-bold text-white tabular-nums lg:text-xl" title={messages().game.correctOfAnswered}>
              <ScoreValue score={score} />
              <span className="text-white/45">/{answers.length}</span>
            </p>
            <button
              className="hit-area shrink-0 rounded-full border border-white/25 px-3 py-1 text-xs font-bold text-white/85 transition hover:border-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:text-sm"
              onClick={onFinishPractice}
              type="button"
            >
              {messages().game.finish}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-3 lg:gap-5">
            <StreakChip streak={streak} />

            {onPlay ? (
              <RoundControls choice={choice} onPlay={onPlay} />
            ) : (
              roundLabel && (
                <span className="hidden shrink-0 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100 md:inline lg:text-sm">{roundLabel}</span>
              )
            )}
          </div>
        )}
      </div>

      {/* Geniş ekranda soru ve süre akışı üst barın altında tam genişlikte; dikey telefonda soru kartının üstündedir. */}
      {!isPractice && (
        <div className="hidden px-3 pb-2.5 sm:block lg:px-5 lg:pb-3">
          <RoundMeters answerState={answerState} answers={answers} questionCount={questionCount} remainingGameSeconds={remainingGameSeconds} score={score} />
        </div>
      )}
    </header>
  );
}
