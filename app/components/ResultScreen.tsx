import { Leaderboard } from "./Leaderboard";
import { Logo } from "./Logo";
import { MostMissed } from "./MostMissed";
import { PlayerBadge } from "./PlayerBadge";
import { PRIMARY_BUTTON_CLASS } from "./PlayButton";
import {
  BOARDS,
  choiceForBoard,
  choiceLabel,
  formatTime,
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
  /** Oyuncunun bu turda yanlış cevapladığı yerler. */
  missedLocationIds: string[];
  onBoardChange: (boardId: BoardId) => void;
  onPlay: (choice: PlayChoice) => void;
  onHome: () => void;
  onSignOut: () => void;
};

/** Giriş ekranındaki kartlarla aynı çerçeve. */
const RESULT_CARD = "rounded-3xl border-2 border-slate-200 bg-white p-5 lg:p-7";
/** Sol özet kartı: iki sütunlu düzende sayfa kayarken üstte sabit kalır. */
const SUMMARY_CARD = `${RESULT_CARD} flex flex-col gap-5 lg:sticky lg:top-0`;
const RESULT_EYEBROW = "text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase";

/**
 * Sonuç ekranı giriş ekranı gibi ekranın tamamını kullanır. Solda turun özeti ve yeni tur tuşları,
 * sağda alt alta önce sıralama, sonra en çok yanlış yapılanlar. Sol kart sayfa kayarken yerinde
 * durur; dar ekranda her şey tek sütunda aynı sırayla alt alta gelir, yani sıralama yine önce görünür.
 */
function ResultShell({ player, onSignOut, aside, children }: { player: Player | null; onSignOut: () => void; aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex h-full w-full flex-col gap-3 overflow-y-auto px-4 py-3 lg:gap-5 lg:px-8 lg:py-5">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <Logo isHeading={false} />
        <PlayerBadge onSignOut={onSignOut} player={player} />
      </header>
      <div className="grid items-start gap-3 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        {aside}
        <div className="flex min-w-0 flex-col gap-3 lg:gap-5">{children}</div>
      </div>
    </section>
  );
}

function StatTile({ label, value, note }: { label: string; value: string; note?: string | null }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{value}</dd>
      {note && <dd className="mt-0.5 text-xs font-semibold tabular-nums text-cyan-700">{note}</dd>}
    </div>
  );
}

/** Özet kartının başlığı: turun adı ve büyük "bitti" başlığı. */
function SummaryHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className={RESULT_EYEBROW}>{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl leading-none font-bold text-slate-900 short:text-3xl">{title}</h1>
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

function HomeLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="w-fit self-center text-sm font-semibold text-slate-500 underline-offset-4 transition hover:text-cyan-700 hover:underline"
      onClick={onClick}
      type="button"
    >
      Ana menü
    </button>
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
  missedLocationIds,
  onBoardChange,
  onPlay,
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
  const otherBoards = BOARDS.filter((board) => board.id !== playedBoardId);

  return (
    <ResultShell
      aside={
          <aside className={SUMMARY_CARD}>
            <SummaryHeading eyebrow={choiceLabel(choice)} title="Tur tamamlandı" />

            <div>
              <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                <span className="text-7xl short:text-6xl">{score}</span>
                <span className="text-3xl text-slate-400">/{questionCount}</span>
              </p>
              {personalBest && (
                <p className="mt-2 text-sm font-semibold text-cyan-700 tabular-nums">
                  En iyin {personalBest.score}/{questionCount} · {formatTime(Math.round(personalBest.duration_ms / 1000))}
                </p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <StatTile label="En uzun seri" value={String(bestStreak)} />
              <StatTile label="Süre" value={formatTime(Math.round(durationMs / 1000))} />
            </dl>

            <div className="flex flex-col gap-4 pt-2">
              <PrimaryButton label="Tekrar oyna" onClick={() => onPlay(choice)} />
              <div>
                <p className="mb-2 text-sm font-bold text-slate-900">Başka bir tur</p>
                <div className="grid grid-cols-2 gap-2">
                  {otherBoards.map((board) => (
                    <button
                      className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                      key={board.id}
                      onClick={() => onPlay(choiceForBoard(board))}
                      type="button"
                    >
                      {board.label}
                      <svg aria-hidden="true" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <HomeLink onClick={onHome} />
            </div>
          </aside>
      }
      onSignOut={onSignOut}
      player={player}
    >
      <section className={RESULT_CARD}>
        <p className={`${RESULT_EYEBROW} mb-4`}>Sıralama</p>
        <Leaderboard
          boardId={boardId}
          currentPlayerId={player?.id}
          leaderboardError={leaderboardError}
          leaderboards={leaderboards}
          onBoardChange={onBoardChange}
          showTitle={false}
          tall
        />
      </section>

      <MostMissed className={RESULT_CARD} choice={choice} missedLocationIds={missedLocationIds} stats={mostMissed} />
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
  onHome,
  onSignOut,
}: PracticeResultProps) {
  const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;

  return (
    <ResultShell
      aside={
          <aside className={SUMMARY_CARD}>
            <SummaryHeading eyebrow={choiceLabel(choice)} title="Antrenman bitti" />

            <div>
              <p className="font-display leading-none font-bold text-slate-900 tabular-nums">
                <span className="text-7xl short:text-6xl">{score}</span>
                <span className="text-3xl text-slate-400">/{answeredCount}</span>
              </p>
              <p className="mt-2 text-sm text-slate-500">Antrenman sonuçları sıralamaya kaydedilmez.</p>
            </div>

            <dl className="grid grid-cols-3 gap-3">
              <StatTile label="Başarı" value={`%${accuracy}`} />
              <StatTile label="En uzun seri" value={String(bestStreak)} />
              <StatTile label="Süre" value={formatTime(Math.round(durationMs / 1000))} />
            </dl>

            <div className="flex flex-col gap-4 pt-2">
              <PrimaryButton label="Tekrar antrenman" onClick={() => onPlay(choice)} />
              <HomeLink onClick={onHome} />
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
