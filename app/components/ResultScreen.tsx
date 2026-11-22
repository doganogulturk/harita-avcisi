import { useState } from "react";
import { Leaderboard } from "./Leaderboard";
import { MostMissed } from "./MostMissed";
import { NewBadges } from "./NewBadges";
import { RoundReview, RoundSquares } from "./RoundReview";
import { RightAnswers, WrongAnswers } from "./SessionReview";
import { RoundCelebration } from "./RoundCelebration";
import { SignInDialog } from "./SignInDialog";
import { WeakSpots } from "./WeakSpots";
import { boardOf, dailyShareText, useDailyLeaderboards, useDailyStatus } from "@/lib/daily";
import { PRIMARY_BUTTON_CLASS } from "./PlayButton";
import { ShareScoreButton } from "./ShareScoreButton";
import {
  boardIdFor,
  BOARDS,
  choiceLabel,
  emptyLeaderboards,
  formatTime,
  type AnswerRecord,
  type BoardId,
  type LocationStat,
  type WeakSpot,
  type PlayChoice,
  type Player,
} from "@/lib/game";
import { type SaveResult } from "@/lib/hooks/useRoundSave";
import { messages } from "@/lib/i18n";
import { getSupabaseClient } from "@/lib/supabase";

type ResultScreenProps = {
  player: Player | null;
  choice: PlayChoice;
  score: number;
  questionCount: number;
  /** Antrenmanda tur uzunluğu sabit değildir; oyuncunun cevapladığı soru sayısı. */
  answeredCount: number;
  bestStreak: number;
  durationMs: number;
  /** Oyna turunun kaydı (giriş yapmış oyuncuda): null sürüyor ya da kayıt yok; "failed" yeniden denenebilir; "no-round" tur sunucuda açılamamıştı. */
  saveResult: SaveResult | null;
  onRetrySave: () => void;
  /** Oyuncuların bu modda en çok yanlış yaptığı yerler; `undefined` yükleniyor, `null` yüklenemedi. */
  mostMissed: LocationStat[] | null | undefined;
  /** Oyuncunun kendi zayıf yerleri (giriş yapmışsa); `undefined` yükleniyor, `null` giriş yok ya da yüklenemedi. */
  weakSpots: WeakSpot[] | null | undefined;
  /** Oyuncunun bu turda yanlış cevapladığı yerler. */
  missedLocationIds: string[];
  /** Turun cevapları sırayla; soru soru döküm (RoundReview) bunlardan çizilir. */
  answerRecords: AnswerRecord[];
  /** Komşuluk turunda her sorunun konusu ("X ile komşu olan hangisi?"); başka turlarda null. */
  subjects: string[] | null;
  onPlay: (choice: PlayChoice) => void;
  /** Oynanan oyunun (Oyna ya da Antrenman) ayar ekranını açar; başka bir tur orada seçilir. */
  onChooseAnother: () => void;
  onHome: () => void;
};

/** Giriş ekranındaki kartlarla aynı çerçeve. */
const RESULT_CARD = "rounded-3xl border-2 border-slate-200 bg-white p-5 short:p-4 lg:p-7";
/** Geri planda duran kart (en çok yanlış yapılanlar): oturumun dökümünden daha sade ve soluk. */
const RESULT_CARD_QUIET = "rounded-3xl border border-slate-200 bg-slate-50/70 p-4 short:p-3 lg:p-6";
/**
 * Sol özet kartı: iki sütunlu düzende ekranın yüksekliğini doldurur, tuşlar altına yaslanır.
 * Alçak ekranda (yatay telefon) aralıklar daralır; içerik yine sığmazsa kart kendi içinde kayar.
 */
const SUMMARY_CARD = `${RESULT_CARD} flex flex-col gap-5 short:gap-3 md:min-h-0 md:overflow-y-auto`;
/** Skor ve istatistik kutuları: alt alta; alçak ekranda yan yana. */
const SCORE_ROW = "flex items-center gap-4";
/** Skorun kendisi; sağındaki istatistiklere yer kalsın diye dar sütunda bir boy küçük. */
const SCORE_NUMBER = "text-6xl short:text-5xl lg:text-7xl";
const RESULT_EYEBROW = "text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase";

