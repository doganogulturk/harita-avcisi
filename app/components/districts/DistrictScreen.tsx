"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DarkSystemBars } from "../NativeSystemBars";
import { ProvincePicker } from "./ProvincePicker";
import { PRIMARY_BUTTON_CLASS } from "../PlayButton";
import { RoundCelebration } from "../RoundCelebration";
import { formatTime } from "@/lib/game";
import { vibrate } from "@/lib/haptics";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { useMapZoom } from "@/lib/hooks/useMapZoom";
import { messages } from "@/lib/i18n";
import { DISTRICT_PENALTY_SECONDS, DISTRICT_PROVINCES, districtMapUrl, districtScore, districtsOf, type District } from "@/lib/districts";
import { playSound, primeSound } from "@/lib/sound";

/** Koyu deniz zeminindeki küçük yuvarlak tuş (geri, ana menü). */
const ROUND_BUTTON =
  "hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/85 transition hover:border-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none";

function BackArrow() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * /ilceler: önce il seçilir, sonra o ilin ilçeleriyle "Haritayı tamamla" oynanır. Tur kaydedilmez (antrenman gibi);
 * kişisel rekorlar ve il koleksiyonu sonraki adımda.
 */
export function DistrictScreen() {
  const [plate, setPlate] = useState<number | null>(null);
  // Android geri tuşu turdan il seçimine döner; il seçiminde sayfanın kendi geçmişi işler.
  useBackHandler(() => setPlate(null), BACK_PRIORITY.screen, plate !== null);

  return (
    <main className="safe-area sea-backdrop flex h-[100dvh] flex-col text-white">
      <DarkSystemBars />
      {plate === null ? <ProvincePicker onPick={setPlate} /> : <DistrictPuzzle key={plate} onBack={() => setPlate(null)} plate={plate} />}
    </main>
  );
}

const markupCache = new Map<number, string>();

/** İlin ilçe haritasını indirir (bir kez; sonra bellekten). */
function useDistrictMarkup(plate: number) {
  const [state, setState] = useState<{ markup: string | null; error: boolean }>(() => ({ markup: markupCache.get(plate) ?? null, error: false }));
  useEffect(() => {
    if (markupCache.has(plate)) return;
    let isActive = true;
    fetch(districtMapUrl(plate))
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error(String(response.status)))))
      .then((markup) => {
        markupCache.set(plate, markup);
        if (isActive) setState({ markup, error: false });
      })
      .catch(() => {
        if (isActive) setState({ markup: null, error: true });
      });
    return () => {
      isActive = false;
    };
  }, [plate]);
  return state;
}

/** Yerleşen ilçenin adı haritada ilçenin içine sığacak boyda yazılır; çok küçük ilçede yazılmaz, yalnızca yeşil olur. */
function addLabel(path: SVGPathElement, name: string, baseSize: number) {
  const svg = path.ownerSVGElement;
  if (!svg || svg.querySelector(`text[data-for="${path.id}"]`)) return;
  const box = path.getBBox();
  const size = Math.min(baseSize, box.width / (name.length * 0.62), box.height * 0.7);
  if (size < baseSize * 0.3) return;
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("data-for", path.id);
  label.setAttribute("x", path.dataset.lx ?? String(box.x + box.width / 2));
  label.setAttribute("y", path.dataset.ly ?? String(box.y + box.height / 2));
  label.setAttribute("font-size", size.toFixed(1));
  label.setAttribute("stroke-width", (size * 0.22).toFixed(1));
  label.textContent = name;
  svg.appendChild(label);
}

const ZOOM_BUTTON =
  "flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white/90 text-lg font-bold text-slate-600 shadow-sm backdrop-blur transition hover:text-cyan-700 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Haritayı tamamla: ilin bütün ilçeleri boş gelir. Oyuncu haritadan bir ilçeye ve alttaki listeden bir ada dokunur
 * (sırası serbest); ikisi eşleşirse ilçe yeşile döner, adı haritaya yazılır ve ad listeden düşer. Yanlış eşleşme
 * süreye ceza ekler. Bütün ilçeler yerleşince süre, hata ve yıldızlarla sonuç çıkar.
 */
