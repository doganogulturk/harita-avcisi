"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
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
 * Telefonda ekranın altından açılan ve tam genişliği kullanan bir sayfadır; geniş ekranda ortada bir penceredir.
 */
export function LeaderboardPanel({ initialBoardId, currentPlayerId, supabaseConfigured, onClose }: LeaderboardPanelProps) {
  const [boardId, setBoardId] = useState<BoardId>(initialBoardId);
  const { leaderboards, leaderboardError, isLoading } = useLeaderboards(supabaseConfigured);

  return (
    <BottomSheet description="Her turun kendi sıralaması var. Eşit puanda hızlı olan önde." onClose={onClose} title="Sıralama">
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
    </BottomSheet>
  );
}