/**
 * Sonuç ekranı giriş ekranı gibi ekranın tamamını kullanır. Solda boydan boya turun özeti ve yeni tur
 * tuşları, sağda alt alta önce bu turun soru soru dökümü (yanlışlar önde; günlük sonuçta günün sıralaması), sonra
 * geri planda en çok yanlış yapılanlar; iki sütun da kendi içinde kayar.
 * Yatay telefonda da iki sütundur. Dikey telefonda her şey tek sütunda alt alta gelir ve sayfa kayar.
 */
function ResultShell({
  aside,
  children,
}: {
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full w-full flex-col gap-3 overflow-y-auto px-4 py-3 short:gap-2 short:py-2 md:overflow-hidden lg:gap-5 lg:px-8 lg:py-5">
      {/* Dikey telefonda tek sütun içerikle genişlemez (minmax(0,1fr)); uzun yer adı sayfayı ekrandan taşırmaz. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:min-h-0 md:flex-1 md:grid-cols-[20rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        {aside}
        <div className="flex min-w-0 flex-col gap-3 md:min-h-0 md:overflow-y-auto lg:gap-5">{children}</div>
      </div>
    </section>
  );
}

/** Skorun sağında alt alta duran küçük satır: solda ne olduğu, sağda değeri. */
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 rounded-xl bg-slate-50 px-3 py-1.5 lg:py-2">
      <dt className="truncate text-xs text-slate-500">{label}</dt>
      <dd className="text-lg font-bold tabular-nums text-slate-900 lg:text-xl">{value}</dd>
    </div>
  );
}

/** Özet kartının başlığı: turun adı ve büyük "bitti" başlığı. */
function SummaryHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className={RESULT_EYEBROW}>{eyebrow}</p>
      <h1 className="mt-1 font-display text-3xl leading-none font-bold text-slate-900 short:text-2xl lg:text-4xl">{title}</h1>
    </div>
  );
}

/** Paylaş tuşunun yanında yarım genişlikte duran asıl tuş: yazısı ve iç boşluğu daha küçük. */
const COMPACT_PRIMARY_CLASS =
  "press flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 px-3 py-3 text-base font-bold whitespace-nowrap text-white [--press-edge:#047857] focus-visible:ring-4 focus-visible:ring-emerald-200 focus-visible:outline-none short:py-2.5";

function PrimaryButton({ label, onClick, isCompact = false }: { label: string; onClick: () => void; isCompact?: boolean }) {
  return (
    <button className={isCompact ? COMPACT_PRIMARY_CLASS : PRIMARY_BUTTON_CLASS} onClick={onClick} type="button">
      {label}
      <svg aria-hidden="true" className="h-5 w-5 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Komşuluk turunun neden kaydedilmediğini söyler (Oyna'da bile): giriş yapmış oyuncu "kaydedilmedi" hatası sanmasın. */
function NeighborsNotSaved() {
  const text = messages().result;
  return (
    <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <span className="font-semibold text-slate-700">{text.neighborsNotSaved}.</span> {text.neighborsNotSavedNote}
    </p>
  );
}

/** Skor kaydedilemediyse özetin altında: neden ve (yapılabiliyorsa) yeniden deneme. Kaydedildiyse ya da sürüyorsa yok. */
function SaveNotice({ result, onRetry }: { result: SaveResult | null; onRetry: () => void }) {
  if (result !== "failed" && result !== "no-round") return null;
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 short:py-2" role="alert">
      {result === "failed" ? (
        <>
          <p className="font-semibold">{messages().result.saveFailed}</p>
          <p className="mt-0.5 text-xs text-rose-700">{messages().result.saveFailedNote}</p>
          <button className="mt-2 font-bold text-rose-700 underline underline-offset-4 hover:text-rose-900" onClick={onRetry} type="button">
            {messages().result.retry}
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold">{messages().result.noRound}</p>
          <p className="mt-0.5 text-xs text-rose-700">{messages().result.noRoundNote}</p>
        </>
      )}
    </div>
  );
}

const RESULT_LINK_CLASS = "text-sm font-semibold underline-offset-4 transition hover:underline";

/**
 * Girişsiz oyuncuya sonuç ekranında: giriş yaparsa turları profilinde ve rozetlerinde birikir, günün meydan okumasına
 * katılabilir. Bu turun kaydedilmediği açıkça söylenir; sonraki turlar kaydedilir. Sunucu bağlantısı yoksa gösterilmez.
 */
function SignInInvite() {
  const [isOpen, setIsOpen] = useState(false);
  const text = messages().result;
  if (getSupabaseClient() === null) return null;
  return (
    <>
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 lg:p-5">
        <p className="text-sm font-bold text-slate-900">{text.inviteTitle}</p>
        <p className="mt-1 text-xs text-slate-600">{text.inviteBody}</p>
        <button
          className="mt-2 text-sm font-bold text-cyan-700 underline decoration-cyan-300 underline-offset-4 transition hover:text-cyan-800 hover:decoration-cyan-600"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {text.inviteAction}
        </button>
      </div>
      {isOpen && <SignInDialog onClose={() => setIsOpen(false)} />}
    </>
  );
}

/**
 * "Bunları çalış": aynı modun antrenmanı, yalnızca verilen yerlerle. Soru biçimi (şıklı ya da haritaya dokunma) korunur;
 * kıta, günlük ve önceki odak sıfırlanır: odak zaten
 * oyuncunun bu moddaki bütün zayıf yerlerini kapsar, kıta süzgeci onları sessizce eleyebilirdi.
 */
function practiceFor(choice: PlayChoice, ids: string[]): PlayChoice {
  return { kind: "practice", mode: choice.mode, difficulty: choice.difficulty, prompt: choice.prompt, focusIds: ids, choices: choice.choices };
}

/** Asıl tuşun altındaki iki bağlantı: aynı oyunun ayar ekranında başka bir tur seçmek ve ana menüye dönmek. */
function ResultLinks({ chooseLabel, onChooseAnother, onHome }: { chooseLabel: string; onChooseAnother: () => void; onHome: () => void }) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button className={`${RESULT_LINK_CLASS} text-cyan-700 hover:text-cyan-800`} onClick={onChooseAnother} type="button">
        {chooseLabel}
      </button>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
      <button className={`${RESULT_LINK_CLASS} text-slate-500 hover:text-cyan-700`} onClick={onHome} type="button">
        {messages().result.home}
      </button>
    </div>
  );
}

