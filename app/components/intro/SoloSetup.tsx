"use client";

import { type GameMode, type PlayKind, type TurkeyPrompt, type WorldPrompt } from "@/lib/game";
import { useIsOnline } from "@/lib/hooks/useIsOnline";
import { setQuestionPrompt, setTurkeyPrompt, setWorldScope, type IntroGame } from "@/lib/intro-preferences";
import { provinces } from "@/lib/turkish-plates";
import { capitalOf } from "@/lib/world-capitals";
import { CONTINENTS, continentInfo, countries, isContinentScope, scopeCountryCount, scopeLocationIds, type WorldScope } from "@/lib/world-countries";
import { type CardLeader } from "./ModeGrid";
import { gameInfo, groupInfo } from "./games";
import { Field, ScopeChip, SetupShell } from "./SetupParts";

const WORLD_PROMPT_OPTIONS: { id: WorldPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "flag", label: "Bayrak" },
  { id: "capital", label: "Başkent" },
];

const TURKEY_PROMPT_OPTIONS: { id: TurkeyPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "plate", label: "Plaka" },
];

/** Kapsamda sorulacak ülke sayısı; başkent turunda başkenti listede olmayanlar (tartışmalılar, bağlı topraklar) sayılmaz. */
function questionCount(scope: WorldScope, prompt: WorldPrompt): number {
  return prompt === "capital" ? [...scopeLocationIds(scope)].filter((code) => capitalOf(code)).length : scopeCountryCount(scope);
}

/** Kapsamın ne anlama geldiğini yazıyla söyler. */
function scopeNote(scope: WorldScope, prompt: WorldPrompt): string {
  if (isContinentScope(scope)) return `${continentInfo(scope).label} kıtasındaki ${questionCount(scope, prompt)} ülke, haritada vurgulandı.`;
  return prompt === "capital" ? `Başkenti sorulan ${questionCount(scope, prompt)} ülkenin tamamı.` : `Haritadaki ${countries.length} ülkenin tamamı.`;
}

type SoloSetupProps = {
  kind: PlayKind;
  map: GameMode;
  scope: WorldScope;
  prompt: WorldPrompt;
  turkeyPrompt: TurkeyPrompt;
  /** Seçili sıralamanın birincisi; yarış panelinde gösterilir. */
  leader?: CardLeader;
  isReady: boolean;
  /** Yarışta giriş yapılmamışsa tuş bunu önceden söyler; giriş adımı sürpriz olmasın. */
  needsSignIn: boolean;
  onGameChange: (game: IntroGame) => void;
  onMapChange: (map: GameMode) => void;
  onBack: () => void;
  onStart: () => void;
};

/** Adım 2, Tek başıma: Yarış ya da Antrenman, harita, soru tipi; antrenmanda (dünyada) kapsam. */
export function SoloSetup({ kind, map, scope, prompt, turkeyPrompt, leader, isReady, needsSignIn, onGameChange, onMapChange, onBack, onStart }: SoloSetupProps) {
  // Yarış turu sunucuda açılır; bağlantı yokken başlatılırsa skoru kaydedilemez. Antrenman bağlantısız da oynanır.
  const isOnline = useIsOnline();
  const isBlockedOffline = kind === "ranked" && !isOnline;
  const isWorld = map === "world";
  const poolNote = isWorld
    ? prompt === "capital"
      ? `Başkenti listede olan ${questionCount("all", prompt)} ülkeden sorulur.`
      : `${countries.length} ülkenin tamamından sorulur.`
    : `${provinces.length} ilin tamamından sorulur.`;

  return (
    <SetupShell
      actionLabel={isBlockedOffline ? "Bağlantı yok" : !isReady ? "Harita hazırlanıyor..." : needsSignIn ? "Giriş yap ve başla" : "Başla"}
      game={gameInfo(kind)}
      group={groupInfo("solo")}
      isActionDisabled={!isReady || isBlockedOffline}
      map={map}
      mode={isWorld ? prompt : turkeyPrompt}
      modes={isWorld ? WORLD_PROMPT_OPTIONS : TURKEY_PROMPT_OPTIONS}
      onAction={onStart}
      onBack={onBack}
      onGameChange={onGameChange}
      onMapChange={onMapChange}
      onModeChange={(next) => (isWorld ? setQuestionPrompt(next as WorldPrompt) : setTurkeyPrompt(next as TurkeyPrompt))}
      previewPrompt={isWorld ? prompt : turkeyPrompt}
      previewScope={isWorld && kind === "practice" ? scope : "all"}
    >
      {kind === "ranked" ? (
        // Yarışta seçilecek ayar yok: panel kısa tutulur (soru tipinin notu haritadadır); havuz ve bu sıralamanın birincisi.
        <div className="flex flex-col gap-2 short:gap-1.5">
          <p className="text-sm text-slate-600 short:text-xs">{poolNote} Eşit puanda hızlı olan önde; her harita ve soru tipinin kendi sıralaması var.</p>
          {leader && (
            <p className="flex max-w-full items-center gap-1.5 self-start rounded-full bg-cyan-50 px-3 py-1 text-xs text-slate-700 lg:text-sm">
              <span aria-hidden="true">🏆</span>
              <span className="shrink-0 font-semibold text-slate-500">Birinci</span>
              <span className="min-w-0 truncate font-bold">{leader.name}</span>
              <span className="shrink-0 font-semibold tabular-nums">
                · {leader.score} · {leader.time}
              </span>
            </p>
          )}
        </div>
      ) : isWorld ? (
        <Field noteOn="tall" label="Kapsam" note={scopeNote(scope, prompt)}>
          {/* Tümü tam satır, altında dört kıta ikişerli; alçak ekranda üçerli iki satır olur. */}
          <div className="grid grid-cols-2 gap-2 short:grid-cols-3 short:gap-1.5" role="radiogroup">
            <ScopeChip
              className="col-span-2 short:col-span-1"
              count={questionCount("all", prompt)}
              isSelected={scope === "all"}
              label="Tümü"
              onClick={() => setWorldScope("all")}
            />
            {CONTINENTS.map((continent) => (
              <ScopeChip
                count={questionCount(continent.id, prompt)}
                isSelected={scope === continent.id}
                key={continent.id}
                label={continent.label}
                onClick={() => setWorldScope(continent.id)}
              />
            ))}
          </div>
        </Field>
      ) : (
        <p className="text-sm text-slate-600 short:text-xs">{poolNote} Süre yok; istediğin kadar oyna, bitirince sonucunu gör.</p>
      )}
    </SetupShell>
  );
}
