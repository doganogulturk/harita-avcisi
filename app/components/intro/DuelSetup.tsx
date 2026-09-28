"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignInPanel } from "../SignInPanel";
import { DUEL_MODES, DUEL_RULES, duelPath, type DuelRule } from "@/lib/duel";
import { type BoardVariant, type GameMode, type Player } from "@/lib/game";
import { createDuel } from "@/lib/hooks/useDuel";
import { setDuelSettingsKey, setLastGame, useDuelSettingsKey } from "@/lib/intro-preferences";
import { gameInfo } from "./games";
import { Field, Segmented, SetupShell } from "./SetupParts";

/** Seçilen haritada geçerli modu döndürür; başka haritada kalmış bir mod o haritanın ilk moduna düşer. */
export function variantFor(map: GameMode, variant: string): BoardVariant {
  const options = DUEL_MODES.find((group) => group.mode === map)?.options ?? [];
  return options.find((option) => option.variant === variant)?.variant ?? options[0]?.variant ?? "normal";
}

export function modeOptions(map: GameMode): { id: BoardVariant; label: string }[] {
  return (DUEL_MODES.find((group) => group.mode === map)?.options ?? []).map((option) => ({ id: option.variant, label: option.label }));
}

type DuelSetupProps = {
  map: GameMode;
  player: Player | null;
  supabaseConfigured: boolean;
  onMapChange: (map: GameMode) => void;
  onBack: () => void;
};

/** Adım 2, Düello: mod ve kural. Giriş yoksa önce giriş adımı gelir, giriş biter bitmez düello kurulur. */
export function DuelSetup({ map, player, supabaseConfigured, onMapChange, onBack }: DuelSetupProps) {
  const router = useRouter();
  const [, storedVariant, rule] = useDuelSettingsKey().split("|") as [GameMode, BoardVariant, DuelRule];
  const variant = variantFor(map, storedVariant);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthStep, setIsAuthStep] = useState(false);

  const save = (nextVariant: BoardVariant, nextRule: DuelRule) => setDuelSettingsKey(`${map}|${nextVariant}|${nextRule}`);

  const create = async () => {
    setIsBusy(true);
    setError(null);
    save(variant, rule);
    const result = await createDuel({ mode: map, variant, rule });
    if ("error" in result) {
      setError(result.error);
      setIsBusy(false);
      setIsAuthStep(false);
      return;
    }
    setLastGame("duel");
    router.push(duelPath(result.code));
  };

  if (isAuthStep && !player) {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <SignInPanel
          description="Rakibin seni görebilsin diye giriş yap; misafir girişi de olur. Giriş yapar yapmaz düello kurulur."
          onCancel={() => setIsAuthStep(false)}
          onSignedIn={() => void create()}
          // Google girişinden dönüşte ana sayfaya gelinir; ayarlar hatırlandığı için tek tıkla kurulur.
          redirectTo={window.location.origin}
          title={<>⚔️ Düello kurmak için giriş yap</>}
        />
      </div>
    );
  }

  return (
    <SetupShell
      actionLabel={isBusy ? "Kuruluyor…" : gameInfo("duel").action}
      error={error}
      game={gameInfo("duel")}
      isActionDisabled={isBusy || !supabaseConfigured}
      map={map}
      note="Kurunca bir kod ve bağlantı alırsın; rakibin açınca ikiniz de hazır deyip başlarsınız."
      onAction={() => (player ? void create() : setIsAuthStep(true))}
      onBack={onBack}
      onMapChange={onMapChange}
    >
      <Field label="Mod">
        <Segmented label="Düello modu" onChange={(next) => save(next, rule)} options={modeOptions(map)} value={variant} />
      </Field>

      <Field label="Kural">
        <div className="flex flex-col gap-2" role="radiogroup">
          {(Object.keys(DUEL_RULES) as DuelRule[]).map((option) => {
            const isSelected = rule === option;
            return (
              <button
                aria-checked={isSelected}
                className={`rounded-2xl border-2 px-4 py-2.5 text-left transition focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:outline-none short:py-2 ${
                  isSelected ? "border-orange-400 bg-orange-50/70" : "border-slate-200 hover:border-orange-200"
                }`}
                key={option}
                onClick={() => save(variant, option)}
                role="radio"
                type="button"
              >
                <span className={`block font-display text-lg font-bold ${isSelected ? "text-slate-900" : "text-slate-600"}`}>
                  {DUEL_RULES[option].icon} {DUEL_RULES[option].label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 lg:text-sm">{DUEL_RULES[option].summary}</span>
              </button>
            );
          })}
        </div>
      </Field>
    </SetupShell>
  );
}
