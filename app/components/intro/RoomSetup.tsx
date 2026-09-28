"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignInPanel } from "../SignInPanel";
import { type BoardVariant, type GameMode, type Player } from "@/lib/game";
import { createRoom } from "@/lib/hooks/useRoom";
import { setLastGame } from "@/lib/intro-preferences";
import {
  ROOM_DURATIONS,
  ROOM_MAX_PLAYERS,
  ROOM_MIN_PLAYERS,
  ROOM_NAME_MAX,
  ROOM_PLAYER_PRESETS,
  ROOM_ROUND_COUNTS,
  roomPath,
  type RoomSettings,
} from "@/lib/room";
import { modeOptions, variantFor } from "./DuelSetup";
import { formatMinutes, gameInfo } from "./games";
import { Field, Segmented, SetupShell } from "./SetupParts";

type RoomSetupProps = {
  map: GameMode;
  player: Player | null;
  supabaseConfigured: boolean;
  onMapChange: (map: GameMode) => void;
  onBack: () => void;
};

type RoomOptions = Omit<RoomSettings, "mode">;

/** Adım 2, Oda: ad, mod, tur sayısı, süre ve katılımcı sınırı. Giriş yoksa önce giriş adımı gelir. */
export function RoomSetup({ map, player, supabaseConfigured, onMapChange, onBack }: RoomSetupProps) {
  const router = useRouter();
  const [options, setOptions] = useState<RoomOptions>({
    name: "",
    variant: "normal",
    roundCount: 3,
    durationMinutes: 30,
    maxPlayers: 10,
  });
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthStep, setIsAuthStep] = useState(false);
  const update = (patch: Partial<RoomOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
    setError(null);
  };
  const variant = variantFor(map, options.variant);

  const validationError = !options.name.trim()
    ? "Odaya bir ad ver."
    : options.maxPlayers < ROOM_MIN_PLAYERS || options.maxPlayers > ROOM_MAX_PLAYERS
      ? `Katılımcı sayısı ${ROOM_MIN_PLAYERS}-${ROOM_MAX_PLAYERS} arasında olmalı.`
      : null;

  const create = async () => {
    if (validationError) return setError(validationError);
    setIsBusy(true);
    setError(null);
    const result = await createRoom({
      ...options,
      mode: map,
      variant,
      name: options.name.trim(),
    });
    if ("error" in result) {
      setError(result.error);
      setIsBusy(false);
      setIsAuthStep(false);
      return;
    }
    setLastGame("room");
    router.push(roomPath(result.code));
  };

  if (isAuthStep && !player) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <SignInPanel
          description="Odada ve sıralamada görünmek için giriş yap; misafir girişi de olur. Giriş yapar yapmaz oda kurulur."
          onCancel={() => setIsAuthStep(false)}
          onSignedIn={() => void create()}
          redirectTo={window.location.origin}
          title={<>👥 Oda kurmak için giriş yap</>}
        />
      </div>
    );
  }

  return (
    <SetupShell
      actionLabel={isBusy ? "Kuruluyor…" : gameInfo("room").action}
      error={error}
      game={gameInfo("room")}
      isActionDisabled={isBusy || !supabaseConfigured}
      map={map}
      note="Her tur 10 soru ve 120 saniye, soruları herkese aynı. Süre sen başlatınca işler; turlar genel sıralamaya da işlenir."
      onAction={() => (player ? void create() : validationError ? setError(validationError) : setIsAuthStep(true))}
      onBack={onBack}
      onMapChange={onMapChange}
    >
      <Field htmlFor="room-name" label="Oda adı">
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          id="room-name"
          maxLength={ROOM_NAME_MAX}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="ör. Cuma akşamı"
          value={options.name}
        />
      </Field>

      <Field label="Mod">
        <Segmented label="Oda modu" onChange={(next: BoardVariant) => update({ variant: next })} options={modeOptions(map)} value={variant} />
      </Field>

      <Field label="Tur sayısı">
        <Segmented
          label="Tur sayısı"
          onChange={(roundCount) => update({ roundCount })}
          options={ROOM_ROUND_COUNTS.map((count) => ({
            id: count,
            label: String(count),
          }))}
          value={options.roundCount}
        />
      </Field>
      <Field label="Süre">
        <Segmented
          label="Oda süresi"
          onChange={(durationMinutes) => update({ durationMinutes })}
          options={ROOM_DURATIONS.map((minutes) => ({
            id: minutes,
            label: formatMinutes(minutes),
          }))}
          value={options.durationMinutes}
        />
      </Field>

      <Field htmlFor="room-max" label="En fazla katılımcı">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            label="Hazır katılımcı sayıları"
            onChange={(maxPlayers) => update({ maxPlayers })}
            options={ROOM_PLAYER_PRESETS.map((preset) => ({
              id: preset,
              label: String(preset),
            }))}
            value={options.maxPlayers as (typeof ROOM_PLAYER_PRESETS)[number]}
          />
          <input
            aria-label="Katılımcı sayısı"
            className="w-16 rounded-lg border border-slate-300 px-2 py-1.5 text-center text-sm font-bold tabular-nums outline-none focus:border-violet-500"
            id="room-max"
            max={ROOM_MAX_PLAYERS}
            min={ROOM_MIN_PLAYERS}
            onChange={(event) => update({ maxPlayers: Number(event.target.value) })}
            type="number"
            value={options.maxPlayers}
          />
        </div>
      </Field>
    </SetupShell>
  );
}
