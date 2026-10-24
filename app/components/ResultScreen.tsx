import { Leaderboard } from "./Leaderboard";
import { Logo } from "./Logo";
import { MostMissed } from "./MostMissed";
import { AccountMenu } from "./AccountMenu";
import { RoundReview } from "./RoundReview";
import { PRIMARY_BUTTON_CLASS } from "./PlayButton";
import { ShareScoreButton } from "./ShareScoreButton";
import {
  boardIdFor,
  BOARDS,
  choiceForBoard,
  choiceLabel,
  formatTime,
  GAME_DURATION_SECONDS,
  QUESTIONS_PER_ROUND,
  type AnswerRecord,
  type BoardId,
  type LocationStat,
  type PlayChoice,
  type Player,
} from "@/lib/game";
import { type Leaderboards, type SaveResult } from "@/lib/hooks/useLeaderboard";

type ResultScreenProps = {
  player: Player | null;
  choice: PlayChoice;
  playedBoardId: BoardId;
  score: number;
  questionCount: number;
  /** Antrenmanda tur uzunluğu sabit değildir; oyuncunun cevapladığı soru sayısı. */
  answeredCount: number;
  bestStreak: number;
  durationMs: number;
  leaderboards: Leaderboards;
  boardId: BoardId;
  leaderboardError: string | null;
  /** Yarış skorunun kaydı: null sürüyor; "failed" yeniden denenebilir; "no-round" tur sunucuda açılamamıştı. */
  saveResult: SaveResult | null;
  onRetrySave: () => void;
  /** Tüm oyuncuların bu modda en çok yanlış yaptığı yerler; `undefined` yükleniyor, `null` yüklenemedi. */
  mostMissed: LocationStat[] | null | undefined;
  /** Listenin ait olduğu mod: yarışta sıralamada seçili sekme, antrenmanda oynanan mod. */
  mostMissedChoice: PlayChoice;
  /** Oyuncunun bu turda yanlış cevapladığı yerler. */
  missedLocationIds: string[];
  /** Turun cevapları sırayla; soru soru döküm (RoundReview) bunlardan çizilir. */
  answerRecords: AnswerRecord[];
  onBoardChange: (boardId: BoardId) => void;
  onPlay: (choice: PlayChoice) => void;
  /** Oynanan oyunun (Yarış ya da Antrenman) ayar ekranını açar; başka bir tur orada seçilir. */
  onChooseAnother: () => void;
  onHome: () => void;
  onSignOut: () => void;
};

/** Giriş ekranındaki kartlarla aynı çerçeve. */
const RESULT_CARD = "rounded-3xl border-2 border-slate-200 bg-white p-5 short:p-4 lg:p-7";
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
 * tuşları, sağda alt alta önce sıralama, sonra en çok yanlış yapılanlar; iki sütun da kendi içinde kayar.
 * Yatay telefonda da iki sütundur. Dikey telefonda her şey tek sütunda alt alta gelir ve sayfa kayar.
 */
