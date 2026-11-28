"use client";

import { useEffect, useRef, useState } from "react";
import { LOCATION_SELECTOR, locationIdOf, locationName, normalizeLocationId } from "@/lib/game";
import { useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { messages } from "@/lib/i18n";
import { type AnswerStyle } from "@/lib/intro-preferences";
import { neighborIds } from "@/lib/neighbors";

/**
 * Bir sahnenin adımı. Her adım haritanın ve şıkların o anki hâlini tarif eder; adımlar sırayla oynar.
 * `marked`: turuncu işaretli il (şıklı ve komşuluk sorusunun konusu). `correct`: yeşil yanan il. `picked`: basılan şık.
 * `finger`: parmağın durduğu il (dokunma sahnesi). `neighbors`: konunun komşuları kesik çizgiyle.
 */
type DemoStep = { ms: number; marked?: string; correct?: string; picked?: string; finger?: "start" | "target" | "tap"; neighbors?: boolean; revealed?: boolean };

/**
 * Bir soru biçiminin sahnesi: haritada hangi ilin sorulduğu, varsa dört şık ve adımlar. Sahneler Türkiye illeriyle kurulur:
 * tanınır ve küçük bir haritada da seçilen yer görünür. Haritanın görünümü `focus` illerini kapsayacak biçimde yakınlaşır.
 */
type DemoScene = { answer: string; subject?: string; options?: string[]; focus: string[]; steps: DemoStep[] };

const SCENES: Record<AnswerStyle, DemoScene> = {
  // Ankara sorulur, parmak haritada Ankara'ya gider ve dokunur, Ankara yeşil yanar.
  tap: {
    answer: "6",
    focus: ["6", ...neighborIds("turkey", "6")],
    steps: [
      { ms: 900, finger: "start" },
      { ms: 800, finger: "target" },
      { ms: 1800, finger: "tap", correct: "6", revealed: true },
    ],
  },
  // Konya işaretlenir, dört şıktan Konya seçilir ve yeşil yanar.
  choose: {
    answer: "42",
    options: ["68", "42", "70", "51"],
    focus: ["42", "68", "70"],
    steps: [
      { ms: 1300, marked: "42" },
      { ms: 500, marked: "42", picked: "42" },
      { ms: 1800, correct: "42", picked: "42", revealed: true },
    ],
  },
  // Kayseri işaretlenir, "Kayseri ile komşu olan hangisi?" sorulur, Sivas seçilir ve yeşil yanar; sonra Kayseri'nin bütün
  // komşuları kesik çizgiyle belirir.
  neighbors: {
    answer: "58",
    subject: "38",
    options: ["42", "58", "44", "6"],
    focus: ["38", ...neighborIds("turkey", "38")],
    steps: [
      { ms: 1600, marked: "38" },
      { ms: 500, marked: "38", picked: "58" },
      { ms: 1000, marked: "38", correct: "58", picked: "58", revealed: true },
      { ms: 2200, marked: "38", correct: "58", picked: "58", revealed: true, neighbors: true },
    ],
  },
};

/** Sahne bu kadar kez oynar, sonra son adımda durur: ayar ekranında sürekli dönen bir şey göz yorar. */
const LOOPS = 3;

/**
 * Sahnenin adımı. Biçim değişince baştan oynar (bileşen biçimle anahtarlanır). Hareket azaltma açıksa doğrudan son adım
 * gösterilir: sahnenin anlattığı şey son karede de okunur.
 */
function useSceneStep(steps: DemoStep[]): DemoStep {
  const [state, setState] = useState({ index: 0, loop: 0, isStill: false });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => setState({ index: steps.length - 1, loop: LOOPS, isStill: true }), 0);
      return () => window.clearTimeout(timer);
    }
  }, [steps.length]);

  useEffect(() => {
    if (state.isStill) return;
    const isLast = state.index === steps.length - 1;
    if (isLast && state.loop >= LOOPS - 1) return;
    const timer = window.setTimeout(() => {
      setState((current) => (isLast ? { index: 0, loop: current.loop + 1, isStill: false } : { ...current, index: current.index + 1 }));
    }, steps[state.index].ms);
    return () => window.clearTimeout(timer);
  }, [state, steps]);

  return steps[state.index];
}

