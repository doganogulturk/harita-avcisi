"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignInPanel } from "../SignInPanel";
import { variantFor } from "@/lib/duel";
import { type BoardVariant, type GameMode, type Player } from "@/lib/game";
import { useIsOnline } from "@/lib/hooks/useIsOnline";
import { messages } from "@/lib/i18n";
import { createRoom } from "@/lib/hooks/useRoom";
import { ROOM_DURATIONS, ROOM_NAME_MAX, ROOM_PLAYER_PRESETS, ROOM_ROUND_COUNTS, roomPath, type RoomSettings } from "@/lib/room";
import { modeOptions, previewPromptFor } from "./DuelSetup";
import { formatMinutes, gameInfo } from "./games";
import { Field, Segmented, SetupShell } from "./SetupParts";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";

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
  // Oda sunucuda kurulur; bağlantı yokken tuş kapalıdır.
  const isOnline = useIsOnline();
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
  // Android geri tuşu giriş adımından ayarlara döner.
  useBackHandler(() => setIsAuthStep(false), BACK_PRIORITY.screen, isAuthStep && !player);
  const update = (patch: Partial<RoomOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
    setError(null);
  };
  const variant = variantFor(map, options.variant);

  const { setup } = messages();
  const validationError = options.name.trim() ? null : setup.room.nameRequired;

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
    router.push(roomPath(result.code));
  };

  if (isAuthStep && !player) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <SignInPanel
          description={setup.room.signInDescription}
          onCancel={() => setIsAuthStep(false)}
          onSignedIn={() => void create()}
          redirectTo={window.location.origin}
          title={setup.room.signInTitle}
        />
      </div>
    );
  }

  return (
    <SetupShell
      actionLabel={!isOnline ? setup.offline : isBusy ? setup.creating : player ? gameInfo("room").action : setup.signInAndCreate}
      error={error}
      game={gameInfo("room")}
      isActionDisabled={isBusy || !supabaseConfigured || !isOnline}
      map={map}
      mode={variant}
      modes={modeOptions(map)}
      onModeChange={(next) => update({ variant: next as BoardVariant })}
      previewPrompt={previewPromptFor(variant)}
      note={setup.room.note}
      onAction={() => (player ? void create() : validationError ? setError(validationError) : setIsAuthStep(true))}
      onBack={onBack}
      onMapChange={onMapChange}
    >
      <Field htmlFor="room-name" label={setup.room.name}>
        <input
          className="w-full rounded-xl border border-slate-300 px-4 py-2 outline-none short:px-3 short:py-1.5 short:text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          autoComplete="off"
          enterKeyHint="done"
          id="room-name"
          maxLength={ROOM_NAME_MAX}
          onChange={(event) => update({ name: event.target.value })}
          placeholder={setup.room.namePlaceholder}
          value={options.name}
        />
      </Field>

      <Field label={setup.room.rounds}>
        <Segmented
          label={setup.room.rounds}
          onChange={(roundCount) => update({ roundCount })}
          options={ROOM_ROUND_COUNTS.map((count) => ({
            id: count,
            label: String(count),
          }))}
          value={options.roundCount}
        />
      </Field>
      <Field label={setup.room.duration}>
        <Segmented
          label={setup.room.duration}
          onChange={(durationMinutes) => update({ durationMinutes })}
          options={ROOM_DURATIONS.map((minutes) => ({
            id: minutes,
            label: formatMinutes(minutes),
          }))}
          value={options.durationMinutes}
        />
      </Field>

      <Field label={setup.room.maxPlayers}>
        <Segmented
          label={setup.room.maxPlayers}
          onChange={(maxPlayers) => update({ maxPlayers })}
          options={ROOM_PLAYER_PRESETS.map((preset) => ({ id: preset, label: String(preset) }))}
          value={options.maxPlayers as (typeof ROOM_PLAYER_PRESETS)[number]}
        />
      </Field>
    </SetupShell>
  );
}
