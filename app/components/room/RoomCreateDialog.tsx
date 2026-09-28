"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { SignInPanel } from "../SignInPanel";
import { type Player } from "@/lib/game";
import { createRoom } from "@/lib/hooks/useRoom";
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
import { ModePicker, SHIMMER_BUTTON } from "../duel/DuelParts";

type RoomCreateDialogProps = {
  player: Player | null;
  supabaseConfigured: boolean;
  onClose: () => void;
};

function Choice<T extends number>({ label, options, value, format, onChange }: { label: string; options: readonly T[]; value: T; format: (value: T) => string; onChange: (value: T) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-900">{label}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {options.map((option) => (
          <button
            aria-checked={value === option}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${
              value === option ? "bg-cyan-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
            }`}
            key={option}
            onClick={() => onChange(option)}
            role="radio"
            type="button"
          >
            {format(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Giriş ekranından açılan pencere: oda kur ya da elindeki kodla katıl. */
export function RoomCreateDialog({ player, supabaseConfigured, onClose }: RoomCreateDialogProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<RoomSettings>({
    name: "",
    mode: "turkey",
    variant: "normal",
    roundCount: 3,
    durationMinutes: 30,
    maxPlayers: 10,
  });
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthStep, setIsAuthStep] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const update = (patch: Partial<RoomSettings>) => setSettings((current) => ({ ...current, ...patch }));

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const validationError = !settings.name.trim()
    ? "Odaya bir ad ver."
    : settings.maxPlayers < ROOM_MIN_PLAYERS || settings.maxPlayers > ROOM_MAX_PLAYERS
      ? `Katılımcı sayısı ${ROOM_MIN_PLAYERS}-${ROOM_MAX_PLAYERS} arasında olmalı.`
      : null;

  const create = async () => {
    if (validationError) return setError(validationError);
    setIsBusy(true);
    setError(null);
    const result = await createRoom({ ...settings, name: settings.name.trim() });
    if ("error" in result) {
      setError(result.error);
      setIsBusy(false);
      return;
    }
    router.push(roomPath(result.code));
  };

  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length === 6) router.push(roomPath(code));
    else setError("Oda kodu 6 karakterdir.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Oda penceresini kapat" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} tabIndex={-1} type="button" />

      <div
        aria-labelledby="room-title"
        aria-modal="true"
        className="relative flex max-h-full w-full max-w-3xl flex-col overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">Arkadaş grubu · aynı sorular · oda sıralaması</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-slate-900 sm:text-4xl" id="room-title">
              👥 Oda kur
            </h2>
          </div>
          <button
            aria-label="Kapat"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isAuthStep && !player ? (
          <div className="mt-5">
            <SignInPanel
              description="Odada ve sıralamada görünmek için giriş yap; misafir girişi de olur. Giriş yapar yapmaz oda kurulur."
              onCancel={() => setIsAuthStep(false)}
              onSignedIn={() => void create()}
              redirectTo={window.location.origin}
              title={<>👥 Oda kurmak için giriş yap</>}
            />
          </div>
        ) : (
          <>
            <div className="mt-6 flex flex-col gap-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-900" htmlFor="room-name">
                  Oda adı
                </label>
                <input
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  id="room-name"
                  maxLength={ROOM_NAME_MAX}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="ör. Cuma akşamı"
                  value={settings.name}
                />
              </div>
              <ModePicker mode={settings.mode} onChange={(mode, variant) => update({ mode, variant })} variant={settings.variant} />
              <div className="grid gap-5 sm:grid-cols-3">
                <Choice format={(value) => `${value} tur`} label="Tur sayısı" onChange={(roundCount) => update({ roundCount })} options={ROOM_ROUND_COUNTS} value={settings.roundCount} />
                <Choice format={(value) => (value === 60 ? "1 saat" : `${value} dk`)} label="Süre" onChange={(durationMinutes) => update({ durationMinutes })} options={ROOM_DURATIONS} value={settings.durationMinutes} />
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-900" htmlFor="room-max">
                    En fazla katılımcı
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {ROOM_PLAYER_PRESETS.map((preset) => (
                      <button
                        className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${
                          settings.maxPlayers === preset ? "bg-cyan-600 text-white shadow-sm" : "border border-slate-200 text-slate-600 hover:border-cyan-300"
                        }`}
                        key={preset}
                        onClick={() => update({ maxPlayers: preset })}
                        type="button"
                      >
                        {preset}
                      </button>
                    ))}
                    <input
                      aria-label="Katılımcı sayısı"
                      className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center text-sm font-bold tabular-nums outline-none focus:border-cyan-500"
                      id="room-max"
                      max={ROOM_MAX_PLAYERS}
                      min={ROOM_MIN_PLAYERS}
                      onChange={(event) => update({ maxPlayers: Number(event.target.value) })}
                      type="number"
                      value={settings.maxPlayers}
                    />
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-5 text-center text-xs text-slate-500">
              Her tur 10 soru ve 120 saniye; her turun soruları herkese aynı. Süre sen başlatınca işler, katılım yalnızca lobide açık. Turlar genel sıralamaya da işlenir.
            </p>
            {error && <p className="mt-3 text-center text-sm font-semibold text-rose-600">{error}</p>}
            <button
              className={`${SHIMMER_BUTTON} mt-3`}
              disabled={isBusy || !supabaseConfigured}
              onClick={() => (player ? void create() : validationError ? setError(validationError) : setIsAuthStep(true))}
              type="button"
            >
              {isBusy ? "Kuruluyor…" : "Odayı kur →"}
            </button>

            <form className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-5 text-sm" onSubmit={join}>
              <label className="font-semibold text-slate-600" htmlFor="room-code">
                Oda kodun var mı?
              </label>
              <input
                autoCapitalize="characters"
                className="w-36 rounded-xl border border-slate-300 px-3 py-2 text-center font-mono text-base font-bold tracking-[0.25em] uppercase outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                id="room-code"
                maxLength={6}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="KX7P2M"
                value={joinCode}
              />
              <button className="rounded-xl border-2 border-cyan-600 px-4 py-2 font-bold text-cyan-700 transition hover:bg-cyan-50" type="submit">
                Katıl
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