export function ResultScreen({
  player,
  choice,
  score,
  questionCount,
  answeredCount,
  bestStreak,
  durationMs,
  saveResult,
  onRetrySave,
  mostMissed,
  weakSpots,
  missedLocationIds,
  answerRecords,
  subjects,
  onPlay,
  onChooseAnother,
  onHome,
}: ResultScreenProps) {
  if (choice.daily) {
    return (
      <DailyResult
        answerRecords={answerRecords}
        bestStreak={bestStreak}
        choice={choice}
        durationMs={durationMs}
        onHome={onHome}
        onRetrySave={onRetrySave}
        player={player}
        questionCount={questionCount}
        saveResult={saveResult}
        score={score}
      />
    );
  }

  if (choice.kind === "practice") {
    return (
      <PracticeResult
        answerRecords={answerRecords}
        subjects={subjects}
        answeredCount={answeredCount}
        bestStreak={bestStreak}
        choice={choice}
        durationMs={durationMs}
        missedLocationIds={missedLocationIds}
        mostMissed={mostMissed}
        onChooseAnother={onChooseAnother}
        onHome={onHome}
        onPlay={onPlay}
        score={score}
        weakSpots={weakSpots}
      />
    );
  }

  // Oyna turunun yarış sıralaması yok; sonuç oyuncunun kendi gelişimi için (giriş yapmışsa profilinde birikir).
  const duration = formatTime(Math.round(durationMs / 1000));
  const text = messages().result;
  const shareText = text.shareRanked(choiceLabel(choice), score, questionCount, duration);

  return (
    <ResultShell
      aside={
          <aside className={SUMMARY_CARD}>
            <RoundCelebration score={score} total={questionCount} />
            <SummaryHeading eyebrow={choiceLabel(choice)} title={text.roundDone} />

            {/* Skor solda, en uzun seri ve süre sağında alt alta. */}
            <div className={SCORE_ROW}>
              <div className="shrink-0">
                <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                  <span className={SCORE_NUMBER}>{score}</span>
                  <span className="text-3xl text-slate-400 short:text-2xl">/{questionCount}</span>
                </p>
              </div>

              <dl className="flex min-w-0 flex-1 flex-col gap-1.5">
                <StatTile label={text.bestStreak} value={String(bestStreak)} />
                <StatTile label={text.duration} value={duration} />
              </dl>
            </div>

            <RoundSquares answers={answerRecords} />
            <WrongAnswers answers={answerRecords} choice={choice} subjects={subjects} />

            {choice.neighbors ? (
              <NeighborsNotSaved />
            ) : (
              <>
                <SaveNotice onRetry={onRetrySave} result={saveResult} />
                <NewBadges isSaved={saveResult === "saved"} />
              </>
            )}

            {/* Yeni oyun: en sık yapılan iş aynı turu tekrar oynamak; başka tur, seçeneklerin hepsinin durduğu
                ayar ekranında seçilir. */}
            <div className="flex flex-col gap-3 pt-2 short:pt-0 lg:mt-auto">
              {/* Aynı turu tekrar oynamak ve skoru paylaşmak yan yana; ikisi de tur biter bitmez yapılan işler. */}
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton isCompact label={text.playAgain} onClick={() => onPlay(choice)} />
                <ShareScoreButton isCompact text={shareText} />
              </div>
              <ResultLinks chooseLabel={text.chooseRound} onChooseAnother={onChooseAnother} onHome={onHome} />
            </div>
          </aside>
      }
    >
      <RightAnswers answers={answerRecords} choice={choice} className={RESULT_CARD} isOpenByDefault={Boolean(choice.neighbors)} subjects={subjects} />

      {!player && !choice.neighbors && <SignInInvite />}

      {/* Kişisel zayıf yerler ve herkesin en çok yanlışları yerleri adıyla bulmaktan hesaplanır; komşuluk turunda gösterilmez. */}
      {!choice.neighbors && (
        <>
          {/* Kişisel zayıf yerler: giriş yapmış oyuncuda; "Bunları çalış" antrenmanı yalnızca bu yerlerle başlatır. */}
          <WeakSpots
            choice={choice}
            className={RESULT_CARD}
            onPractice={(ids) => onPlay(practiceFor(choice, ids))}
            spots={weakSpots}
          />

          <MostMissed
            className={RESULT_CARD_QUIET}
            choice={choice}
            missedLocationIds={missedLocationIds}
            modeLabel={BOARDS.find((board) => board.id === boardIdFor(choice))?.label}
            stats={mostMissed}
          />
        </>
      )}
    </ResultShell>
  );
}

