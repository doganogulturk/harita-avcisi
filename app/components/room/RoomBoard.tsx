"use client";

import { useEffect, useState } from "react";
import { duelModeLabel } from "@/lib/duel";
import { formatTime } from "@/lib/game";
import { nextRoundOf, type RoomPlayer, type RoomRoundResult, type RoomState } from "@/lib/room";
import { DuelAvatar, SHIMMER_BUTTON } from "../duel/DuelParts";
import { type RoomRoundOutcome } from "./RoomRound";

type RoomBoardProps = {
  state: RoomState;
  playerId: string;
  serverNow: () => number;
  lastOutcome: RoomRoundOutcome | null;
  actionError: string | null;
  isStartingRound: boolean;
  onPlayRound: (round: number) => void;
  onHome: () => void;
};

function useCountdown(endsAt: string | null, serverNow: () => number): number {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(serverNow()), 1000);
    return () => window.clearInterval(timer);
  }, [serverNow]);
  return endsAt ? Math.max(0, Math.ceil((Date.parse(endsAt) - now) / 1000)) : 0;
}

function RoundCell({ result }: { result: RoomRoundResult | undefined }) {
  if (!result) return <span className="text-slate-300">—</span>;
  if (result.status === "playing") return <span className="text-xs font-semibold text-cyan-600">oynuyor…</span>;
  if (result.status === "abandoned") return <span className="text-xs font-semibold text-slate-400" title="Başlatıldı, bitirilmedi">yarım</span>;
  return (
    <span className="font-semibold text-slate-800 tabular-nums" title={formatTime(Math.round(result.duration_ms / 1000))}>
      {result.score}
    </span>
  );
}

/** Oyuncunun kendi turları: bitti, yarım, oynanıyor, sıradaki ya da kilitli. */
function MyRounds({ state, me }: { state: RoomState; me: RoomPlayer | undefined }) {
  const next = nextRoundOf(state, me?.id);
  return (
    <ol className="flex flex-col gap-1.5">
      {Array.from({ length: state.round_count }, (_, index) => {
        const round = index + 1;
        const result = me?.rounds.find((item) => item.round === round);
        const text = !result
          ? round === next && state.status === "playing"
            ? "Sıradaki"
            : "—"
          : result.status === "done"
            ? `✓ ${result.score}/10 · ${formatTime(Math.round(result.duration_ms / 1000))}`
            : result.status === "abandoned"
              ? "Yarım · 0 puan"
              : "Oynanıyor…";
        return (
          <li className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-sm" key={round}>
            <span className="font-bold text-slate-500">Tur {round}</span>
            <span className={`font-semibold tabular-nums ${result?.status === "done" ? "text-emerald-700" : "text-slate-500"}`}>{text}</span>
          </li>
        );
      })}
    </ol>
  );
}

const PODIUM = [
  { place: 2, height: "h-16", medal: "🥈" },
  { place: 1, height: "h-24", medal: "🥇" },
  { place: 3, height: "h-12", medal: "🥉" },
];

function Podium({ players, playerId }: { players: RoomPlayer[]; playerId: string }) {
  return (
    <div className="mb-6 flex items-end justify-center gap-3">
      {PODIUM.map(({ place, height, medal }) => {
        const player = players[place - 1];
        if (!player) return <div className="w-24" key={place} />;
        return (
          <div className="flex w-24 flex-col items-center gap-1.5 text-center lg:w-28" key={place}>
            <span className="text-2xl">{medal}</span>
            <DuelAvatar avatar={player.avatar} name={player.name} size="md" tone={player.id === playerId ? "me" : "opponent"} />
            <span className="w-full truncate text-sm font-bold text-slate-900">{player.name}</span>
            <span className="text-xs font-semibold text-slate-500 tabular-nums">{player.total_score} puan</span>
            <div className={`w-full rounded-t-xl bg-gradient-to-b from-cyan-400 to-cyan-600 ${height}`} />
          </div>
        );
      })}
    </div>
  );
}