function DistrictPuzzle({ plate, onBack }: { plate: number; onBack: () => void }) {
  const { districts: text } = messages();
  const province = DISTRICT_PROVINCES.find((candidate) => candidate.plate === plate);
  const districts = useMemo(() => districtsOf(plate), [plate]);
  const nameById = useMemo(() => new Map(districts.map((district) => [district.id, district.name])), [districts]);
  const { markup, error } = useDistrictMarkup(plate);

  const [placed, setPlaced] = useState<Set<string>>(() => new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [wrong, setWrong] = useState<{ id: string; name: string; key: number } | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [streak, setStreak] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [query, setQuery] = useState("");

  const total = districts.length;
  const isDone = placed.size === total && total > 0;
  const elapsedMs = startedAt === null ? 0 : (finishedAt ?? now) - startedAt;
  const totalSeconds = Math.round(elapsedMs / 1000) + mistakes * DISTRICT_PENALTY_SECONDS;

  useEffect(() => {
    primeSound();
  }, []);

  // Süre ilk dokunuşta başlar, harita tamamlanınca durur.
  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [startedAt, finishedAt]);

  const containerRef = useRef<HTMLDivElement>(null);
  const { isAtHome, canZoomIn, canZoomOut, zoomIn, zoomOut, reset, wasDragged, panHandlers } = useMapZoom(containerRef, markup);

  const attempt = useCallback(
    (id: string, name: string) => {
      const at = Date.now();
      setStartedAt((current) => current ?? at);
      setSelectedId(null);
      setSelectedName(null);
      if (nameById.get(id) === name) {
        vibrate("correct");
        playSound("correct");
        setStreak((value) => value + 1);
        setQuery("");
        setPlaced((current) => {
          const next = new Set(current).add(id);
          if (next.size === total) setFinishedAt(at);
          return next;
        });
        const path = containerRef.current?.querySelector<SVGPathElement>(`path[id="${id}"]`);
        if (path) {
          path.classList.remove("district-pop");
          // Animasyon her yerleşmede yeniden oynasın.
          void path.getBoundingClientRect();
          path.classList.add("district-pop");
        }
      } else {
        vibrate("incorrect");
        playSound("incorrect");
        setStreak(0);
        setMistakes((value) => value + 1);
        setWrong({ id, name, key: at });
      }
    },
    [nameById, total],
  );

  // Seri kutlaması: 3, 5, 10… doğru üst üste.
  useEffect(() => {
    if (streak >= 3 && (streak === 3 || streak % 5 === 0)) {
      const timer = window.setTimeout(() => playSound("streak"), 180);
      return () => window.clearTimeout(timer);
    }
  }, [streak]);

  // Yanlış eşleşmenin kırmızısı bir an sonra kalkar.
  useEffect(() => {
    if (!wrong) return;
    const timer = window.setTimeout(() => setWrong(null), 700);
    return () => window.clearTimeout(timer);
  }, [wrong]);

  // Haritadaki ilçelerin durumu (seçili, yerleşmiş, yanlış) ve yerleşenlerin adları.
  useEffect(() => {
    const container = containerRef.current;
    const svg = container?.querySelector("svg");
    if (!container || !svg) return;
    const width = Number(svg.getAttribute("viewBox")?.split(/\s+/)[2] ?? 1000);
    const baseSize = width / 42;
    container.querySelectorAll<SVGPathElement>("path[id]").forEach((path) => {
      const isPlaced = placed.has(path.id);
      path.classList.toggle("district-done", isPlaced);
      path.classList.toggle("district-selected", path.id === selectedId);
      path.classList.toggle("district-wrong", path.id === wrong?.id);
      path.setAttribute("role", isPlaced ? "img" : "button");
      path.setAttribute("tabindex", isPlaced ? "-1" : "0");
      path.setAttribute("aria-label", isPlaced ? (nameById.get(path.id) ?? "") : text.whichName);
      if (isPlaced) addLabel(path, nameById.get(path.id) ?? "", baseSize);
    });
  }, [markup, placed, selectedId, wrong, nameById, text.whichName]);

  const pickDistrict = (id: string) => {
    if (placed.has(id) || isDone) return;
    setStartedAt((current) => current ?? Date.now());
    if (selectedName) attempt(id, selectedName);
    else setSelectedId((current) => (current === id ? null : id));
  };

  const pickName = (name: string) => {
    if (isDone) return;
    setStartedAt((current) => current ?? Date.now());
    if (selectedId) attempt(selectedId, name);
    else setSelectedName((current) => (current === name ? null : name));
  };

  const restart = () => {
    setPlaced(new Set());
    setSelectedId(null);
    setSelectedName(null);
    setMistakes(0);
    setStreak(0);
    setStartedAt(null);
    setFinishedAt(null);
    setQuery("");
    containerRef.current?.querySelectorAll("text[data-for]").forEach((label) => label.remove());
    reset();
  };

  const remaining = districts.filter((district) => !placed.has(district.id));
  const search = query.trim().toLocaleLowerCase("tr");
  const listed = search ? remaining.filter((district) => district.name.toLocaleLowerCase("tr").includes(search)) : remaining;
  const prompt = selectedName ? text.whereIs(selectedName) : selectedId ? text.whichName : text.hint;

  return (
    <div className="flex min-h-0 flex-1 flex-col side:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Üst bar: geri, ilin adı, seri ve hata; altında yerleşen ilçe ve süre akışı. */}
        <header className="shrink-0 px-3 pt-2 pb-2.5 lg:px-5 lg:pt-3">
          <div className="flex items-center gap-2">
            <button aria-label={text.back} className={ROUND_BUTTON} onClick={onBack} title={text.back} type="button">
              <BackArrow />
            </button>
            <h1 className="min-w-0 flex-1 truncate font-display text-2xl leading-none font-bold lg:text-3xl">{province?.name}</h1>
            {streak >= 2 && (
              <span className={`score-bump shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${streak >= 5 ? "bg-rose-500" : streak >= 3 ? "bg-orange-500" : "bg-amber-400 text-amber-950"}`} key={streak}>
                🔥 {streak}x
              </span>
            )}
            {mistakes > 0 && <span className="shrink-0 rounded-full bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-200">✕ {text.mistakes(mistakes)}</span>}
          </div>
          <div className="mt-2 flex items-center gap-2 lg:gap-3">
            <span className="flex w-[4.5rem] shrink-0 items-center gap-1 text-sm font-bold tabular-nums lg:w-24 lg:text-lg" title={text.placed}>
              <span aria-hidden="true" className="text-emerald-400">✓</span>
              {placed.size}
              <span className="text-white/45">/{total}</span>
            </span>
            <div
              aria-label={text.placed}
              aria-valuemax={total}
              aria-valuemin={0}
              aria-valuenow={placed.size}
              className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15 lg:h-2.5"
              role="progressbar"
            >
              <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300" style={{ width: `${total ? (placed.size / total) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-sm font-bold tabular-nums lg:text-lg">
            <span className="flex w-[4.5rem] shrink-0 items-center gap-1 lg:w-24">
              <span aria-hidden="true">⏱</span>
              {formatTime(totalSeconds)}
            </span>
            <span className="truncate text-xs font-semibold text-cyan-100/70 lg:text-sm">{text.penaltyNote(DISTRICT_PENALTY_SECONDS)}</span>
          </div>
        </header>

        <div className="map-sea relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
          {markup ? (
            <div
              className="map district-map map-interactive"
              dangerouslySetInnerHTML={{ __html: markup }}
              onClick={(event) => {
                if (wasDragged()) return;
                const path = (event.target as Element).closest<SVGPathElement>("path[id]");
                if (path) pickDistrict(path.id);
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                const path = (event.target as Element).closest<SVGPathElement>("path[id]");
                if (path) {
                  event.preventDefault();
                  pickDistrict(path.id);
                }
              }}
              ref={containerRef}
              {...panHandlers}
            />
          ) : (
            <p className="text-sm font-semibold text-sky-900/70">{error ? text.mapError : text.mapLoading}</p>
          )}
          <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1.5">
            {!isAtHome && (
              <button className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm" onClick={reset} type="button">
                {text.resetZoom}
              </button>
            )}
            <button aria-label={text.zoomIn} className={ZOOM_BUTTON} disabled={!canZoomIn} onClick={zoomIn} type="button">
              +
            </button>
            <button aria-label={text.zoomOut} className={ZOOM_BUTTON} disabled={!canZoomOut} onClick={zoomOut} type="button">
              −
            </button>
          </div>
        </div>
      </div>

      {/* Ad listesi: dikeyde haritanın altında, yatay ve geniş ekranda sağda. Yerleşen ad listeden düşer. */}
      <section
        aria-label={text.remaining(remaining.length)}
        className="flex h-[40%] shrink-0 flex-col rounded-t-3xl bg-white px-3 pt-3 pb-3 text-slate-900 side:h-auto side:w-80 side:rounded-none side:rounded-l-3xl lg:side:w-96 lg:px-5"
      >
        <div className="flex shrink-0 items-center justify-between gap-2">
          <p aria-live="polite" className={`line-clamp-2 min-h-10 min-w-0 text-sm font-bold ${selectedId || selectedName ? "text-amber-700" : "text-slate-600"}`}>
            {prompt}
          </p>
          <span className="shrink-0 text-xs font-semibold text-slate-400">{text.remaining(remaining.length)}</span>
        </div>
        {remaining.length > 12 && (
          <input
            aria-label={text.searchName}
            autoComplete="off"
            className="mt-2 h-9 w-full shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold focus:border-cyan-400 focus:outline-none"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.searchName}
            type="search"
            value={query}
          />
        )}
        <div className="-mx-1 mt-2 min-h-0 flex-1 overflow-y-auto px-1 pb-1">
          <ul className="flex flex-wrap gap-1.5 lg:gap-2">
            {listed.map((district: District) => {
              const isSelected = selectedName === district.name;
              const isWrong = wrong?.name === district.name;
              return (
                <li key={district.id}>
                  <button
                    aria-pressed={isSelected}
                    className={`press press-sm cursor-pointer rounded-xl border px-2.5 py-1.5 text-sm font-bold transition-colors focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:px-3 lg:py-2 lg:text-base ${
                      isWrong
                        ? "border-rose-300 bg-rose-500 text-white [--press-edge:#9f1239]"
                        : isSelected
                          ? "border-amber-300 bg-amber-300 text-amber-950 [--press-edge:#b45309]"
                          : "border-slate-200 bg-slate-50 text-slate-800 [--press-edge:#cbd5e1] hover:bg-white"
                    }`}
                    onClick={() => pickName(district.name)}
                    type="button"
                  >
                    {district.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {isDone && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
          <div className="w-full max-w-sm rounded-3xl border-2 border-slate-200 bg-white p-5 text-center text-slate-900 shadow-2xl">
            <RoundCelebration score={districtScore(total, mistakes)} total={total} />
            <p className="mt-2 font-display text-2xl font-bold">{text.done}</p>
            <p className="text-sm font-semibold text-slate-500">
              {province?.name} · {text.districtCount(total)}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">{text.time}</dt>
                <dd className="text-xl font-bold tabular-nums">{formatTime(totalSeconds)}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 px-3 py-2">
                <dt className="text-xs text-slate-500">{text.mistakesLabel}</dt>
                <dd className="text-xl font-bold tabular-nums">{mistakes}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-col gap-2">
              <button className={PRIMARY_BUTTON_CLASS} onClick={restart} type="button">
                {text.playAgain}
              </button>
              <button className="text-sm font-semibold text-cyan-700 underline-offset-4 hover:underline" onClick={onBack} type="button">
                {text.otherProvince}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

