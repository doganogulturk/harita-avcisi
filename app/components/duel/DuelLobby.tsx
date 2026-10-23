"use client";

import { DUEL_QUESTION_MS, DUEL_QUESTIONS, DUEL_RULES, duelModeLabel, duelPath, duelSides, type DuelPlayer, type DuelState } from "@/lib/duel";
import { DuelAvatar, SHIMMER_BUTTON, ShareCode, type DuelTone } from "./DuelParts";

const CARD_TONE: Record<DuelTone, string> = {
  me: "border-sky-300 shadow-sky-500/15",
  opponent: "border-orange-300 shadow-orange-500/15",
};

/**
 * İki kart ve "VS" yan yana durur. Kartlar alanı eşit paylaşır ve içeriklerinden dar olabilir (min-w-0); dikey telefonda
 * iç boşluk, avatar ve yazılar küçülür, uzun ad kısalır. Aksi halde kartlar ekrandan taşıyordu.
 */
const CARD_SIZE =
  "flex min-w-0 max-w-72 flex-1 flex-col items-center gap-2 rounded-3xl border-2 p-3 sm:gap-3 sm:p-6 lg:gap-4 lg:p-8";
const STATUS_PILL = "max-w-full truncate rounded-full px-3 py-1 text-xs font-bold sm:px-4 sm:py-1.5 sm:text-sm";

function PlayerCard({ player, tone }: { player: DuelPlayer; tone: DuelTone }) {
  return (
    <div className={`${CARD_SIZE} bg-white shadow-xl ${CARD_TONE[tone]}`}>
      <DuelAvatar avatar={player.avatar} name={player.name} size="lobby" tone={tone} />
      <p className="max-w-full truncate font-display text-lg font-bold text-slate-900 sm:text-2xl lg:text-3xl">{player.name}</p>
      {player.ready ? (
        <span className={`${STATUS_PILL} bg-emerald-100 text-emerald-700`}>✓ Hazır</span>
      ) : player.online ? (
        <span className={`${STATUS_PILL} bg-slate-100 text-slate-500`}>Hazırlanıyor…</span>
      ) : (
        <span className={`${STATUS_PILL} bg-amber-50 text-amber-700`}>Bağlantı bekleniyor…</span>
      )}
    </div>
  );
}

function WaitingCard() {
  return (
    <div className={`${CARD_SIZE} border-dashed border-slate-300 bg-slate-50 text-center`}>
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-slate-200 text-2xl text-slate-400 sm:h-20 sm:w-20 sm:text-3xl lg:h-24 lg:w-24">
        ?
      </span>
      <p className="font-display text-lg leading-tight font-bold text-slate-400 sm:text-2xl lg:text-3xl">Rakip bekleniyor</p>
      <span className="text-xs text-slate-500 sm:text-sm">Bağlantıyı gönder, açınca burada görünür.</span>
    </div>
  );
}

export function DuelLobby({ state, onReady }: { state: DuelState; onReady: (ready: boolean) => void }) {
  const { me, opponent } = duelSides(state);
  if (!me) return null;
  const rule = DUEL_RULES[state.rule];

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 overflow-y-auto rounded-3xl border-2 border-slate-200 bg-white p-4 sm:p-5 lg:gap-8 lg:p-8">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full bg-cyan-50 px-4 py-1.5 text-sm font-bold text-cyan-800">{duelModeLabel(state.game_mode, state.variant)}</span>
        <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-800" title={rule.summary}>
          {rule.icon} {rule.label}
        </span>
        <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">
          {DUEL_QUESTIONS} soru · {DUEL_QUESTION_MS / 1000} sn
        </span>
      </div>

      <div className="flex w-full items-center justify-center gap-2 sm:gap-4 lg:gap-10">
        <PlayerCard player={me} tone="me" />
        <span className="shrink-0 bg-gradient-to-br from-sky-500 via-cyan-500 to-orange-500 bg-clip-text font-display text-3xl font-bold text-transparent sm:text-5xl lg:text-7xl">
          VS
        </span>
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
        <ShareCode code={state.code} label="Düello kodu" path={duelPath(state.code)} shareText="Benimle düello yap!" />
      </div>
    </div>
  );
}
