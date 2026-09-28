"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { SignInPanel } from "../SignInPanel";
import { DUEL_QUESTION_MS, DUEL_QUESTIONS, duelPath, type DuelRule, type DuelSettings } from "@/lib/duel";
import { type BoardVariant, type GameMode, type Player } from "@/lib/game";
import { createDuel } from "@/lib/hooks/useDuel";
import { setDuelSettingsKey, useDuelSettingsKey } from "@/lib/intro-preferences";
import { DuelSettingsPicker, SHIMMER_BUTTON } from "./DuelParts";

type DuelCreateDialogProps = {
  player: Player | null;
  supabaseConfigured: boolean;
  onClose: () => void;
};

/** Giriş ekranından açılan pencere: düello kur ya da elindeki kodla katıl. */
export function DuelCreateDialog({ player, supabaseConfigured, onClose }: DuelCreateDialogProps) {
  const router = useRouter();
  const [mode, variant, rule] = useDuelSettingsKey().split("|") as [GameMode, BoardVariant, DuelRule];
  const settings: DuelSettings = { mode, variant, rule };
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthStep, setIsAuthStep] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const create = async () => {
    setIsBusy(true);
    setError(null);
    const result = await createDuel(settings);
    if ("error" in result) {
      setError(result.error);
      setIsBusy(false);
      return;
    }
    router.push(duelPath(result.code));
  };

  const join = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length === 6) router.push(duelPath(code));
    else setError("Düello kodu 6 karakterdir.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Düello penceresini kapat" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} tabIndex={-1} type="button" />

      <div
        aria-labelledby="duel-title"
        aria-modal="true"
        className="relative flex max-h-full w-full max-w-3xl flex-col overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-8"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">İki kişi · aynı sorular · aynı anda</p>
            <h2 className="mt-1 font-display text-3xl font-bold text-slate-900 sm:text-4xl" id="duel-title">
              ⚔️ Düello kur
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
              description="Rakibin seni görebilsin diye giriş yap; misafir girişi de olur. Giriş yapar yapmaz düello kurulur."
              onCancel={() => setIsAuthStep(false)}
              onSignedIn={() => void create()}
              // Google girişinden dönüşte pencere kapanmış olur; ayarlar hatırlandığı için tek tıkla kurulur.
              redirectTo={window.location.origin}
              title={<>⚔️ Düello kurmak için giriş yap</>}
            />
          </div>
        ) : (
          <>
            <div className="mt-6">
              <DuelSettingsPicker onChange={(next) => setDuelSettingsKey(`${next.mode}|${next.variant}|${next.rule}`)} value={settings} />
            </div>
            <p className="mt-5 text-center text-xs text-slate-500">
              {DUEL_QUESTIONS} soru · soru başına {DUEL_QUESTION_MS / 1000} saniye · genel sıralamaya işlenmez
            </p>
            {error && <p className="mt-3 text-center text-sm font-semibold text-rose-600">{error}</p>}
            <button
              className={`${SHIMMER_BUTTON} mt-3`}
              disabled={isBusy || !supabaseConfigured}
              onClick={() => (player ? void create() : setIsAuthStep(true))}
              type="button"
            >
              {isBusy ? "Kuruluyor…" : "Düelloyu kur →"}
            </button>

            <form className="mt-5 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-5 text-sm" onSubmit={join}>
              <label className="font-semibold text-slate-600" htmlFor="duel-code">
                Kodun var mı?
              </label>
              <input
                autoCapitalize="characters"
                className="w-36 rounded-xl border border-slate-300 px-3 py-2 text-center font-mono text-base font-bold tracking-[0.25em] uppercase outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                id="duel-code"
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
