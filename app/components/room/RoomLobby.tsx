"use client";

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

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto rounded-3xl border-2 border-slate-200 bg-white p-5 lg:gap-7 lg:p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">👥 Oda · lobi</p>
        <h1 className="font-display text-4xl font-bold text-slate-900 lg:text-5xl">{state.name}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-cyan-50 px-4 py-1.5 text-sm font-bold text-cyan-800">{duelModeLabel(state.game_mode, state.variant)}</span>
          <span className="rounded-full bg-amber-50 px-4 py-1.5 text-sm font-bold text-amber-800">{state.round_count} tur</span>
          <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">{state.duration_minutes} dakika</span>
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <p className="mb-3 text-center text-sm font-bold text-slate-500">
          Katılanlar <span className="text-slate-900 tabular-nums">{state.players.length}/{state.max_players}</span>
        </p>
        <ul className="flex flex-wrap justify-center gap-3">
          {state.players.map((player) => (
            <li
              className={`flex w-32 flex-col items-center gap-2 rounded-2xl border-2 bg-white p-3 text-center ${player.id === playerId ? "border-sky-300" : "border-slate-200"}`}
              key={player.id}
            >
              <DuelAvatar avatar={player.avatar} name={player.name} size="md" tone={player.id === playerId ? "me" : "opponent"} />
              <span className="w-full truncate text-sm font-bold text-slate-900">
                {player.id === state.host_id && <span title="Oda sahibi">👑 </span>}
                {player.name}
              </span>
            </li>
          ))}
          {Array.from({ length: Math.min(3, state.max_players - state.players.length) }, (_, index) => (
            <li className="flex w-32 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-3 text-slate-300" key={`empty-${index}`}>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl lg:h-16 lg:w-16">?</span>
              <span className="text-xs">Boş yer</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex w-full max-w-md flex-col items-center gap-3">
        {isHost ? (
          <>
            <button className={SHIMMER_BUTTON} disabled={!canStart} onClick={onStart} type="button">
              ▶ Başlat
            </button>
            <p className="text-center text-xs text-slate-500">
              {canStart
                ? `Başlatınca ${state.duration_minutes} dakikalık süre işler ve yeni oyuncu katılamaz.`
                : "Başlatmak için en az 2 oyuncu gerekir; bağlantıyı gönder."}
            </p>
          </>
        ) : (
          <p className="rounded-2xl bg-slate-50 px-5 py-3 text-center text-sm font-semibold text-slate-600">
            Oda sahibinin başlatması bekleniyor. Başlayınca {state.round_count} turu sırayla, istediğin anda oynarsın.
          </p>
        )}
        {actionError && <p className="text-center text-sm font-semibold text-rose-600">{actionError}</p>}
        <p className="text-center text-xs text-slate-500">
          Her tur 10 soru ve 120 saniye; herkese aynı sorular. Oda puanı turların toplamı, eşitlikte toplam süre kısa olan önde. Turlar genel sıralamaya da işlenir.
        </p>
        <ShareCode code={state.code} label="Oda kodu" path={roomPath(state.code)} shareText="Odama gel, birlikte oynayalım!" />
      </div>
    </div>
  );
}