/** Başlamış ya da bitmiş oda: solda oyuncunun durumu ve sıradaki turu, sağda canlı oda sıralaması. */
export function RoomBoard({ state, playerId, serverNow, lastOutcome, actionError, isStartingRound, onPlayRound, onHome }: RoomBoardProps) {
  const remainingSeconds = useCountdown(state.ends_at, serverNow);
  const me = state.players.find((player) => player.id === playerId);
  const next = nextRoundOf(state, playerId);
  const isFinished = state.status === "finished";

  return (
    <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[24rem_minmax(0,1fr)] lg:gap-5">
      <aside className="flex flex-col gap-5 rounded-3xl border-2 border-slate-200 bg-white p-5 lg:min-h-0 lg:overflow-y-auto lg:p-7">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">
            👥 {duelModeLabel(state.game_mode, state.variant)} · {state.round_count} tur
          </p>
          <h1 className="mt-2 font-display text-4xl leading-none font-bold text-slate-900">{state.name}</h1>
        </div>

        {isFinished ? (
          <p className="rounded-2xl bg-slate-100 px-4 py-3 text-center font-display text-2xl font-bold text-slate-700">🏁 Oda kapandı</p>
        ) : (
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
            <p className="text-xs text-slate-500">Kalan süre</p>
            <p className={`font-display text-5xl font-bold tabular-nums ${remainingSeconds <= 60 ? "text-rose-600" : "text-slate-900"}`}>
              {formatTime(remainingSeconds)}
            </p>
          </div>
        )}

        {lastOutcome && (
          <p className={`rounded-xl px-4 py-2 text-center text-sm font-semibold ${lastOutcome.saved ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
            {lastOutcome.saved
              ? `Tur ${lastOutcome.round} kaydedildi: ${lastOutcome.score}/10 · ${formatTime(Math.round(lastOutcome.durationMs / 1000))}`
              : lastOutcome.abandoned
                ? `Tur ${lastOutcome.round} bırakıldı; 0 puan sayılır.`
                : `Tur ${lastOutcome.round} kaydedilemedi; 0 puan sayılır.`}
          </p>
        )}

        {state.is_member ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-bold text-slate-900">Turların</p>
            <MyRounds me={me} state={state} />
          </div>
        ) : (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            {state.join_error ?? "Bu odanın oyuncusu değilsin."} Sıralamayı izleyebilirsin.
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2 lg:mt-auto">
          {state.is_member && !isFinished && next !== null && (
            <button className={SHIMMER_BUTTON} disabled={isStartingRound} onClick={() => onPlayRound(next)} type="button">
              ▶ {next}. turu oyna
            </button>
          )}
          {state.is_member && !isFinished && next === null && (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              🎉 Tüm turları oynadın. Sıralama oda kapanınca kesinleşir.
            </p>
          )}
          {actionError && <p className="text-center text-sm font-semibold text-rose-600">{actionError}</p>}
          <button className="text-sm font-semibold text-slate-500 underline-offset-4 hover:text-cyan-700 hover:underline" onClick={onHome} type="button">
            Ana menü
          </button>
        </div>
      </aside>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 lg:min-h-0 lg:overflow-y-auto lg:p-7">
        <p className="mb-4 text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">{isFinished ? "Sonuçlar" : "Oda sıralaması · canlı"}</p>
        {isFinished && <Podium playerId={playerId} players={state.players} />}
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="w-8 pb-2 font-semibold">#</th>
              <th className="pb-2 font-semibold">Oyuncu</th>
              {Array.from({ length: state.round_count }, (_, index) => (
                <th className="w-12 pb-2 text-center font-semibold" key={index}>
                  T{index + 1}
                </th>
              ))}
              <th className="w-16 pb-2 text-right font-semibold">Puan</th>
              <th className="w-16 pb-2 text-right font-semibold">Süre</th>
            </tr>
          </thead>
          <tbody>
            {state.players.map((player, index) => (
              <tr className={`border-t border-slate-100 ${player.id === playerId ? "bg-cyan-50/60" : ""}`} key={player.id}>
                <td className="py-2.5 pl-1 font-bold text-slate-400 tabular-nums">{index + 1}</td>
                <td className="py-2.5">
                  <span className="flex min-w-0 items-center gap-2">
                    <DuelAvatar avatar={player.avatar} name={player.name} tone={player.id === playerId ? "me" : "opponent"} />
                    <span className="truncate font-bold text-slate-900">
                      {player.id === state.host_id && <span title="Oda sahibi">👑 </span>}
                      {player.name}
                    </span>
                    {player.id === playerId && (
                      <span className="shrink-0 rounded-full bg-cyan-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Sen</span>
                    )}
                  </span>
                </td>
                {Array.from({ length: state.round_count }, (_, round) => (
                  <td className="py-2.5 text-center" key={round}>
                    <RoundCell result={player.rounds.find((item) => item.round === round + 1)} />
                  </td>
                ))}
                <td className="py-2.5 text-right font-display text-lg font-bold text-slate-900 tabular-nums">{player.total_score}</td>
                <td className="py-2.5 pr-1 text-right text-xs font-semibold text-slate-500 tabular-nums">
                  {player.rounds.length > 0 ? formatTime(Math.round(player.total_duration_ms / 1000)) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-slate-500">T: tur puanı (10 üzerinden) · yarım: başlatılıp bitirilmedi, 0 sayılır · eşit puanda toplam süre kısa olan önde</p>
      </section>
    </div>
  );
}
