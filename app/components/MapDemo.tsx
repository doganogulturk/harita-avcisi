"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { PlateBadge } from "./GameTopBar";
import { flagUrl, isSameLocation, LOCATION_SELECTOR, locationIdOf, locationName, type GameMode, type QuestionPrompt } from "@/lib/game";
import { useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { capitalOf } from "@/lib/world-capitals";
import { continentLocationIds, isContinentScope, type WorldScope } from "@/lib/world-countries";

/**
 * Haritada oyunun kendisini gösteren kısa döngü: soru çıkar, bir an sonra doğru yer yeşil yanar, sonraki soruya geçilir.
 * "Nasıl oynanır?" tanıtımı ve giriş ekranının ikinci adımındaki önizleme kullanır.
 */
export type DemoQuestion = { mode: GameMode; id: string; prompt: QuestionPrompt };

/** Her soru iki adımdır: önce soru, sonra cevap. */
export const DEMO_STEP_MS = 1000;

/**
 * Döngünün adımı. `resetKey` değişince (ör. soru tipi seçildi) döngü baştan, soruyla başlar; oyuncu seçiminin etkisini
 * hemen görür. Hareket azaltma açıksa döngü durur, ilk soru gösterilir.
 */
export function useDemoCycle(count: number, resetKey: string, stepMs = DEMO_STEP_MS) {
  const [state, setState] = useState({ key: resetKey, step: 0 });
  const step = state.key === resetKey ? state.step : 0;

  useEffect(() => {
    if (count === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setState((current) => ({ key: resetKey, step: current.key === resetKey ? current.step + 1 : 1 }));
    }, stepMs);
    return () => window.clearInterval(timer);
  }, [count, resetKey, stepMs]);

  return { index: count === 0 ? 0 : Math.floor(step / 2) % count, isRevealed: step % 2 === 1 };
}

/** Sorunun yazısı: "Ankara nerede?", plaka, bayrak ya da başkent; cevapta "✓ Ankara". */
export function DemoPrompt({ question, isRevealed }: { question: DemoQuestion; isRevealed: boolean }) {
  const name = locationName(question.mode, question.id);
  if (isRevealed) return <>✓ {name}</>;
  if (question.prompt === "plate") {
    return (
      <>
        <PlateBadge plate={Number(question.id)} size="sm" />
        hangi il?
      </>
    );
  }
  if (question.prompt === "flag") {
    return (
      <>
        <Image alt="" className="h-[1.2em] w-auto rounded-[3px] border border-slate-200" height={24} src={flagUrl(question.id)} unoptimized width={32} />
        hangi ülke?
      </>
    );
  }
  if (question.prompt === "capital") {
    return (
      <>
        <span aria-hidden="true">🏛️</span>
        {capitalOf(question.id)} hangi ülke?
      </>
    );
  }
  return <>{name} nerede?</>;
}

/** Sorunun durduğu yuvarlak etiket; cevapta yeşile döner. */
export function DemoPill({ question, isRevealed, className = "", style }: { question: DemoQuestion; isRevealed: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`pointer-events-none absolute left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-1.5 font-display font-bold whitespace-nowrap shadow-sm transition-colors ${
        isRevealed ? "bg-emerald-500 text-white" : "bg-cyan-50 text-cyan-800"
      } ${className}`}
    >
      <DemoPrompt isRevealed={isRevealed} question={question} />
    </div>
  );
}

/**
 * Önizlemede sorulanlar: küçük haritada da seçilen yerin yeşil yandığı görünsün diye büyük ve tanınır yerler. Kıtalar
 * birbirini izler; kıta seçilince yalnızca o kıtadakiler kalır.
 */
const WORLD_PREVIEW = [
  "br", "cn", "eg", "fr", "au", "us", "in", "za", "es", "ar", "ru", "ng", "it", "mx", "jp", "dz", "de", "ca",
  "sa", "ke", "gb", "co", "kz", "ma", "se", "pe", "tr", "et", "pl", "cl", "ir", "cd", "ua", "ve", "mn", "ao",
  "gr", "th", "ly", "no", "id", "tz", "fi", "pk", "sd",
];
const TURKEY_PREVIEW = ["6", "35", "25", "34", "42", "61", "7", "21", "16", "65", "1", "58"];

/** Haritaların yükseklik / genişlik oranı (SVG viewBox); soru etiketi çizilen haritanın hemen üstüne oturur. */
const MAP_ASPECT: Record<GameMode, number> = { world: 458.627 / 784.077, turkey: 447 / 1008 };
/** Etiketin haritanın üstünde kapladığı şerit. */
const PILL_BAND = "2.75rem";

function previewQuestions(mode: GameMode, scope: WorldScope, prompt: QuestionPrompt): DemoQuestion[] {
  if (mode === "turkey") return TURKEY_PREVIEW.map((id) => ({ mode, id, prompt }));
  const inScope = isContinentScope(scope) ? continentLocationIds(scope) : null;
  return WORLD_PREVIEW.filter((id) => (!inScope || inScope.has(id)) && (prompt !== "capital" || capitalOf(id))).map((id) => ({ mode, id, prompt }));
}

/**
 * Giriş ekranının ikinci adımındaki harita: seçilen harita, kapsam (kıta vurgulanır) ve soru tipiyle oyunun kendisi
 * döner. Seçim değişince döngü o seçimin sorusuyla baştan başlar. Tıklanamaz, ekran okuyucudan gizlidir.
 */
export function SetupPreviewMap({ mode, scope, prompt }: { mode: GameMode; scope: WorldScope; prompt: QuestionPrompt }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapMarkup } = useMapMarkup(mode);
  const questions = previewQuestions(mode, scope, prompt);
  const { index, isRevealed } = useDemoCycle(questions.length, `${mode}|${scope}|${prompt}`);
  const question = questions[index];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const highlighted = mode === "world" && isContinentScope(scope) ? continentLocationIds(scope) : null;
    container.querySelectorAll<SVGElement>(LOCATION_SELECTOR[mode]).forEach((location) => {
      const id = locationIdOf(location, mode) ?? "";
      location.classList.toggle("scope-active", highlighted?.has(id) ?? false);
      location.classList.toggle("map-correct", isRevealed && question !== undefined && isSameLocation(mode, id, question.id));
    });
  }, [isRevealed, mapMarkup, mode, question, scope]);

  if (!mapMarkup) return null;

  // Harita genişliğe sığdığında kutunun ortasında durur ve üstünde boşluk kalır; etiket o boşluğun dibine, haritanın
  // hemen üstüne iner (kutu ölçüsü container birimleriyle okunur). Harita yüksekliğe sığıyorsa etiket kutunun en üstündedir.
  const pillTop = `calc(0.25rem + max(0px, (100cqh - ${PILL_BAND} - 100cqw * ${MAP_ASPECT[mode]}) / 2))`;

  return (
    <div aria-hidden="true" className="relative h-full w-full [container-type:size]">
      {question && <DemoPill className="text-sm lg:text-lg" isRevealed={isRevealed} question={question} style={{ top: pillTop }} />}
      <div
        className="map-preview absolute inset-x-0 bottom-0"
        dangerouslySetInnerHTML={{ __html: mapMarkup }}
        key={mode}
        ref={containerRef}
        style={{ top: PILL_BAND, height: "auto" }}
      />
    </div>
  );
}
