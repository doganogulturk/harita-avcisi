"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SignInPanel } from "../SignInPanel";
import { DUEL_MODES, DUEL_RULES, duelChoice, duelPath, variantFor, type DuelRule } from "@/lib/duel";
import { type BoardVariant, type GameMode, type Player, type QuestionPrompt } from "@/lib/game";
import { createDuel } from "@/lib/hooks/useDuel";
import { useIsOnline } from "@/lib/hooks/useIsOnline";
import { setDuelSettingsKey, useDuelSettingsKey, type IntroGame } from "@/lib/intro-preferences";
import { gameInfo, groupInfo } from "./games";
import { Field, SetupShell } from "./SetupParts";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";

/** Kurulumdaki mod seçenekleri; yer adıyla sorulan mod tek oyunculu oyundaki gibi "İsim" diye yazılır. */
export function modeOptions(map: GameMode): { id: BoardVariant; label: string }[] {
  return (DUEL_MODES.find((group) => group.mode === map)?.options ?? []).map((option) => ({
    id: option.variant,
    label: option.variant === "normal" || option.variant === "hard" ? "İsim" : option.label,
  }));
}

/** Önizlemede sorulan soru tipi: modun soruda gösterdiği şey. */
export function previewPromptFor(variant: BoardVariant): QuestionPrompt {
  return duelChoice("world", variant).prompt ?? "name";
}

type DuelSetupProps = {
  map: GameMode;
  player: Player | null;
  supabaseConfigured: boolean;
  onGameChange: (game: IntroGame) => void;
  onMapChange: (map: GameMode) => void;
  onBack: () => void;
};

/** Adım 2, Düello: mod ve kural. Giriş yoksa önce giriş adımı gelir, giriş biter bitmez düello kurulur. */
export function DuelSetup({ map, player, supabaseConfigured, onGameChange, onMapChange, onBack }: DuelSetupProps) {
  // Düello sunucuda kurulur; bağlantı yokken tuş kapalıdır.
  const isOnline = useIsOnline();
  const router = useRouter();
  const [, storedVariant, rule] = useDuelSettingsKey().split("|") as [GameMode, BoardVariant, DuelRule];
  const variant = variantFor(map, storedVariant);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isAuthStep, setIsAuthStep] = useState(false);
  // Android geri tuşu giriş adımından ayarlara döner.
  useBackHandler(() => setIsAuthStep(false), BACK_PRIORITY.screen, isAuthStep && !player);

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
      actionLabel={!isOnline ? "Bağlantı yok" : isBusy ? "Kuruluyor…" : player ? gameInfo("duel").action : "Giriş yap ve kur"}
      error={error}
      game={gameInfo("duel")}
      group={groupInfo("friends")}
      isActionDisabled={isBusy || !supabaseConfigured || !isOnline}
      map={map}
      mode={variant}
      modes={modeOptions(map)}
      note="Kurunca bir kod ve bağlantı alırsın; rakibin açınca ikiniz de hazır deyip başlarsınız."
      onAction={() => (player ? void create() : setIsAuthStep(true))}
      onBack={onBack}
      onGameChange={onGameChange}
      onMapChange={onMapChange}
      onModeChange={(next) => save(next as BoardVariant, rule)}
      previewPrompt={previewPromptFor(variant)}
    >
      {/* Alçak ekranda kurallar yan yana, açıklamaları gizli; seçili kuralın açıklaması altta not olarak kalır. */}
      <Field noteOn="short" label="Kural" note={DUEL_RULES[rule].summary}>
        <div className="flex flex-col gap-2 short:grid short:grid-cols-2 short:gap-1.5" role="radiogroup">
          {(Object.keys(DUEL_RULES) as DuelRule[]).map((option) => {
            const isSelected = rule === option;
            return (
              <button
                aria-checked={isSelected}
                className={`rounded-2xl border-2 px-4 py-2.5 text-left transition focus-visible:ring-2 focus-visible:ring-orange-200 focus-visible:outline-none short:rounded-xl short:px-2 short:py-1 ${
                  isSelected ? "border-orange-400 bg-orange-50/70" : "border-slate-200 hover:border-orange-200"
                }`}
                key={option}
                onClick={() => save(variant, option)}
                role="radio"
                type="button"
              >
                <span className={`block font-display text-lg font-bold short:text-[13px] short:whitespace-nowrap ${isSelected ? "text-slate-900" : "text-slate-600"}`}>
                  {DUEL_RULES[option].icon} {DUEL_RULES[option].label}
                </span>
                <span className="mt-0.5 block text-xs text-slate-500 short:hidden lg:text-sm">{DUEL_RULES[option].summary}</span>
              </button>
            );
          })}
        </div>
      </Field>
    </SetupShell>
  );
}
