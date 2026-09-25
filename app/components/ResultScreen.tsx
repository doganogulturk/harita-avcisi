import Image from "next/image";
import { Leaderboard } from "./Leaderboard";
import { Logo } from "./Logo";
import { MostMissed } from "./MostMissed";
import { PlayerBadge } from "./PlayerBadge";
import { PRIMARY_BUTTON_CLASS } from "./PlayButton";
import {
  BOARDS,
  choiceForBoard,
  choiceLabel,
  flagUrl,
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
  /** Listenin ait olduğu mod: yarışta sıralamada seçili sekme, antrenmanda oynanan mod. */
  mostMissedChoice: PlayChoice;
  /** Oyuncunun bu turda yanlış cevapladığı yerler. */
  missedLocationIds: string[];
  onBoardChange: (boardId: BoardId) => void;
  onPlay: (choice: PlayChoice) => void;
  onHome: () => void;
  onSignOut: () => void;
};

/** Giriş ekranındaki kartlarla aynı çerçeve. */
const RESULT_CARD = "rounded-3xl border-2 border-slate-200 bg-white p-5 lg:p-7";
/**
 * Sol özet kartı: iki sütunlu düzende ekranın yüksekliğini doldurur, tuşlar altına yaslanır.
 * Alçak ekranda içerik sığmazsa kart kendi içinde kayar.
 */
const SUMMARY_CARD = `${RESULT_CARD} flex flex-col gap-5 lg:min-h-0 lg:overflow-y-auto`;
const RESULT_EYEBROW = "text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase";

/**
 * Sonuç ekranı giriş ekranı gibi ekranın tamamını kullanır. Solda boydan boya turun özeti ve yeni tur
 * tuşları, sağda alt alta önce sıralama, sonra en çok yanlış yapılanlar; sağ sütun kendi içinde kayar.
 * Dar ekranda her şey tek sütunda aynı sırayla alt alta gelir ve sayfa kayar; sıralama yine önce görünür.
 */
function ResultShell({ player, onSignOut, aside, children }: { player: Player | null; onSignOut: () => void; aside: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex h-full w-full flex-col gap-3 overflow-y-auto px-4 py-3 lg:gap-5 lg:overflow-hidden lg:px-8 lg:py-5">
      <header className="flex shrink-0 items-center justify-between gap-3">
        <Logo isHeading={false} />
        <PlayerBadge onSignOut={onSignOut} player={player} />
      </header>
      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
        {aside}
        <div className="flex min-w-0 flex-col gap-3 lg:min-h-0 lg:gap-5 lg:overflow-y-auto">{children}</div>
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

/** Yeni oyun tuşları haritaya göre gruplanır; her tuş bir sıralamaya karşılık gelir. */
const NEW_GAME_GROUPS: { title: string; icon: "turkey" | "world"; boards: { id: BoardId; label: string }[] }[] = [
  {
    title: "Türkiye",
    icon: "turkey",
    boards: [
      { id: "turkey", label: "Şehir" },
      { id: "turkey-plates", label: "Plaka" },
    ],
  },
  {
    title: "Dünya",
    icon: "world",
    boards: [
      { id: "world", label: "Normal" },
      { id: "world-hard", label: "Zor" },
      { id: "world-flags", label: "Bayrak" },
    ],
  },
];

/** Başlık: ortada yazı, iki yanında turkuazdan saydama solan çizgiler ve parlayan noktalar. */
function NewGameHeading() {
  return (
    <div aria-hidden="true" className="flex items-center gap-3">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300 to-cyan-500" />
      <span className="glow-dot h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_2px_rgb(6_182_212/0.6)]" />
      <span className="font-display text-lg font-bold tracking-[0.18em] text-slate-900 uppercase">Yeni oyun</span>
      <span className="glow-dot h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_2px_rgb(6_182_212/0.6)]" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-300 to-cyan-500" />
    </div>
  );
}

function GroupIcon({ icon }: { icon: "turkey" | "world" }) {
  if (icon === "turkey") {
    return <Image alt="" className="h-3 w-auto rounded-[2px] shadow-sm" height={12} src={flagUrl("tr")} unoptimized width={16} />;
  }
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5 text-cyan-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  );
}

/**
 * Yarış sonucunun yeni oyun tuşları. Tuşların çerçevesinde bir ışık döner; aynı anda dönmesinler
 * diye her biri farklı bir anda başlar. Az önce oynanan tur, üzerinden ışık süzülen dolu turkuaz
 * tuşla öne çıkar ve "tekrar oyna" işini görür.
 */
function NewGameSection({ playedBoardId, onPlay }: { playedBoardId: BoardId; onPlay: (choice: PlayChoice) => void }) {
  let buttonIndex = 0;
  return (
    <section aria-label="Yeni oyun" className="flex flex-col gap-4">
      <NewGameHeading />
      {NEW_GAME_GROUPS.map((group) => (
        <div key={group.title}>
          <p className="mb-2 flex items-center justify-center gap-1.5 text-[11px] font-bold tracking-[0.2em] text-slate-500 uppercase">
            <GroupIcon icon={group.icon} />
            {group.title}
          </p>
          <div className={`grid gap-2 ${group.boards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
            {group.boards.map((option) => {
              const board = BOARDS.find((candidate) => candidate.id === option.id) ?? BOARDS[0];
              const isPlayed = option.id === playedBoardId;
              const delay = `${-0.55 * buttonIndex++}s`;
              return (
                <button
                  aria-label={isPlayed ? `${option.label}, tekrar oyna` : undefined}
                  className={`group flex items-center justify-center gap-1.5 rounded-2xl px-2 py-3 font-display text-base font-bold transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    isPlayed
                      ? "shimmer bg-gradient-to-br from-cyan-500 to-cyan-700 text-white shadow-lg shadow-cyan-600/30 hover:shadow-xl hover:shadow-cyan-500/40"
                      : "sweep sweep-cyan text-slate-800 shadow-sm hover:text-cyan-700 hover:shadow-md hover:shadow-cyan-500/20"
                  }`}
                  key={option.id}
                  onClick={() => onPlay(choiceForBoard(board))}
                  // Dönen ışık ve süzülen parıltı, tuşların hepsinde aynı anda olmasın.
                  style={{ "--sweep-delay": delay, "--shimmer-delay": delay } as React.CSSProperties}
                  title={isPlayed ? "Tekrar oyna" : undefined}
                  type="button"
                >
                  {isPlayed && (
                    <svg
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 transition-transform duration-500 group-hover:-rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3v4.5h-4.5" />
                    </svg>
                  )}
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
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
  mostMissedChoice,
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

            <div className="flex flex-col gap-4 pt-2 lg:mt-auto">
              <NewGameSection onPlay={onPlay} playedBoardId={playedBoardId} />
              <HomeLink onClick={onHome} />
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

            <div className="flex flex-col gap-4 pt-2 lg:mt-auto">
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
