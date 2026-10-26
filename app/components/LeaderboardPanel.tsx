"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { Leaderboard } from "./Leaderboard";
import { useLeaderboards } from "@/lib/hooks/useLeaderboard";
import { type BoardId } from "@/lib/game";
import { messages } from "@/lib/i18n";

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
  const [boardId, setBoardId] = useState<BoardId>(initialBoardId);
  const { leaderboards, leaderboardError, isLoading } = useLeaderboards(supabaseConfigured);

  return (
    <BottomSheet description={messages().leaderboard.panelDescription} onClose={onClose} title={messages().leaderboard.title}>
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
        <p className="py-8 text-center text-sm font-medium text-rose-600">{messages().leaderboard.notConfigured}</p>
      )}
    </BottomSheet>
  );
}