type PracticeResultProps = {
  answerRecords: AnswerRecord[];
  subjects: string[] | null;
  choice: PlayChoice;
  score: number;
  answeredCount: number;
  bestStreak: number;
  durationMs: number;
  mostMissed: LocationStat[] | null | undefined;
  weakSpots: WeakSpot[] | null | undefined;
  missedLocationIds: string[];
  onPlay: (choice: PlayChoice) => void;
  onChooseAnother: () => void;
  onHome: () => void;
};

/**
 * Antrenman sonucu kaydedilmez; yalnızca oyuncunun kendi gelişimi için özet gösterilir.
 * En çok yanlış yapılanlar listesi yine de gösterilir: oyuncuların turlarından gelir, okumak serbesttir.
 */
function PracticeResult({
  weakSpots,
  answerRecords,
  subjects,
  choice,
  score,
  answeredCount,
  bestStreak,
  durationMs,
  mostMissed,
  missedLocationIds,
  onPlay,
  onChooseAnother,
  onHome,
}: PracticeResultProps) {
  const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
  const text = messages().result;

  return (
    <ResultShell
      aside={
          <aside className={SUMMARY_CARD}>
            <RoundCelebration score={score} total={answeredCount} />
            <SummaryHeading eyebrow={choiceLabel(choice)} title={text.practiceDone} />

            <div className={SCORE_ROW}>
              <div className="shrink-0">
                <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                  <span className={SCORE_NUMBER}>{score}</span>
                  <span className="text-3xl text-slate-400 short:text-2xl">/{answeredCount}</span>
                </p>
              </div>

              <dl className="flex min-w-0 flex-1 flex-col gap-1.5">
                <StatTile label={text.accuracy} value={text.percent(accuracy)} />
                <StatTile label={text.bestStreak} value={String(bestStreak)} />
                <StatTile label={text.duration} value={formatTime(Math.round(durationMs / 1000))} />
              </dl>
            </div>

            <RoundSquares answers={answerRecords} />
            <WrongAnswers answers={answerRecords} choice={choice} subjects={subjects} />

            <div className="flex flex-col gap-3 pt-2 short:pt-0 lg:mt-auto">
              <PrimaryButton label={text.practiceAgain} onClick={() => onPlay(choice)} />
              <ResultLinks chooseLabel={text.choosePractice} onChooseAnother={onChooseAnother} onHome={onHome} />
            </div>
          </aside>
      }
    >
      <RightAnswers answers={answerRecords} choice={choice} className={RESULT_CARD} isOpenByDefault={Boolean(choice.neighbors)} subjects={subjects} />
      {/* Komşuluk turunda cevap bir komşuluk bilgisidir, yerin adı değil; "zayıf yerlerin" ve "herkesin en çok yanlışları" yerleri adıyla
          bulmakla ilgili olduğu için burada karışmasın diye gösterilmez. */}
      {!choice.neighbors && (
        <>
          <WeakSpots choice={choice} className={RESULT_CARD} onPractice={(ids) => onPlay(practiceFor(choice, ids))} spots={weakSpots} />
          <MostMissed className={RESULT_CARD_QUIET} choice={choice} missedLocationIds={missedLocationIds} stats={mostMissed} />
        </>
      )}
    </ResultShell>
  );
}

