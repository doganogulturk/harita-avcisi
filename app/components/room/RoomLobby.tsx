"use client";

import { messages } from "@/lib/i18n";
import { duelModeLabel } from "@/lib/duel";
import { roomPath, type RoomState } from "@/lib/room";
import { DuelAvatar, SHIMMER_BUTTON, ShareCode } from "../duel/DuelParts";

type RoomLobbyProps = {
  state: RoomState;
  playerId: string;
  actionError: string | null;
  onStart: () => void;
};

/** Oda lobisi: katılanlar toplanır, oda sahibi "Başlat" deyince süre işler. Katılım yalnızca burada açık. */
export function RoomLobby({ state, playerId, actionError, onStart }: RoomLobbyProps) {
  const isHost = state.host_id === playerId;
  const canStart = state.players.length >= 2;
  const room = messages().room;

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto rounded-3xl border-2 border-slate-200 bg-white p-5 lg:gap-7 lg:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">{room.lobby}</p>
        <h1 className="font-display text-4xl font-bold text-slate-900 lg:text-5xl">{state.name}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-cyan-50 px-4 py-1.5 text-sm font-bold text-cyan-800">{duelModeLabel(state.game_mode, state.variant)}</span>
          <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-800">{room.rounds(state.round_count)}</span>
          <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">{room.minutes(state.duration_minutes)}</span>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <p className="mb-3 text-center text-sm font-bold text-slate-500">
          {room.players} <span className="text-slate-900 tabular-nums">{state.players.length}/{state.max_players}</span>
        </p>
        <ul className="flex flex-wrap justify-center gap-3">
          {state.players.map((player) => (
            <li
              className={`flex w-32 flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3 text-center ${player.id === playerId ? "border-sky-300" : "border-slate-200"}`}
              key={player.id}
            >
              <DuelAvatar avatar={player.avatar} name={player.name} size="md" tone={player.id === playerId ? "me" : "opponent"} />
              <span className="w-full truncate text-sm font-bold text-slate-900">
                {player.id === state.host_id && <span title={room.host}>👑 </span>}
                {player.name}
              </span>
            </li>
          ))}
          {Array.from({ length: Math.min(3, state.max_players - state.players.length) }, (_, index) => (
            <li className="flex w-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-3 text-slate-300" key={`empty-${index}`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl lg:h-16 lg:w-16">?</span>
              <span className="text-xs">{room.emptySlot}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        {isHost ? (
          <>
            <button className={SHIMMER_BUTTON} disabled={!canStart} onClick={onStart} type="button">
              {room.start}
            </button>
            <p className="text-center text-xs text-slate-500">
              {canStart ? room.startNote(state.duration_minutes) : room.needPlayers}
            </p>
          </>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-5 py-3 text-center text-sm font-semibold text-slate-600">
            {room.waitingHost(state.round_count)}
          </p>
        )}
        {actionError && <p className="text-center text-sm font-semibold text-rose-600">{actionError}</p>}
        <p className="text-center text-xs text-slate-500">
          {room.rules}
        </p>
        <ShareCode code={state.code} label={room.code} path={roomPath(state.code)} shareText={room.shareText} />
      </div>
    </div>
  );
}
