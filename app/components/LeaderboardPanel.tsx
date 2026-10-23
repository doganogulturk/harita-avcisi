"use client";

import { useEffect, useState } from "react";
import { Leaderboard } from "./Leaderboard";
import { useLeaderboards } from "@/lib/hooks/useLeaderboard";
import { type BoardId } from "@/lib/game";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";

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
 * Telefonda ekranın altından açılan ve tam genişliği kullanan bir sayfadır; geniş ekranda ortada bir penceredir.
 */
export function LeaderboardPanel({ initialBoardId, currentPlayerId, supabaseConfigured, onClose }: LeaderboardPanelProps) {
  useBackHandler(onClose, BACK_PRIORITY.dialog);
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button aria-label="Sıralamayı kapat" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} tabIndex={-1} type="button" />

      <div
        aria-labelledby="leaderboard-title"
        aria-modal="true"
        className="sheet-up relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-900/20 sm:max-h-full sm:max-w-2xl sm:rounded-3xl sm:p-7 sm:[animation:none]"
        role="dialog"
      >
        {/* Alttan açılan sayfanın tutamacı: sayfanın kapatılabilir bir katman olduğunu gösterir. */}
        <span aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl leading-none font-bold text-slate-900 sm:text-3xl" id="leaderboard-title">
              Sıralama
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 sm:mt-2">Her turun kendi sıralaması var. Eşit puanda hızlı olan önde.</p>
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

        <div className="mt-4 flex min-h-0 flex-1 flex-col sm:mt-5">
          {supabaseConfigured ? (
            <Leaderboard
              boardId={boardId}
              fillHeight
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
