"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Logo } from "../Logo";
import { AccountMenu } from "../AccountMenu";
import { PlayTips } from "../PlayTips";
import { SignInPanel } from "../SignInPanel";
import { duelPath, type DuelSettings } from "@/lib/duel";
import { useDuel } from "@/lib/hooks/useDuel";
import { setPlayTipsSeen, usePlayTipsSeen } from "@/lib/intro-preferences";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useIsPortraitPhone } from "@/lib/orientation";
import { getSupabaseClient } from "@/lib/supabase";
import { DuelGame } from "./DuelGame";
import { DuelLobby } from "./DuelLobby";
import { DuelResult } from "./DuelResult";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";

/** Düellonun çerçevesi; bağlantı, giriş, lobi, oyun ve sonuç ekranları dikeyde de kullanılır. */
function Shell({ children, header }: { children: React.ReactNode; header?: React.ReactNode }) {
  return (
    <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
      {header}
      {children}
    </main>
  );
}

function Message({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mx-auto my-auto w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white p-8 text-center">
      <p className="font-display text-2xl font-bold text-slate-900">{title}</p>
      {children}
    </div>
  );
}

/** /duello?kod=…: giriş, lobi, oyun ve sonuç tek sayfada; hangisinin görüneceğini sunucudaki durum belirler. */
/** Kodu adresin sorgu dizgisinden okur; sayfa statik olduğu için kod derlemede bilinemez. */
export function DuelScreenFromQuery() {
  const code = useSearchParams().get("kod") ?? "";
  return <DuelScreen code={code.toUpperCase()} />;
}

export function DuelScreen({ code }: { code: string }) {
  const router = useRouter();
  const [player, setPlayer, isPlayerLoaded] = usePlayer();
  const { state, fatalError, connectionError, serverNow, setReady, answer, requestRematch, declineRematch } = useDuel(code, player);
  const [isRequestingRematch, setIsRequestingRematch] = useState(false);
  const supabaseConfigured = getSupabaseClient() !== null;
  // Dikey telefonda ilk oyundan önceki ipuçları düelloda lobide gösterilir: geri sayım sunucuda işler, oyun sırasında
  // gösterilirse süreden yer. Yön kilidi lobide konmaz; oyun başlamazsa menülerde kalırdı.
  const isTipsSeen = usePlayTipsSeen();
  const isPortrait = useIsPortraitPhone();

  const goHome = () => router.push("/");
  const exitDuel = () => {
    if (window.confirm("Düellodan çıkarsan ve 30 saniye içinde dönmezsen hükmen kaybedersin. Çıkmak istiyor musun?")) goHome();
  };
  // Android geri tuşu oyun sırasında çıkış tuşuyla aynı işi yapar (onay sorar); lobide ve sonuçta geçmişte geri gidilir.
  useBackHandler(exitDuel, BACK_PRIORITY.screen, state?.status === "playing");

  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    setPlayer(null);
    goHome();
  };

  const header = (
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
      <button aria-label="Ana sayfa" onClick={goHome} type="button">
        <Logo isHeading={false} />
      </button>
      <AccountMenu onSignOut={signOut} player={player} />
    </header>
  );

  const body = (children: React.ReactNode) => (
    <Shell header={header}>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-3 lg:overflow-hidden lg:px-8 lg:py-5">{children}</div>
    </Shell>
  );

  if (!supabaseConfigured) return body(<Message title="Düello için Supabase bağlantısı yapılandırılmalıdır." />);
  if (!isPlayerLoaded) return body(<Message title="Yükleniyor…" />);

  if (!player) {
    return body(
      <div className="mx-auto my-auto w-full max-w-2xl">
        <SignInPanel
          description="Rakibin seni görebilsin diye giriş yap; misafir girişi de olur. Düello genel sıralamaya işlenmez."
          onCancel={goHome}
          onSignedIn={setPlayer}
          title={
            <>
              ⚔️ <span className="text-cyan-700">Düello</span> daveti · kod {code.toUpperCase()}
            </>
          }
        />
      </div>,
    );
  }

  if (fatalError) {
    return body(
      <Message title={fatalError}>
        <button className="mt-4 font-semibold text-cyan-700 underline-offset-4 hover:underline" onClick={goHome} type="button">
          Ana sayfaya dön
        </button>
      </Message>,
    );
  }

  if (!state) return body(<Message title="Düelloya bağlanılıyor…" />);

  const onRematch = async (settings: DuelSettings) => {
    setIsRequestingRematch(true);
    const nextCode = await requestRematch(settings);
    setIsRequestingRematch(false);
    if (nextCode) router.push(duelPath(nextCode));
  };

  const warning = connectionError && (
    <p className="shrink-0 rounded-xl bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-800">{connectionError}</p>
  );

  if (state.status === "playing") {
    return (
      <Shell>
        {warning}
        <DuelGame
          onAnswer={(position, selected) => void answer(position, selected)}
          onExit={exitDuel}
          serverNow={serverNow}
          state={state}
        />
      </Shell>
    );
  }

  return body(
    <>
      {warning}
      {state.status === "lobby" ? (
        <>
          <DuelLobby onReady={(ready) => void setReady(ready)} state={state} />
          {isPortrait && !isTipsSeen && <PlayTips canLockLandscape={false} onDone={setPlayTipsSeen} />}
        </>
      ) : (
        <DuelResult
          isRequestingRematch={isRequestingRematch}
          onAcceptRematch={(nextCode) => router.push(duelPath(nextCode))}
          onDeclineRematch={() => void declineRematch()}
          onHome={goHome}
          onRematch={(settings) => void onRematch(settings)}
          state={state}
        />
      )}
    </>,
  );
}
