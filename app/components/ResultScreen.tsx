import { Leaderboard } from "./Leaderboard";
import { MostMissed } from "./MostMissed";
import { PlayButton } from "./PlayButton";
import { PlayerBadge } from "./PlayerBadge";
import { choiceLabel, FLAG_CHOICE, formatTime, PLATE_CHOICE, type BoardId, type LocationStat, type PlayChoice, type Player } from "@/lib/game";
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
  const stats = [
    {
      label: "Puan",
      value: `${score}/${questionCount}`,
      best: personalBest ? `En iyi ${personalBest.score}/${questionCount}` : null,
    },
    { label: "En uzun seri", value: String(bestStreak), best: null },
    {
      label: "Süre",
      value: formatTime(Math.round(durationMs / 1000)),
      best: personalBest ? `En yüksek puanlı tur ${formatTime(Math.round(personalBest.duration_ms / 1000))}` : null,
    },
  ];

  return (
    <section className="my-auto w-full">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-cyan-950/10 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Tur tamamlandı</h1>
          <PlayerBadge onSignOut={onSignOut} player={player} />
        </div>

        <dl className="mt-6 grid gap-3 sm:grid-cols-3">
          {stats.map((stat) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" key={stat.label}>
              <dt className="text-xs text-slate-500">{stat.label}</dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{stat.value}</dd>
              {stat.best && <dd className="text-xs font-semibold tabular-nums text-cyan-700">{stat.best}</dd>}
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">Yeni tur</p>
          <div className="flex flex-wrap items-center gap-2">
            <PlayButton label="Türkiye" onClick={() => onPlay({ kind: "ranked", mode: "turkey", difficulty: "normal" })} />
            <PlayButton label="Plaka" onClick={() => onPlay(PLATE_CHOICE)} tone="red" />
            <PlayButton label="Dünya" onClick={() => onPlay({ kind: "ranked", mode: "world", difficulty: "normal" })} />
            <PlayButton label="Dünya · Zor" onClick={() => onPlay({ kind: "ranked", mode: "world", difficulty: "hard" })} tone="red" />
            <PlayButton label="Bayrak" onClick={() => onPlay(FLAG_CHOICE)} tone="red" />
            <HomeLink onClick={onHome} />
          </div>
        </div>

        <MostMissed choice={choice} missedLocationIds={missedLocationIds} stats={mostMissed} />

        <div className="mt-8 border-t border-slate-200 pt-6">
          <Leaderboard
            currentPlayerId={player?.id}
            boardId={boardId}
            leaderboardError={leaderboardError}
            leaderboards={leaderboards}
            onBoardChange={onBoardChange}
          />
        </div>
      </div>
    </section>
  );
}

function HomeLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="px-2 text-xs font-semibold text-slate-500 underline-offset-2 transition hover:text-cyan-700 hover:underline"
      onClick={onClick}
      type="button"
    >
      Ana menü
    </button>
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
  const stats = [
    { label: "Doğru", value: `${score}/${answeredCount}` },
    { label: "Başarı", value: `%${accuracy}` },
    { label: "En uzun seri", value: String(bestStreak) },
    { label: "Süre", value: formatTime(Math.round(durationMs / 1000)) },
  ];

  return (
    <section className="my-auto w-full">
      <div className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-cyan-950/10 sm:p-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Antrenman bitti</h1>
            <p className="mt-2 text-sm text-slate-500">{choiceLabel(choice)} · Antrenman sonuçları sıralamaya kaydedilmez.</p>
          </div>
          <PlayerBadge onSignOut={onSignOut} player={player} />
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" key={stat.label}>
              <dt className="text-xs text-slate-500">{stat.label}</dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums text-slate-900">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <PlayButton label="Tekrar antrenman" onClick={() => onPlay(choice)} />
          <HomeLink onClick={onHome} />
        </div>

        <MostMissed choice={choice} missedLocationIds={missedLocationIds} stats={mostMissed} />
      </div>
    </section>
  );
}