function ResultShell({
  player,
  onSignOut,
  onHome,
  aside,
  children,
}: {
  player: Player | null;
  onSignOut: () => void;
  onHome: () => void;
  aside: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex h-full w-full flex-col gap-3 overflow-y-auto px-4 py-3 short:gap-2 short:py-2 md:overflow-hidden lg:gap-5 lg:px-8 lg:py-5">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <button aria-label="Ana menü" className="rounded-2xl transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none" onClick={onHome} type="button">
          <Logo isHeading={false} />
        </button>
        <AccountMenu onSignOut={onSignOut} player={player} />
      </header>
      <div className="grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-[20rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
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
  "flex w-full items-center justify-center gap-1.5 rounded-2xl bg-cyan-600 px-3 py-3 text-base font-bold whitespace-nowrap text-white shadow-lg shadow-cyan-600/20 transition-all duration-200 hover:gap-2.5 hover:bg-cyan-500 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:outline-none short:py-2.5";

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

/** Skor kaydedilemediyse özetin altında: neden ve (yapılabiliyorsa) yeniden deneme. Kaydedildiyse ya da sürüyorsa yok. */
function SaveNotice({ result, onRetry }: { result: SaveResult | null; onRetry: () => void }) {
  if (result !== "failed" && result !== "no-round") return null;
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 short:py-2" role="alert">
      {result === "failed" ? (
        <>
          <p className="font-semibold">Skorun kaydedilemedi.</p>
          <p className="mt-0.5 text-xs text-rose-700">Bağlantı gelince kendiliğinden yeniden denenir.</p>
          <button className="mt-2 font-bold text-rose-700 underline underline-offset-4 hover:text-rose-900" onClick={onRetry} type="button">
            Tekrar dene
          </button>
        </>
      ) : (
        <>
          <p className="font-semibold">Bu tur kaydedilemedi.</p>
          <p className="mt-0.5 text-xs text-rose-700">Tur başlarken bağlantı kurulamadı; sıralamaya girmek için yeni bir tur oyna.</p>
        </>
      )}
    </div>
  );
}

const RESULT_LINK_CLASS = "text-sm font-semibold underline-offset-4 transition hover:underline";

/** Asıl tuşun altındaki iki bağlantı: aynı oyunun ayar ekranında başka bir tur seçmek ve ana menüye dönmek. */
function ResultLinks({ chooseLabel, onChooseAnother, onHome }: { chooseLabel: string; onChooseAnother: () => void; onHome: () => void }) {
  return (
    <div className="flex items-center justify-center gap-5">
      <button className={`${RESULT_LINK_CLASS} text-cyan-700 hover:text-cyan-800`} onClick={onChooseAnother} type="button">
        {chooseLabel}
      </button>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-slate-300" />
      <button className={`${RESULT_LINK_CLASS} text-slate-500 hover:text-cyan-700`} onClick={onHome} type="button">
        Ana menü
      </button>
    </div>
  );
}

export function ResultScreen({
  player,
  choice,
  playedBoardId,
  score,
  questionCount,
  answeredCount,
  bestStreak,
  durationMs,
  leaderboards,
  boardId,
  leaderboardError,
  saveResult,
  onRetrySave,
  mostMissed,
  mostMissedChoice,
  missedLocationIds,
  answerRecords,
  onBoardChange,
  onPlay,
  onChooseAnother,
  onHome,
  onSignOut,
}: ResultScreenProps) {
  if (choice.kind === "practice") {
    return (
      <PracticeResult
        answerRecords={answerRecords}
        answeredCount={answeredCount}
        bestStreak={bestStreak}
        choice={choice}
        durationMs={durationMs}
        missedLocationIds={missedLocationIds}
        mostMissed={mostMissed}
        onChooseAnother={onChooseAnother}
        onHome={onHome}
        onPlay={onPlay}
        onSignOut={onSignOut}
        player={player}
        score={score}
      />
    );
  }

  // Sıralamadaki satır en yüksek puanlı tura ait; süresi bu turunkinden uzun olabilir.
  const personalBest = leaderboards[playedBoardId].find((entry) => entry.user_id === player?.id);
  const rank = personalBest ? leaderboards[playedBoardId].indexOf(personalBest) + 1 : 0;
  const duration = formatTime(Math.round(durationMs / 1000));
  const shareText = `Harita Avcısı'nda ${choiceLabel(choice)} yarışında ${score}/${questionCount} yaptım, süre ${duration}.${
    rank > 0 ? ` Sıralamada ${rank}. sıradayım.` : ""
  } Sen kaç yaparsın?`;

  return (
    <ResultShell
      onHome={onHome}
      aside={
          <aside className={SUMMARY_CARD}>
            <SummaryHeading eyebrow={choiceLabel(choice)} title="Tur tamamlandı" />

            {/* Skor solda, en uzun seri ve süre sağında alt alta. */}
            <div className={SCORE_ROW}>
              <div className="shrink-0">
                <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                  <span className={SCORE_NUMBER}>{score}</span>
                  <span className="text-3xl text-slate-400 short:text-2xl">/{questionCount}</span>
                </p>
                {personalBest && (
                  <p className="mt-1.5 text-xs font-semibold whitespace-nowrap text-cyan-700 tabular-nums lg:text-sm">
                    En iyin {personalBest.score}/{questionCount} · {formatTime(Math.round(personalBest.duration_ms / 1000))}
                  </p>
                )}
              </div>

              <dl className="flex min-w-0 flex-1 flex-col gap-1.5">
                <StatTile label="En uzun seri" value={String(bestStreak)} />
                <StatTile label="Süre" value={duration} />
              </dl>
            </div>

            <RoundReview answers={answerRecords} choice={choice} />

            <SaveNotice onRetry={onRetrySave} result={saveResult} />

            {/* Yeni oyun: en sık yapılan iş aynı turu tekrar oynamak; başka tur, seçeneklerin hepsinin durduğu
                ayar ekranında seçilir. */}
            <div className="flex flex-col gap-3 pt-2 short:pt-0 lg:mt-auto">
              {/* Aynı turu tekrar oynamak ve skoru paylaşmak yan yana; ikisi de tur biter bitmez yapılan işler. */}
              <div className="grid grid-cols-2 gap-2">
                <PrimaryButton isCompact label="Tekrar oyna" onClick={() => onPlay(choice)} />
                <ShareScoreButton isCompact text={shareText} />
              </div>
              <ResultLinks chooseLabel="Başka tur seç" onChooseAnother={onChooseAnother} onHome={onHome} />
            </div>
          </aside>
      }
      onSignOut={onSignOut}
      player={player}
    >
      <section className={RESULT_CARD}>
        <Leaderboard
          boardId={boardId}
          currentPlayerId={player?.id}
          leaderboardError={leaderboardError}
          leaderboards={leaderboards}
          onBoardChange={onBoardChange}
          tall
        />
      </section>

      <MostMissed
        className={RESULT_CARD}
        choice={mostMissedChoice}
        missedLocationIds={missedLocationIds}
        modeLabel={BOARDS.find((board) => board.id === boardId)?.label}
        stats={mostMissed}
      />
    </ResultShell>
  );
}

type PracticeResultProps = {
  player: Player | null;
  answerRecords: AnswerRecord[];
  choice: PlayChoice;
  score: number;
  answeredCount: number;
  bestStreak: number;
  durationMs: number;
  mostMissed: LocationStat[] | null | undefined;
  missedLocationIds: string[];
  onPlay: (choice: PlayChoice) => void;
  onChooseAnother: () => void;
  onHome: () => void;
  onSignOut: () => void;
};

/**
 * Antrenman sonucu kaydedilmez; yalnızca oyuncunun kendi gelişimi için özet gösterilir.
 * En çok yanlış yapılanlar listesi yine de gösterilir: yarış turlarından gelir, okumak serbesttir.
 */
function PracticeResult({
  player,
  answerRecords,
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
  onSignOut,
}: PracticeResultProps) {
  const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
  // Antrenmanın yarıştaki karşılığı (kıtalar dünyanın 179 ülkelik sıralamasına düşer).
  const rankedBoard = BOARDS.find((board) => board.id === boardIdFor(choice)) ?? BOARDS[0];

  return (
    <ResultShell
      onHome={onHome}
      aside={
          <aside className={SUMMARY_CARD}>
            <SummaryHeading eyebrow={choiceLabel(choice)} title="Antrenman bitti" />

            <div className={SCORE_ROW}>
              <div className="shrink-0">
                <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                  <span className={SCORE_NUMBER}>{score}</span>
                  <span className="text-3xl text-slate-400 short:text-2xl">/{answeredCount}</span>
                </p>
              </div>

              <dl className="flex min-w-0 flex-1 flex-col gap-1.5">
                <StatTile label="Başarı" value={`%${accuracy}`} />
                <StatTile label="En uzun seri" value={String(bestStreak)} />
                <StatTile label="Süre" value={formatTime(Math.round(durationMs / 1000))} />
              </dl>
            </div>

            <RoundReview answers={answerRecords} choice={choice} />

            <div className="flex flex-col gap-3 pt-2 short:pt-0 lg:mt-auto">
              <PrimaryButton label="Tekrar antrenman" onClick={() => onPlay(choice)} />
              <ResultLinks chooseLabel="Başka antrenman seç" onChooseAnother={onChooseAnother} onHome={onHome} />
            </div>

            {/* Antrenmandan yarışa davet. Giriş yapılmamışsa yarış tuşu giriş adımını açar; bu yüzden önceden söylenir. */}
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4">
              <p className="text-sm font-bold text-slate-900">Skorun sıralamaya girsin mi?</p>
              <p className="mt-1 text-xs text-slate-600">
                Yarışta {QUESTIONS_PER_ROUND} soru, {GAME_DURATION_SECONDS} saniye; sonucun {rankedBoard.label} sıralamasına işlenir.
                {!player && " Google ya da misafir adıyla giriş yeter."}
              </p>
              <button
                className="mt-2 text-sm font-bold text-cyan-700 underline decoration-cyan-300 underline-offset-4 transition hover:text-cyan-800 hover:decoration-cyan-600"
                onClick={() => onPlay(choiceForBoard(rankedBoard))}
                type="button"
              >
                {player ? `${rankedBoard.label} yarışına başla →` : `Giriş yap, ${rankedBoard.label} yarışına başla →`}
              </button>
            </div>
          </aside>
      }
      onSignOut={onSignOut}
      player={player}
    >
      <MostMissed className={RESULT_CARD} choice={choice} missedLocationIds={missedLocationIds} stats={mostMissed} />
    </ResultShell>
  );
}
