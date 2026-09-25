import Image from "next/image";
import { BOARDS, formatTime, GAME_DURATION_MS, type BoardId, type LeaderboardEntry } from "@/lib/game";
import { type Leaderboards } from "@/lib/hooks/useLeaderboard";

type LeaderboardProps = {
  leaderboards: Leaderboards;
  boardId: BoardId;
  leaderboardError: string | null;
  currentPlayerId: string | undefined;
  /** Sıralamanın kendi başlığı olan yerlerde (giriş ekranındaki panel) kapatılır. */
  showTitle?: boolean;
  /** Verilmezse yükleniyor mu sorusu, tüm sıralamaların boş olmasından tahmin edilir. */
  isLoading?: boolean;
  /** Liste daha uzun gösterilir (sonuç ekranı, sıralamanın ekranın ana içeriği olduğu yer). */
  tall?: boolean;
  onBoardChange: (boardId: BoardId) => void;
};

/** İlk üç, satır zemini yerine madalya renginde sıra rozetiyle vurgulanır. */
const MEDAL_STYLES: Record<number, string> = {
  1: "bg-amber-100 text-amber-800 ring-1 ring-amber-300",
  2: "bg-slate-200 text-slate-700 ring-1 ring-slate-300",
  3: "bg-orange-100 text-orange-800 ring-1 ring-orange-300",
};

/** Süre alanı eklenmeden önce oynanmış turlara geçiş betiğinin yazdığı değer; süreleri bilinmiyor. */
const UNKNOWN_DURATION_MS = 2147483647;

/**
 * Turun süresi, 0-120 saniyelik bir çubuk olarak. Kısa çubuk daha hızlı demektir; sıralama önce puana
 * baktığı için çubuklar yukarıdan aşağı düzenli uzamaz. Süre, dolan kısmın sağ ucunda yazar.
 */
function DurationBar({ durationMs, isCurrentPlayer }: { durationMs: number; isCurrentPlayer: boolean }) {
  if (durationMs >= UNKNOWN_DURATION_MS) return <span className="text-xs text-slate-400">süre yok</span>;

  const ratio = Math.min(1, Math.max(0, durationMs / GAME_DURATION_MS));
  return (
    <span className="block h-6 w-full rounded-full bg-white">
      <span
        className={`flex h-full min-w-[3.25rem] items-center justify-end rounded-full px-2.5 text-xs font-semibold tabular-nums ${
          isCurrentPlayer ? "bg-cyan-200 text-cyan-900" : "bg-slate-200 text-slate-600"
        }`}
        style={{ width: `${ratio * 100}%` }}
      >
        {formatTime(Math.round(durationMs / 1000))}
      </span>
    </span>
  );
}

function LeaderboardRow({ entry, rank, isCurrentPlayer }: { entry: LeaderboardEntry; rank: number; isCurrentPlayer: boolean }) {
  const isTop = rank <= 3;

  return (
    <li className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${isCurrentPlayer ? "bg-cyan-50" : "bg-slate-50"}`}>
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${isTop ? MEDAL_STYLES[rank] : "text-slate-400"}`}
        >
          {rank}
        </span>
        {entry.avatar_url ? (
          <Image
            alt=""
            className="h-7 w-7 shrink-0 rounded-full border border-slate-200 object-cover"
            height={28}
            referrerPolicy="no-referrer"
            src={entry.avatar_url}
            unoptimized
            width={28}
          />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-500">
            {entry.display_name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className={`truncate ${isTop ? "font-bold text-slate-900" : "font-medium text-slate-700"}`}>{entry.display_name}</span>
        {isCurrentPlayer && (
          <span className="shrink-0 rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">Sen</span>
        )}
      </span>
      {/* Çubuk sabit genişlikte ve puana yaslı: hepsi aynı hizadan başlar, isim kalan alanı kullanır. */}
      <span className="w-28 shrink-0 sm:w-40 xl:w-52" title="Süre (0-120 sn)">
        <DurationBar durationMs={entry.duration_ms} isCurrentPlayer={isCurrentPlayer} />
      </span>
      <span className="w-16 shrink-0 text-right font-bold tabular-nums text-slate-900">{entry.score} puan</span>
    </li>
  );
}

export function Leaderboard({
  leaderboards,
  boardId,
  leaderboardError,
  currentPlayerId,
  showTitle = true,
  isLoading,
  tall = false,
  onBoardChange,
}: LeaderboardProps) {
  const entries = leaderboards[boardId];
  const isEmptyEverywhere = BOARDS.every((board) => leaderboards[board.id].length === 0);
  const isStillLoading = isLoading ?? isEmptyEverywhere;

  return (
    <div>
      <div className={`flex flex-wrap items-center gap-3 ${showTitle ? "justify-between" : "justify-center"}`}>
        {showTitle && <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">Sıralama</p>}
        {/* Dar kartlarda beş sekme sığmazsa alt satıra geçer; köşeler bu yüzden tam yuvarlak değil. */}
        <div className="flex flex-wrap justify-center gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
          {BOARDS.map((board) => (
            <button
              aria-selected={boardId === board.id}
              className={`rounded-full px-3 py-1.5 text-sm font-bold transition sm:px-4 ${boardId === board.id ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-cyan-700"}`}
              key={board.id}
              onClick={() => onBoardChange(board.id)}
              role="tab"
              type="button"
            >
              {board.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`overflow-y-auto pr-1 ${tall ? "mt-4 max-h-[28rem]" : "mt-3 max-h-[20rem]"}`}>
        {leaderboardError ? (
          <p className="py-8 text-center text-sm font-medium text-rose-600">{leaderboardError}</p>
        ) : entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            {isStillLoading ? "Sıralama yükleniyor..." : "Bu haritada henüz sonuç yok."}
          </p>
        ) : (
          <ol className="space-y-1.5">
            {entries.map((entry, index) => (
              <LeaderboardRow entry={entry} isCurrentPlayer={entry.user_id === currentPlayerId} key={entry.user_id} rank={index + 1} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