/**
 * Sorunun yazısı: dokunmada "Ankara nerede?", şıklıda "Bu hangi il?"; cevapta "✓ Konya". Komşulukta soru ("Hangisi Kayseri ile
 * komşudur?") cevaptan sonra da kalır: cevap şıkta ve haritada yeşil yanar, soru satırı sahnenin sonuna kadar neyin sorulduğunu söyler.
 */
function questionText(style: AnswerStyle, scene: DemoScene, isRevealed: boolean): string {
  const { demo, game } = messages();
  if (style === "neighbors") return demo.neighborQuestion(locationName("turkey", scene.subject ?? ""));
  if (isRevealed) return `✓ ${locationName("turkey", scene.answer)}`;
  if (style === "tap") return demo.where(locationName("turkey", scene.answer));
  return game.markedPrompt.turkey;
}

/** İllerin kutularının birleşimi, kenar payıyla: sahnenin haritası bu görünüme yakınlaşır. */
function focusBox(svg: SVGSVGElement, ids: string[]): string | null {
  const wanted = new Set(ids);
  let box: [number, number, number, number] | null = null;
  for (const location of svg.querySelectorAll<SVGGraphicsElement>(LOCATION_SELECTOR.turkey)) {
    const id = locationIdOf(location, "turkey");
    if (!id || !wanted.has(normalizeLocationId("turkey", id))) continue;
    const { x, y, width, height } = location.getBBox();
    box = box ? [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x + width), Math.max(box[3], y + height)] : [x, y, x + width, y + height];
  }
  if (!box) return null;
  const [left, top, right, bottom] = box;
  const pad = Math.max(right - left, bottom - top) * 0.04;
  return `${left - pad} ${top - pad} ${right - left + pad * 2} ${bottom - top + pad * 2}`;
}

/**
 * Oyna ve Antrenman ayar ekranında, soru biçimi kartlarının altında seçilen biçimin kısa animasyonu: haritada bir soru, varsa
 * dört şık ve cevap. Kartlardaki tek satırlık açıklama "ne seçtim"i söylüyordu, "nasıl oynanır"ı göstermiyordu. Yanında biçimin
 * açıklaması yazar (Oyna'da komşulukta "bu tur kaydedilmez" de). Tanıtımdaki harita döngüsüyle aynı görsel dil: beyaz kart,
 * oyun haritasının renkleri, soru çipi. Ekran okuyucudan gizlidir; açıklama metni onlar için de okunur.
 */
