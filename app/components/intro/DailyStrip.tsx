"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "../BottomSheet";
import { Leaderboard } from "../Leaderboard";
import { ShareScoreButton } from "../ShareScoreButton";
import { boardOf, dailyChoice, dailyDateLabel, dailyShareText, msUntilNextDaily, useDailyLeaderboards, useDailyStatus, type DailyResult } from "@/lib/daily";
import { BOARDS, formatTime, QUESTIONS_PER_ROUND, type BoardId, type PlayChoice, type Player } from "@/lib/game";

/** "05:12" biçiminde saat ve dakika; şerit dakikada bir güncellenir. */
function hoursMinutes(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function useNextDailyCountdown() {
  const [msLeft, setMsLeft] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setMsLeft(msUntilNextDaily());
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);
  return msLeft;
}

type DailyStripProps = {
  player: Player | null;
  /** Oynanmamış bir meydan okumaya dokununca; giriş yoksa ana sayfa giriş adımını açar. */
  onPlay: (choice: PlayChoice) => void;
  /** Meydan okuma açılamadıysa (bugün oynandı, bağlantı yok) gösterilen not. */
  notice: string | null;
};

/**
 * Ana ekranda kartların üstündeki "Günün meydan okuması" şeridi: dört mod (Türkiye, Plaka, Dünya, Bayrak), oynananın
 * skoru, gün serisi ve yeni meydan okumaya kalan süre. Oynanmamış moda dokununca tur başlar; oynanana (ya da bırakılana)
 * dokununca o modun günlük sıralaması ve paylaşma tuşu alttan açılır.
 */
export function DailyStrip({ player, onPlay, notice }: DailyStripProps) {
  const status = useDailyStatus(player, null);
  const msLeft = useNextDailyCountdown();
  const [openBoard, setOpenBoard] = useState<BoardId | null>(null);

  const resultOf = (boardId: BoardId) => status?.results.find((result) => boardOf(result) === boardId);
  const isStarted = (boardId: BoardId) => status?.started.some((item) => boardOf(item) === boardId) ?? false;

  return (
    <section className="shrink-0 rounded-3xl border-2 border-cyan-200 bg-white/90 p-3 shadow-sm short:p-2 sm:flex sm:items-center sm:gap-4 lg:p-4">
      <div className="flex items-center justify-between gap-3 sm:shrink-0">
        <div className="min-w-0">
          <p className="font-display text-base leading-tight font-bold whitespace-nowrap text-slate-900 lg:text-xl">Günün meydan okuması</p>
          <p className="text-xs text-slate-500 tabular-nums short:hidden">
            {dailyDateLabel()}
            {msLeft !== null && ` · yenisi ${hoursMinutes(msLeft)} sonra`}
          </p>
        </div>
        {status && status.streak > 0 && (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700" title="Gün serisi">
            🔥 {status.streak} gün
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-4 gap-1.5 sm:mt-0 sm:flex-1 lg:gap-2">
        {BOARDS.map((board) => {
          const result = resultOf(board.id);
          const isUsed = !result && isStarted(board.id);
          return (
            <button
              className={`flex min-w-0 flex-col items-center rounded-2xl border px-1 py-1.5 transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:py-2 ${
                result ? "border-emerald-200 bg-emerald-50 hover:bg-emerald-100" : isUsed ? "border-slate-200 bg-slate-50 hover:bg-slate-100" : "border-cyan-200 bg-cyan-50 hover:bg-cyan-100"
              }`}
              key={board.id}
              onClick={() => (result || isUsed ? setOpenBoard(board.id) : onPlay(dailyChoice(board.id)))}
              type="button"
            >
              <span className="max-w-full truncate text-xs font-bold text-slate-700 lg:text-sm">{board.label}</span>
              <span
                className={`text-xs font-bold tabular-nums lg:text-sm ${result ? "text-emerald-700" : isUsed ? "text-slate-400" : "text-cyan-700"}`}
              >
                {result ? `✓ ${result.score}/${QUESTIONS_PER_ROUND}` : isUsed ? "Bırakıldı" : "Oyna"}
              </span>
            </button>
          );
        })}
      </div>

      {notice && <p className="mt-2 text-center text-xs font-semibold text-rose-600 sm:mt-0 sm:text-left">{notice}</p>}

      {openBoard && <DailyLeaderboardSheet initialBoardId={openBoard} myResults={status?.results ?? []} onClose={() => setOpenBoard(null)} playerId={player?.id} />}
    </section>
  );
}

/** Günün sıralaması: modlar sekmede; oyuncu o modu bitirdiyse üstte sonucu, sırası ve paylaşma tuşu. */
function DailyLeaderboardSheet({
  initialBoardId,
  myResults,
  playerId,
  onClose,
}: {
  initialBoardId: BoardId;
  myResults: DailyResult[];
  playerId: string | undefined;
  onClose: () => void;
}) {
  const [boardId, setBoardId] = useState(initialBoardId);
  const leaderboards = useDailyLeaderboards(true);
  const mine = myResults.find((result) => boardOf(result) === boardId);

  return (
    <BottomSheet description={`${dailyDateLabel()} · her mod ayrı, herkese aynı 10 soru`} onClose={onClose} title="Günün sıralaması">
      {mine && (
        <div className="mb-3 flex shrink-0 items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-emerald-800">Senin sonucun</p>
            <p className="font-display text-lg font-bold text-slate-900 tabular-nums">
              {mine.score}/{QUESTIONS_PER_ROUND} · {formatTime(Math.round(mine.duration_ms / 1000))}
              <span className="ml-2 text-sm font-semibold text-emerald-700">
                {mine.rank}. / {mine.players}
              </span>
            </p>
          </div>
          <div className="w-28 shrink-0">
            <ShareScoreButton isCompact text={dailyShareText(boardId, mine.answers, mine.score, mine.duration_ms)} />
          </div>
        </div>
      )}
      <Leaderboard
        boardId={boardId}
        currentPlayerId={playerId}
        fillHeight
        isLoading={leaderboards === null}
        emptyText="Bugün bu meydan okumayı henüz kimse bitirmedi."
        leaderboardError={null}
        leaderboards={leaderboards ?? { turkey: [], "turkey-plates": [], "world-hard": [], "world-flags": [] }}
        onBoardChange={setBoardId}
        showTitle={false}
      />
    </BottomSheet>
  );
}
