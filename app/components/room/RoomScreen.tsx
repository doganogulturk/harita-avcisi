"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Logo } from "../Logo";
import { AccountMenu } from "../AccountMenu";
import { PlayTips } from "../PlayTips";
import { SignInPanel } from "../SignInPanel";
import { readPlayTipsSeen, setPlayTipsSeen } from "@/lib/intro-preferences";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { canLockLandscape, isPortraitPhoneNow, releaseLandscapeLock } from "@/lib/orientation";
import { useRoom } from "@/lib/hooks/useRoom";
import { getSupabaseClient } from "@/lib/supabase";
import { RoomBoard } from "./RoomBoard";
import { RoomLobby } from "./RoomLobby";
import { RoomRound, type RoomRoundOutcome } from "./RoomRound";

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto my-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white p-8 text-center">
      <p className="font-display text-2xl font-bold text-slate-900">{title}</p>
      {children}
    </div>
  );
}

/** /oda?kod=…: giriş, lobi, oda panosu ve odadaki tur tek sayfada; hangisinin görüneceğini sunucudaki durum belirler. */
/** Kodu adresin sorgu dizgisinden okur; sayfa statik olduğu için kod derlemede bilinemez. */
export function RoomScreenFromQuery() {
  const code = useSearchParams().get("kod") ?? "";
  return <RoomScreen code={code.toUpperCase()} />;
}

export function RoomScreen({ code }: { code: string }) {
  const router = useRouter();
  const [player, setPlayer, isPlayerLoaded] = usePlayer();
  const { state, fatalError, actionError, serverNow, startRoom, startRound, refresh, setIsPaused } = useRoom(code, player);
  const [activeRound, setActiveRound] = useState<{ round: number; roundId: string; questions: string[] } | null>(null);
  const [lastOutcome, setLastOutcome] = useState<RoomRoundOutcome | null>(null);
  const [isStartingRound, setIsStartingRound] = useState(false);

  const goHome = () => router.push("/");
  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    setPlayer(null);
    goHome();
  };

  // Dikey telefonda ilk oyundan önce ipuçları bir kez gösterilir; tur sunucuda ipuçları kapanınca başlatılır.
  const [tipsRound, setTipsRound] = useState<number | null>(null);
  const requestRound = (round: number) => {
    if (isPortraitPhoneNow() && !readPlayTipsSeen()) setTipsRound(round);
    else void playRound(round);
  };

  const playRound = async (round: number) => {
    setIsStartingRound(true);
    const started = await startRound(round);
    setIsStartingRound(false);
    // İpuçlarındaki "Yatay moda geç" ile konan kilit, tur açılamadıysa menülerde kalmasın.
    if (!started) return releaseLandscapeLock();
    setIsPaused(true);
    setActiveRound({ round, ...started });
  };

  const finishRound = useCallback(
    (outcome: RoomRoundOutcome) => {
      setLastOutcome(outcome);
      setActiveRound(null);
      setIsPaused(false);
      void refresh();
    },
    [refresh, setIsPaused],
  );

  const shell = (children: React.ReactNode) => (
    <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
        <button aria-label="Ana sayfa" onClick={goHome} type="button">
          <Logo isHeading={false} />
        </button>
        <AccountMenu onSignOut={signOut} player={player} />
      </header>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 lg:overflow-hidden lg:px-8 lg:py-5">{children}</div>
      {tipsRound !== null && (
        <PlayTips
          canLockLandscape={canLockLandscape()}
          onCancel={() => setTipsRound(null)}
          onDone={() => {
            setPlayTipsSeen();
            setTipsRound(null);
            void playRound(tipsRound);
          }}
        />
      )}
    </main>
  );

  if (!getSupabaseClient()) return shell(<Message title="Oda için Supabase bağlantısı yapılandırılmalıdır." />);
  if (!isPlayerLoaded) return shell(<Message title="Yükleniyor…" />);

  if (!player) {
    return shell(
      <div className="mx-auto my-auto w-full max-w-2xl">
        <SignInPanel
          description="Sıralamada görünmek için giriş yap; misafir girişi de olur. Oda turları genel sıralamaya da işlenir."
          onCancel={goHome}
          onSignedIn={setPlayer}
          title={
            <>
              👥 <span className="text-cyan-700">Oda</span> daveti · kod {code.toUpperCase()}
            </>
          }
        />
      </div>,
    );
  }

  if (fatalError) {
    return shell(
      <Message title={fatalError}>
        <button className="mt-4 font-semibold text-cyan-700 underline-offset-4 hover:underline" onClick={goHome} type="button">
          Ana sayfaya dön
        </button>
      </Message>,
    );
  }

  if (!state) return shell(<Message title="Odaya bağlanılıyor…" />);

  if (activeRound) {
    return (
      <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
        <RoomRound
          onDone={finishRound}
          onSignOut={signOut}
          player={player}
          questionIds={activeRound.questions}
          round={activeRound.round}
          roundId={activeRound.roundId}
          state={state}
        />
      </main>
    );
  }

  if (state.status === "lobby" && state.is_member) {
    return shell(<RoomLobby actionError={actionError} onStart={() => void startRoom()} playerId={player.id} state={state} />);
  }

  return shell(
    <RoomBoard
      actionError={actionError}
      isStartingRound={isStartingRound}
      lastOutcome={lastOutcome}
      onHome={goHome}
      onPlayRound={requestRound}
      playerId={player.id}
      serverNow={serverNow}
      state={state}
    />,
  );
}
