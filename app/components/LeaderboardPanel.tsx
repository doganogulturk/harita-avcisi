"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "./Leaderboard";
import { useLeaderboards } from "@/lib/hooks/useLeaderboard";
import { type BoardId } from "@/lib/game";

type LeaderboardPanelProps = {
  /** Panel açılırken öne gelen sekme; oyuncunun o an seçtiği tur. */
  initialBoardId: BoardId;
  currentPlayerId: string | undefined;
  supabaseConfigured: boolean;
  onClose: () => void;
};

/**
 * Giriş ekranından açılan sıralama. Tur oynamadan da bakılabilsin diye ayrı bir katman:
 * oyun sırasında açılmaz, çünkü yarışta süre işlerken sıralamaya bakmak puan kaybettirir.
 */
export function LeaderboardPanel({ initialBoardId, currentPlayerId, supabaseConfigured, onClose }: LeaderboardPanelProps) {
  const [boardId, setBoardId] = useState<BoardId>(initialBoardId);
  const { leaderboards, leaderboardError, isLoading } = useLeaderboards(supabaseConfigured);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Sıralamayı kapat" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} tabIndex={-1} type="button" />

      <div
        aria-labelledby="leaderboard-title"
        aria-modal="true"
        className="relative flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-7"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl leading-none font-bold text-slate-900" id="leaderboard-title">
              Sıralama
            </h2>
            <p className="mt-2 text-sm text-slate-500">Her turun kendi sıralaması var. Eşit puanda hızlı olan önde.</p>
          </div>
          <button
            aria-label="Kapat"
            autoFocus
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
          {supabaseConfigured ? (
            <Leaderboard
              boardId={boardId}
              currentPlayerId={currentPlayerId}
              leaderboardError={leaderboardError}
              isLoading={isLoading}
              leaderboards={leaderboards}
              onBoardChange={setBoardId}
              showTitle={false}
            />
          ) : (
            <p className="py-8 text-center text-sm font-medium text-rose-600">Sıralamayı görmek için Supabase bağlantısı yapılandırılmalıdır.</p>
          )}
        </div>
      </div>
    </div>
  );
}