export function StyleDemo({ style, hint }: { style: AnswerStyle; hint: string }) {
  const scene = SCENES[style];
  const step = useSceneStep(scene.steps);
  const { mapMarkup } = useMapMarkup("turkey");
  const mapRef = useRef<HTMLDivElement>(null);
  const fingerRef = useRef<HTMLDivElement>(null);
  const focusKey = scene.focus.join(",");

  // Harita sahnenin illerine yakınlaşır.
  useEffect(() => {
    const svg = mapRef.current?.querySelector("svg");
    if (!svg) return;
    const box = focusBox(svg, focusKey.split(","));
    if (box) svg.setAttribute("viewBox", box);
  }, [focusKey, mapMarkup]);

  // Adımın renkleri: işaretli, doğru ve komşu iller.
  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;
    const neighbors = new Set(step.neighbors && scene.subject ? neighborIds("turkey", scene.subject) : []);
    container.querySelectorAll<SVGGraphicsElement>(LOCATION_SELECTOR.turkey).forEach((location) => {
      const id = normalizeLocationId("turkey", locationIdOf(location, "turkey") ?? "");
      location.classList.toggle("map-marked", id === step.marked);
      location.classList.toggle("map-correct", id === step.correct);
      location.classList.toggle("map-neighbor", neighbors.has(id));
    });
  }, [mapMarkup, scene.subject, step]);

  // Parmak: köşeden sorulan ile kayar ve dokunur. Konumu çizilen ilin ekrandaki kutusundan okunur.
  useEffect(() => {
    const finger = fingerRef.current;
    const container = mapRef.current;
    if (!finger || !container) return;
    if (!step.finger) {
      finger.style.opacity = "0";
      return;
    }
    const frame = container.getBoundingClientRect();
    const target = [...container.querySelectorAll<SVGGraphicsElement>(LOCATION_SELECTOR.turkey)].find(
      (location) => normalizeLocationId("turkey", locationIdOf(location, "turkey") ?? "") === scene.answer,
    );
    const rect = target?.getBoundingClientRect();
    const isAtTarget = step.finger !== "start" && rect;
    finger.style.opacity = "1";
    finger.style.left = `${isAtTarget ? rect.left + rect.width / 2 - frame.left : frame.width * 0.92}px`;
    finger.style.top = `${isAtTarget ? rect.top + rect.height / 2 - frame.top : frame.height * 0.95}px`;
    finger.style.transform = `translate(-30%, -8%) scale(${step.finger === "tap" ? 0.85 : 1})`;
  }, [mapMarkup, scene.answer, step]);

  const isRevealed = Boolean(step.revealed);
  // Komşulukta soru satırı soru olarak kalır, yeşile dönmez.
  const isPillRevealed = isRevealed && style !== "neighbors";

  return (
    <div className="flex items-stretch gap-3 rounded-2xl border border-white/15 bg-white/5 p-2 lg:gap-5 lg:rounded-3xl lg:p-3">
      <div aria-hidden="true" className="relative h-28 w-[42%] max-w-56 shrink-0 overflow-hidden rounded-xl border-2 border-slate-200 bg-white sm:h-32 lg:h-40 lg:max-w-64 lg:rounded-2xl">
        {mapMarkup && <div className="map pointer-events-none absolute inset-1.5" dangerouslySetInnerHTML={{ __html: mapMarkup }} ref={mapRef} />}
        <div className="pointer-events-none absolute z-10 text-2xl opacity-0 drop-shadow-md transition-all duration-700 ease-out lg:text-3xl" ref={fingerRef}>
          👆
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 lg:gap-2.5">
        <p
          aria-hidden="true"
          className={`self-start rounded-full px-3 py-1 font-display text-sm leading-tight font-bold transition-colors lg:px-4 lg:text-lg ${
            isPillRevealed ? "bg-emerald-500 text-white" : "bg-cyan-50 text-cyan-800"
          }`}
        >
          {questionText(style, scene, isRevealed)}
        </p>
        {scene.options && (
          <div aria-hidden="true" className="grid grid-cols-2 gap-1 lg:grid-cols-4 lg:gap-2">
            {scene.options.map((id) => {
              const isPicked = step.picked === id;
              const tone = isRevealed
                ? id === scene.answer
                  ? "border-emerald-500 bg-emerald-400 text-emerald-950"
                  : "border-white/10 bg-white/10 text-white/40"
                : isPicked
                  ? "scale-95 border-amber-300 bg-amber-100 text-amber-950"
                  : "border-white/20 bg-white/90 text-slate-800";
              return (
                <span className={`truncate rounded-lg border-2 px-1.5 py-0.5 text-center text-xs font-bold transition-all duration-200 lg:py-1 lg:text-sm ${tone}`} key={id}>
                  {locationName("turkey", id)}
                </span>
              );
            })}
          </div>
        )}
        <p className="text-xs leading-snug text-cyan-100/80 lg:text-sm">{hint}</p>
      </div>
    </div>
  );
}
