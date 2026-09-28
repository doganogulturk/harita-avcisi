"use client";

import Image from "next/image";
import { flagUrl, type GameMode, type PlayKind, type TurkeyPrompt, type WorldPrompt } from "@/lib/game";
import { setQuestionPrompt, setTurkeyPrompt, setWorldScope } from "@/lib/intro-preferences";
import { provinces } from "@/lib/turkish-plates";
import { CONTINENTS, continentInfo, countryCount, isContinentScope, scopeCountryCount, type WorldScope } from "@/lib/world-countries";
import { gameInfo } from "./games";
import { Field, ScopeChip, Segmented, SetupShell } from "./SetupParts";

const PROMPT_OPTIONS: { id: WorldPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "flag", label: "Bayrak" },
];

const TURKEY_PROMPT_OPTIONS: { id: TurkeyPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "plate", label: "Plaka" },
];

const TURKEY_PROMPT_NOTES: Record<TurkeyPrompt, string> = {
  name: "Soru olarak ilin adı gelir, sen haritada yerini bulursun.",
  plate: "Soru olarak plaka kodu gelir, sen o ilin yerini bulursun. Yarışta ayrı bir sıralaması var.",
};

const SCOPE_LOCK_NOTE = `Yarışta bayrak turu ${countryCount("hard")} ülkenin tamamından sorulur.`;

/**
 * Kapsamın ne anlama geldiğini yazıyla söyler. Havuzlar haritada vurgulanmaz: "en bilinen 58 ülke"
 * gibi bir seçim haritada anlamlı bir şekil oluşturmuyor, kıtalar ise oluşturuyor.
 */
function scopeNote(scope: WorldScope): string {
  if (isContinentScope(scope)) return `${continentInfo(scope).label} kıtasındaki ${scopeCountryCount(scope)} ülke, haritada vurgulandı.`;
  if (scope === "normal") return `Adı daha çok bilinen ${countryCount("normal")} ülke.`;
  return `Haritadaki ${countryCount("hard")} ülkenin tamamı.`;
}

type SoloSetupProps = {
  kind: PlayKind;
  map: GameMode;
  scope: WorldScope;
  prompt: WorldPrompt;
  turkeyPrompt: TurkeyPrompt;
  isScopeLocked: boolean;
  isReady: boolean;
  onMapChange: (map: GameMode) => void;
  onBack: () => void;
  onStart: () => void;
};

/** Adım 2, Yarış ve Antrenman: soru tipi ve (dünyada) kapsam. */
export function SoloSetup({ kind, map, scope, prompt, turkeyPrompt, isScopeLocked, isReady, onMapChange, onBack, onStart }: SoloSetupProps) {
  const poolScopes: { id: WorldScope; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "hard", label: kind === "ranked" ? "Zor" : "Tümü" },
  ];

  return (
    <SetupShell
      actionLabel={isReady ? "Başla" : "Harita hazırlanıyor..."}
      game={gameInfo(kind)}
      isActionDisabled={!isReady}
      map={map}
      onAction={onStart}
      onBack={onBack}
      onMapChange={onMapChange}
      previewScope={map === "world" ? scope : "normal"}
    >
      {map === "world" ? (
        <>
          <Field label="Soru">
            <Segmented label="Soru tipi" onChange={setQuestionPrompt} options={PROMPT_OPTIONS} value={prompt} />
            {prompt === "flag" && (
              <Image
                alt=""
                className="ml-2 inline-block h-5 w-auto rounded-[3px] border border-slate-200 align-middle shadow-sm"
                height={20}
                src={flagUrl("tr")}
                unoptimized
                width={27}
              />
            )}
          </Field>

          <Field label="Kapsam" note={isScopeLocked ? SCOPE_LOCK_NOTE : scopeNote(scope)}>
            <div className="flex flex-wrap gap-2" role="radiogroup">
              {poolScopes.map((option) => (
                <ScopeChip
                  count={scopeCountryCount(option.id)}
                  disabled={isScopeLocked}
                  isSelected={scope === option.id}
                  key={option.id}
                  label={option.label}
                  onClick={() => setWorldScope(option.id)}
                />
              ))}
            </div>
            {kind === "practice" && (
              <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5" role="radiogroup">
                {CONTINENTS.map((continent) => (
                  <ScopeChip
                    count={scopeCountryCount(continent.id)}
                    disabled={false}
                    isSelected={scope === continent.id}
                    key={continent.id}
                    label={continent.label}
                    onClick={() => setWorldScope(continent.id)}
                  />
                ))}
              </div>
            )}
          </Field>
        </>
      ) : (
        <Field label="Soru" note={`${provinces.length} ilin tamamı sorulur. ${TURKEY_PROMPT_NOTES[turkeyPrompt]}`}>
          <Segmented label="Soru tipi" onChange={setTurkeyPrompt} options={TURKEY_PROMPT_OPTIONS} value={turkeyPrompt} />
        </Field>
      )}
    </SetupShell>
  );
}
