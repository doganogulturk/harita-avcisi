"use client";

import Image from "next/image";
import { flagUrl, type GameMode, type PlayKind, type TurkeyPrompt, type WorldPrompt } from "@/lib/game";
import { useIsOnline } from "@/lib/hooks/useIsOnline";
import { setQuestionPrompt, setTurkeyPrompt, setWorldScope } from "@/lib/intro-preferences";
import { provinces } from "@/lib/turkish-plates";
import { capitalOf } from "@/lib/world-capitals";
import { CONTINENTS, continentInfo, countries, isContinentScope, scopeCountryCount, scopeLocationIds, type WorldScope } from "@/lib/world-countries";
import { gameInfo } from "./games";
import { Field, ScopeChip, Segmented, SetupShell } from "./SetupParts";

const PROMPT_OPTIONS: { id: WorldPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "flag", label: "Bayrak" },
  { id: "capital", label: "Başkent" },
];

const TURKEY_PROMPT_OPTIONS: { id: TurkeyPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "plate", label: "Plaka" },
];

const TURKEY_PROMPT_NOTES: Record<TurkeyPrompt, string> = {
  name: "Soru olarak ilin adı gelir, sen haritada yerini bulursun.",
  plate: "Soru olarak plaka kodu gelir, sen o ilin yerini bulursun. Yarışta ayrı bir sıralaması var.",
};

/** Kapsamda sorulacak ülke sayısı; başkent turunda başkenti listede olmayanlar (tartışmalılar, bağlı topraklar) sayılmaz. */
function questionCount(scope: WorldScope, prompt: WorldPrompt): number {
  return prompt === "capital" ? [...scopeLocationIds(scope)].filter((code) => capitalOf(code)).length : scopeCountryCount(scope);
}

/** Kapsamın ne anlama geldiğini yazıyla söyler. Tüm ülkeler haritada vurgulanmaz, kıtalar vurgulanır. */
function scopeNote(scope: WorldScope, prompt: WorldPrompt): string {
  if (isContinentScope(scope)) return `${continentInfo(scope).label} kıtasındaki ${questionCount(scope, prompt)} ülke, haritada vurgulandı.`;
  return prompt === "capital" ? `Başkenti sorulan ${questionCount(scope, prompt)} ülkenin tamamı.` : `Haritadaki ${countries.length} ülkenin tamamı.`;
}

/** Yarışta soru tipinin altındaki not. */
function rankedNote(prompt: WorldPrompt): string {
  if (prompt === "capital") return `Soru olarak başkent gelir, sen ülkesini bulursun. ${questionCount("all", prompt)} ülkeden sorulur.`;
  return `${countries.length} ülkenin tamamı sorulur.`;
}

type SoloSetupProps = {
  kind: PlayKind;
  map: GameMode;
  scope: WorldScope;
  prompt: WorldPrompt;
  turkeyPrompt: TurkeyPrompt;
  isReady: boolean;
  /** Yarışta giriş yapılmamışsa tuş bunu önceden söyler; giriş adımı sürpriz olmasın. */
  needsSignIn: boolean;
  onMapChange: (map: GameMode) => void;
  onBack: () => void;
  onStart: () => void;
};

/** Adım 2, Yarış ve Antrenman: soru tipi ve (dünyada) kapsam. */
export function SoloSetup({ kind, map, scope, prompt, turkeyPrompt, isReady, needsSignIn, onMapChange, onBack, onStart }: SoloSetupProps) {
  // Yarış turu sunucuda açılır; bağlantı yokken başlatılırsa skoru kaydedilemez. Antrenman bağlantısız da oynanır.
  const isOnline = useIsOnline();
  const isBlockedOffline = kind === "ranked" && !isOnline;

  return (
    <SetupShell
      actionLabel={isBlockedOffline ? "Bağlantı yok" : !isReady ? "Harita hazırlanıyor..." : needsSignIn ? "Giriş yap ve başla" : "Başla"}
      game={gameInfo(kind)}
      isActionDisabled={!isReady || isBlockedOffline}
      map={map}
      onAction={onStart}
      onBack={onBack}
      onMapChange={onMapChange}
      previewScope={map === "world" ? scope : "all"}
    >
      {map === "world" ? (
        <>
          {/* Yarış her zaman tüm ülkelerden sorulur; kapsam seçimi (tümü ya da bir kıta) yalnızca antrenmanda var. */}
          <Field label="Soru" note={kind === "ranked" ? rankedNote(prompt) : undefined}>
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

          {kind === "practice" && (
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
          )}
        </>
      ) : (
        <Field label="Soru" note={`${provinces.length} ilin tamamı sorulur. ${TURKEY_PROMPT_NOTES[turkeyPrompt]}`}>
          <Segmented label="Soru tipi" onChange={setTurkeyPrompt} options={TURKEY_PROMPT_OPTIONS} value={turkeyPrompt} />
        </Field>
      )}
    </SetupShell>
  );
}
