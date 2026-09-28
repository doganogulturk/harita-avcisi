"use client";

import { useState, useSyncExternalStore } from "react";
import { DUEL_QUESTION_MS, DUEL_QUESTIONS, DUEL_RULES, duelModeLabel, duelPath, duelSides, type DuelPlayer, type DuelState } from "@/lib/duel";
import { DuelAvatar, SHIMMER_BUTTON, type DuelTone } from "./DuelParts";

const CARD_TONE: Record<DuelTone, string> = {
  me: "border-sky-300 shadow-sky-500/15",
  opponent: "border-orange-300 shadow-orange-500/15",
};

function PlayerCard({ player, tone }: { player: DuelPlayer; tone: DuelTone }) {
  return (
    <div className={`flex w-full max-w-72 flex-col items-center gap-3 rounded-3xl border-2 bg-white p-6 shadow-xl lg:gap-4 lg:p-8 ${CARD_TONE[tone]}`}>
      <DuelAvatar avatar={player.avatar} name={player.name} size="lg" tone={tone} />
      <p className="max-w-full truncate font-display text-2xl font-bold text-slate-900 lg:text-3xl">{player.name}</p>
      {player.ready ? (
        <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-bold text-emerald-700">✓ Hazır</span>
      ) : player.online ? (
        <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-500">Hazırlanıyor…</span>
      ) : (
        <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-700">Bağlantı bekleniyor…</span>
      )}
    </div>
  );
}

function WaitingCard() {
  return (
    <div className="flex w-full max-w-72 flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center lg:gap-4 lg:p-8">
      <span className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-slate-200 text-3xl text-slate-400 lg:h-24 lg:w-24">?</span>
      <p className="font-display text-2xl font-bold text-slate-400 lg:text-3xl">Rakip bekleniyor</p>
      <span className="text-sm text-slate-500">Bağlantıyı gönder, açınca burada görünür.</span>
    </div>
  );
}

const noSubscription = () => () => {};

/** Düello kodu ve paylaşma: bağlantıyı kopyalama, telefonda paylaşma menüsü. */
function ShareCode({ code }: { code: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const url = typeof window === "undefined" ? duelPath(code) : `${window.location.origin}${duelPath(code)}`;
  // Paylaşma menüsü tarayıcıya bağlı; sunucuda çizilen ilk halde yok sayılır, uyuşmazlık olmaz.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Pano kullanılamıyorsa kod ekranda zaten okunuyor.
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
      Düello kodu
      <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-lg font-bold tracking-[0.3em] text-slate-900">{code}</span>
      <button className="font-semibold text-cyan-700 underline-offset-4 hover:underline" onClick={copy} type="button">
        {isCopied ? "✓ Kopyalandı" : "Bağlantıyı kopyala"}
      </button>
      {canShare && (
        <button
          className="font-semibold text-cyan-700 underline-offset-4 hover:underline"
          onClick={() => void navigator.share({ title: "Harita Avcısı düellosu", text: "Benimle düello yap!", url }).catch(() => {})}
          type="button"
        >
          Paylaş
        </button>
      )}
    </div>
  );
}

export function DuelLobby({ state, onReady }: { state: DuelState; onReady: (ready: boolean) => void }) {
  const { me, opponent } = duelSides(state);
  if (!me) return null;
  const rule = DUEL_RULES[state.rule];

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto rounded-3xl border-2 border-slate-200 bg-white p-5 lg:gap-8 lg:p-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-cyan-50 px-4 py-1.5 text-sm font-bold text-cyan-800">{duelModeLabel(state.game_mode, state.variant)}</span>
        <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-800" title={rule.summary}>
          {rule.icon} {rule.label}
        </span>
        <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">
          {DUEL_QUESTIONS} soru · {DUEL_QUESTION_MS / 1000} sn
        </span>
      </div>

      <div className="flex w-full items-center justify-center gap-4 lg:gap-10">
        <PlayerCard player={me} tone="me" />
        <span className="bg-gradient-to-br from-sky-500 via-cyan-500 to-orange-500 bg-clip-text font-display text-5xl font-bold text-transparent lg:text-7xl">VS</span>
        {opponent ? <PlayerCard player={opponent} tone="opponent" /> : <WaitingCard />}
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        {me.ready ? (
          <button
            className="w-full rounded-2xl border-2 border-emerald-500 bg-emerald-50 py-3.5 font-display text-lg font-bold text-emerald-700 transition hover:bg-emerald-100 lg:text-xl"
            onClick={() => onReady(false)}
            title="Hazır değilim"
            type="button"
          >
            ✓ Hazırsın{opponent ? ` · ${opponent.name} bekleniyor` : " · rakip bekleniyor"}
          </button>
        ) : (
          <button className={SHIMMER_BUTTON} onClick={() => onReady(true)} type="button">
            Hazırım
          </button>
        )}
        <p className="text-center text-xs text-slate-500">İkiniz de hazır olunca 3 saniyelik geri sayımla başlar. Düello genel sıralamaya işlenmez.</p>
        <ShareCode code={state.code} />
      </div>
    </div>
  );
}