type DailyResultProps = {
  player: Player | null;
  choice: PlayChoice;
  score: number;
  questionCount: number;
  bestStreak: number;
  durationMs: number;
  answerRecords: AnswerRecord[];
  saveResult: SaveResult | null;
  onRetrySave: () => void;
  onHome: () => void;
};

/**
 * Günün meydan okumasının sonucu: skor, süre, günün sıralamasındaki yer ve gün serisi; soru soru kareler ve paylaşma
 * tuşu; sağda günün sıralaması. Meydan okuma günde bir kez oynandığı için "Tekrar oyna" yoktur; ana menüde diğer
 * meydan okumalar beklenir. Sıra ve seri, sonuç kaydedildikten sonra sunucudan gelir.
 */
function DailyResult({ player, choice, score, questionCount, bestStreak, durationMs, answerRecords, saveResult, onRetrySave, onHome }: DailyResultProps) {
  const boardId = boardIdFor(choice);
  const [shownBoard, setShownBoard] = useState<BoardId>(boardId);
  const status = useDailyStatus(player, saveResult);
  const leaderboards = useDailyLeaderboards(saveResult !== null, saveResult);
  const mine = status?.results.find((result) => boardOf(result) === boardId);
  const answers = answerRecords.map((answer) => answer.location === answer.selected);
  const text = messages().result;

  return (
    <ResultShell
      aside={
        <aside className={SUMMARY_CARD}>
          <RoundCelebration score={score} total={questionCount} />
          <SummaryHeading eyebrow={choiceLabel(choice)} title={text.dailyDone} />

          <div className={SCORE_ROW}>
            <p className="shrink-0 font-display leading-none font-bold text-slate-900 tabular-nums">
              <span className={SCORE_NUMBER}>{score}</span>
              <span className="text-3xl text-slate-400 short:text-2xl">/{questionCount}</span>
            </p>
            <dl className="flex min-w-0 flex-1 flex-col gap-1.5">
              <StatTile label={text.duration} value={formatTime(Math.round(durationMs / 1000))} />
              <StatTile label={text.dailyRank} value={mine ? `${messages().common.rank(mine.rank)} / ${mine.players}` : "—"} />
              <StatTile label={text.dailyStreak} value={status ? `🔥 ${status.streak}` : "—"} />
            </dl>
          </div>

          <RoundReview answers={answerRecords} choice={choice} />
          <SaveNotice onRetry={onRetrySave} result={saveResult} />
          <NewBadges isSaved={saveResult === "saved"} />

          <div className="flex flex-col gap-3 pt-2 short:pt-0 lg:mt-auto">
            <ShareScoreButton text={dailyShareText(boardId, answers, score, durationMs)} />
            <button className={`${RESULT_LINK_CLASS} text-cyan-700 hover:text-cyan-800`} onClick={onHome} type="button">
              {text.otherChallenges}
            </button>
            {bestStreak >= 3 && <p className="text-center text-xs text-slate-500">{text.longestStreak(bestStreak)}</p>}
          </div>
        </aside>
      }
    >
      <section className={RESULT_CARD}>
        <Leaderboard
          boardId={shownBoard}
          currentPlayerId={player?.id}
          emptyText={text.dailyEmpty}
          isLoading={leaderboards === null}
          leaderboardError={null}
          leaderboards={leaderboards ?? emptyLeaderboards()}
          onBoardChange={setShownBoard}
          tall
          title={text.dailyLeaderboard}
        />
      </section>
    </ResultShell>
  );
}
