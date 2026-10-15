import { Leaderboard } from "./Leaderboard";
import { Logo } from "./Logo";
import { MostMissed } from "./MostMissed";
import { PlayerBadge } from "./PlayerBadge";
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
  type BoardId,
  type LocationStat,
  type PlayChoice,
  type Player,
} from "@/lib/game";
import { type Leaderboards } from "@/lib/hooks/useLeaderboard";

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
  /** Tüm oyuncuların bu modda en çok yanlış yaptığı yerler; `undefined` yükleniyor, `null` yüklenemedi. */
  mostMissed: LocationStat[] | null | undefined;
  /** Listenin ait olduğu mod: yarışta sıralamada seçili sekme, antrenmanda oynanan mod. */
  mostMissedChoice: PlayChoice;
  /** Oyuncunun bu turda yanlış cevapladığı yerler. */
  missedLocationIds: string[];
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
const SCORE_ROW = "flex flex-col gap-5 short:flex-row short:items-center short:gap-3";
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
        <PlayerBadge onSignOut={onSignOut} player={player} />
      </header>
      <div className="grid gap-3 md:min-h-0 md:flex-1 md:grid-cols-[20rem_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        {aside}
        <div className="flex min-w-0 flex-col gap-3 md:min-h-0 md:overflow-y-auto lg:gap-5">{children}</div>
      </div>
    </section>
  );
}

/** `shortLabel`: alçak ekranda skorun yanındaki dar kutuya sığan kısa etiket. */
function StatTile({ label, shortLabel, value, note }: { label: string; shortLabel?: string; value: string; note?: string | null }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 short:px-2.5 short:py-1.5">
      <dt className="text-xs text-slate-500">
        {shortLabel ? (
          <>
            <span className="short:hidden">{label}</span>
            <span className="hidden short:inline">{shortLabel}</span>
          </>
        ) : (
          label
        )}
      </dt>
      <dd className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900 short:text-lg">{value}</dd>
      {note && <dd className="mt-0.5 text-xs font-semibold tabular-nums text-cyan-700">{note}</dd>}
    </div>
  );
}

/** Özet kartının başlığı: turun adı ve büyük "bitti" başlığı. */
function SummaryHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className={RESULT_EYEBROW}>{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl leading-none font-bold text-slate-900 short:mt-1 short:text-2xl">{title}</h1>
    </div>
  );
}

function PrimaryButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className={PRIMARY_BUTTON_CLASS} onClick={onClick} type="button">
      {label}
      <svg aria-hidden="true" className="h-5 w-5 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
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
  mostMissed,
  mostMissedChoice,
  missedLocationIds,
  onBoardChange,
  onPlay,
  onChooseAnother,
  onHome,
  onSignOut,
}: ResultScreenProps) {
  if (choice.kind === "practice") {
    return (
      <PracticeResult
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

            {/* Alçak ekranda skor ve istatistikler yan yana durur; tuşlar kaydırmadan görünsün. */}
            <div className={SCORE_ROW}>
              <div className="short:shrink-0">
                <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                  <span className="text-7xl short:text-5xl">{score}</span>
                  <span className="text-3xl text-slate-400 short:text-2xl">/{questionCount}</span>
                </p>
                {personalBest && (
                  <p className="mt-2 text-sm font-semibold text-cyan-700 tabular-nums short:mt-1 short:text-xs">
                    En iyin {personalBest.score}/{questionCount} · {formatTime(Math.round(personalBest.duration_ms / 1000))}
                  </p>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-3 short:flex-1 short:gap-2">
                <StatTile label="En uzun seri" shortLabel="Seri" value={String(bestStreak)} />
                <StatTile label="Süre" value={duration} />
              </dl>
            </div>

            {/* Yeni oyun: en sık yapılan iş aynı turu tekrar oynamak; başka tur, seçeneklerin hepsinin durduğu
                ayar ekranında seçilir. */}
            <div className="flex flex-col gap-3 pt-2 short:pt-0 lg:mt-auto">
              <PrimaryButton label={`Tekrar oyna · ${BOARDS.find((board) => board.id === playedBoardId)?.label ?? ""}`} onClick={() => onPlay(choice)} />
              <ShareScoreButton text={shareText} />
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
  // Antrenmanın yarıştaki karşılığı (kıtalar dünyanın Normal / Zor sıralamasına düşer).
  const rankedBoard = BOARDS.find((board) => board.id === boardIdFor(choice)) ?? BOARDS[0];

  return (
    <ResultShell
      onHome={onHome}
      aside={
          <aside className={SUMMARY_CARD}>
            <SummaryHeading eyebrow={choiceLabel(choice)} title="Antrenman bitti" />

            <div className={SCORE_ROW}>
              <div className="short:shrink-0">
                <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                  <span className="text-7xl short:text-5xl">{score}</span>
                  <span className="text-3xl text-slate-400 short:text-2xl">/{answeredCount}</span>
                </p>
                {/* Alçak ekranda gizli: alttaki yarış daveti aynı şeyi söylüyor. */}
                <p className="mt-2 text-sm text-slate-500 short:hidden">Antrenman sonuçları sıralamaya kaydedilmez.</p>
              </div>

              <dl className="grid grid-cols-3 gap-3 short:flex-1 short:gap-2">
                <StatTile label="Başarı" value={`%${accuracy}`} />
                <StatTile label="En uzun seri" shortLabel="Seri" value={String(bestStreak)} />
                <StatTile label="Süre" value={formatTime(Math.round(durationMs / 1000))} />
              </dl>
            </div>

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
