"use client";

import { useEffect, useRef, useState } from "react";
import { vibrate } from "@/lib/haptics";
import { canLockLandscape, keepLandscapeLock, lockLandscape, releaseLandscapeLock } from "@/lib/orientation";
import { useMapZoom } from "@/lib/hooks/useMapZoom";
import {
  correctLocationId,
  isSameLocation,
  locationIdOf,
  LOCATION_SELECTOR,
  type AnswerState,
  type GameMode,
  type Question,
} from "@/lib/game";
import { type MapBox } from "@/lib/world-countries";

type GameMapProps = {
  mode: GameMode;
  mapMarkup: string | null;
  mapError: string | null;
  isInteractive: boolean;
  question: Question | undefined;
  answerState: AnswerState;
  selectedLocation: string | null;
  /** Verilirse yalnızca bu konumlar seçilebilir; diğerleri soluk ve tıklanamaz görünür (kıta antrenmanı). */
  activeLocationIds?: ReadonlySet<string> | null;
  /** Haritanın açılış görünümü; verilmezse haritanın tamamı. */
  homeView?: MapBox | null;
  /** Düello: oyuncunun verdiği ama sorusu henüz kapanmamış cevap. Doğru cevabı açık etmeden işaretlenir. */
  pendingLocation?: string | null;
  /** Düello: rakibin tıkladığı yer (sunucu ancak oyuncu cevapladıktan ya da soru bittikten sonra verir). */
  opponentLocation?: string | null;
  /** Haritanın üstünde bir an beliren kutlama (ör. "🔥 3 seri"); değiştikçe yeniden oynar. */
  celebration?: string | null;
  /** Cevaptan sonra haritanın üst ortasında duran geri sayım, ör. "Sonraki soru · 2 sn". */
  countdown?: string | null;
  /** Bildirimler dikey telefonda üst barda gösteriliyorsa (GameTopBar) haritanın üstünde dar ekranda gizlenir. */
  areNoticesInHeaderWhenNarrow?: boolean;
  onSelect: (locationId: string) => void;
};

/**
 * Dokunulan nokta bir yere denk gelmezse (çoğunlukla denizde) yakındaki yer aranır: Malta, Singapur, Bahreyn gibi
 * küçük ülkeler parmağın altında kaybolur. Yalnızca dokunmatikte uygulanır; farenin ıskalaması bilinçlidir.
 */
const TAP_TOLERANCE_RADII_PX = [6, 11, 16];
const TAP_TOLERANCE_DIRECTIONS = 8;

function locationNear(container: HTMLElement, mode: GameMode, clientX: number, clientY: number) {
  for (const radius of TAP_TOLERANCE_RADII_PX) {
    for (let step = 0; step < TAP_TOLERANCE_DIRECTIONS; step += 1) {
      const angle = (step / TAP_TOLERANCE_DIRECTIONS) * 2 * Math.PI;
      const element = document.elementFromPoint(clientX + radius * Math.cos(angle), clientY + radius * Math.sin(angle));
      const location = element?.closest<SVGElement>(LOCATION_SELECTOR[mode]);
      if (location && container.contains(location)) return locationIdOf(location, mode);
    }
  }
  return undefined;
}

/** Seri bu sayıya ulaşınca her doğru cevapta haritanın üstünde kısa bir kutlama belirir. */
const STREAK_CELEBRATION_FROM = 3;

/** Cevaptan sonraki geri sayım; son soruda sonuç ekranına geçişi söyler. Cevap yokken gösterilmez. */
export function nextQuestionCountdown(answerState: AnswerState, seconds: number, isLastQuestion: boolean): string | null {
  return answerState ? `${isLastQuestion ? "Sonuçlar" : "Sonraki soru"} · ${seconds} sn` : null;
}

/** Doğru cevaptan sonra gösterilecek seri kutlaması; seri kısaysa ya da cevap yanlışsa yok. */
export function streakCelebration(answerState: AnswerState, streak: number): string | null {
  return answerState === "correct" && streak >= STREAK_CELEBRATION_FROM ? `🔥 ${streak} seri` : null;
}

/** Dikey ipucu bir kez kapatılınca sayfa açık kaldıkça bir daha gösterilmez (turlar arasında da). */
let isRotateHintDismissed = false;

/**
 * Dikeyde oynanırken haritanın sol altındaki küçük ipucu: yatayda harita iki kat büyür. Yalnızca dikey telefonda
 * görünür (portrait:max-lg); oyuncu kapatabilir. Mobil uygulamada ipucu bir tuştur: dokununca ekran yataya kilitlenir,
 * telefonun yön kilidi açık olsa bile. Dokunmalar haritaya geçmesin diye kendi alanı tıklanabilir.
 */
function RotateHint() {
  const [isDismissed, setIsDismissed] = useState(isRotateHintDismissed);
  if (isDismissed) return null;
  const icon = (
    <svg aria-hidden="true" className="h-4 w-4 text-cyan-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect height="14" rx="2" width="20" x="2" y="5" />
      <path d="M9 2.5 12 5 9 7.5" />
    </svg>
  );
  return (
    <div className="absolute bottom-3 left-3 z-10 hidden items-center gap-1 rounded-full border border-slate-200 bg-white/90 py-1 pr-1 pl-3 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur portrait:max-lg:flex">
      {canLockLandscape() ? (
        <button className="flex items-center gap-1 text-cyan-700" onClick={() => void lockLandscape()} type="button">
          {icon}
          Yatay moda geç
        </button>
      ) : (
        <>
          {icon}
          Yan çevirirsen harita büyür
        </>
      )}
      <button
        aria-label="İpucunu kapat"
        className="hit-area flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        onClick={() => {
          isRotateHintDismissed = true;
          setIsDismissed(true);
        }}
        type="button"
      >
        ✕
      </button>
    </div>
  );
}

const ZOOM_BUTTON_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-lg pointer-coarse:h-11 pointer-coarse:w-11 border border-slate-200 bg-white/90 text-lg font-bold text-slate-600 shadow-sm backdrop-blur transition hover:border-cyan-300 hover:text-cyan-700 focus:ring-2 focus:ring-cyan-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";

export function GameMap({
  mode,
  mapMarkup,
  mapError,
  isInteractive,
  question,
  answerState,
  selectedLocation,
  activeLocationIds = null,
  homeView = null,
  pendingLocation = null,
  opponentLocation = null,
  celebration = null,
  countdown = null,
  areNoticesInHeaderWhenNarrow = false,
  onSelect,
}: GameMapProps) {
  // Mobil uygulamada ipucuyla konan yatay kilit oyun boyunca sürer; harita kaldırılınca (oyun bitince) kalkar.
  useEffect(() => {
    keepLandscapeLock();
    return releaseLandscapeLock;
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointerType = useRef("mouse");
  const { zoom, isAtHome, canZoomIn, canZoomOut, zoomIn, zoomOut, reset, ensureVisible, restoreAfterReveal, wasDragged, panHandlers } = useMapZoom(
    containerRef,
    mapMarkup,
    homeView,
  );

  // Harita işaretlemesi turlar arasında aynı DOM'da kalabildiği için sınıf her iki yönde de güncellenir.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.querySelectorAll<SVGGraphicsElement>(LOCATION_SELECTOR[mode]).forEach((location) => {
      const locationId = locationIdOf(location, mode);
      const isInactive = activeLocationIds !== null && (locationId === undefined || !activeLocationIds.has(locationId));
      location.classList.toggle("map-inactive", isInactive);
      location.setAttribute("tabindex", isInactive ? "-1" : "0");
    });
  }, [activeLocationIds, mapMarkup, mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !question) return;
    const correctLocation = correctLocationId(question);
    // Yeni soruya geçildi: doğru cevap için kaydırılan görünüm oyuncunun bıraktığı yere döner.
    if (answerState === null) restoreAfterReveal();
    container.querySelectorAll<SVGGraphicsElement>(LOCATION_SELECTOR[mode]).forEach((location) => {
      const locationId = locationIdOf(location, mode);
      const isCorrect = isSameLocation(mode, locationId, correctLocation);
      location.classList.toggle("map-correct", answerState !== null && isCorrect);
      location.classList.toggle("map-incorrect", answerState === "incorrect" && isSameLocation(mode, locationId, selectedLocation));
      location.classList.toggle("map-pending", answerState === null && isSameLocation(mode, locationId, pendingLocation));
      location.classList.toggle("map-opponent", isSameLocation(mode, locationId, opponentLocation));
      if (answerState !== null && isCorrect) {
        // Büyüme animasyonu komşu yerlerin altında kalmasın: SVG'de sonra çizilen üstte durur. Zaten sondaysa
        // dokunulmaz; taşımak animasyonu baştan başlatır.
        if (location.parentNode && location.parentNode.lastElementChild !== location) location.parentNode.appendChild(location);
        ensureVisible(location);
      }
    });
  }, [answerState, ensureVisible, mapMarkup, mode, opponentLocation, pendingLocation, question, restoreAfterReveal, selectedLocation]);

  // Oyuncu cevap verdiği anda kısa bir titreşim (Android). Düelloda oyuncu cevaplamadan biten soruda titremez.
  const previousAnswerState = useRef<AnswerState>(null);
  useEffect(() => {
    if (answerState && !previousAnswerState.current && selectedLocation) vibrate(answerState === "correct" ? "correct" : "incorrect");
    previousAnswerState.current = answerState;
  }, [answerState, selectedLocation]);

  const selectFromEvent = (target: EventTarget) => {
    const location = (target as Element).closest<SVGElement>(LOCATION_SELECTOR[mode]);
    return locationIdOf(location, mode);
  };

  if (!mapMarkup) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-50 text-center text-sm text-slate-400">
        {mapError ?? "Harita yükleniyor..."}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-slate-50">
      <div
        className={`map ${isInteractive ? "map-interactive" : "pointer-events-none opacity-70"}`}
        dangerouslySetInnerHTML={{ __html: mapMarkup }}
        id="game-map"
        onClick={(event) => {
          if (wasDragged()) return;
          const locationId =
            selectFromEvent(event.target) ??
            (lastPointerType.current === "mouse" ? undefined : locationNear(event.currentTarget, mode, event.clientX, event.clientY));
          if (locationId) onSelect(locationId);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          const locationId = selectFromEvent(event.target);
          if (locationId) {
            event.preventDefault();
            onSelect(locationId);
          }
        }}
        ref={containerRef}
        {...panHandlers}
        onPointerDown={(event) => {
          lastPointerType.current = event.pointerType;
          panHandlers.onPointerDown(event);
        }}
      />

      {/* Haritanın üst ortası: seri kutlaması ve altında sonraki soruya geri sayım. Üst bar dar ekranda kalabalık olduğu
          için geri sayım burada durur. Dokunmalar haritaya geçer. */}
      {(celebration || countdown) && (
        <div
          aria-live="polite"
          className={`pointer-events-none absolute inset-x-0 top-3 z-10 flex flex-col items-center gap-2 lg:top-5 ${areNoticesInHeaderWhenNarrow ? "max-sm:hidden" : ""}`}
        >
          {celebration && (
            <p
              className="streak-pop rounded-full bg-amber-400 px-4 py-1.5 font-display text-lg font-bold whitespace-nowrap text-amber-950 shadow-lg shadow-amber-500/30 lg:px-5 lg:py-2 lg:text-2xl"
              key={celebration}
            >
              {celebration}
            </p>
          )}
          {countdown && (
            <p className="rounded-full border border-cyan-200 bg-white/90 px-3.5 py-1 text-xs font-bold whitespace-nowrap text-cyan-800 tabular-nums shadow-sm backdrop-blur lg:px-4 lg:py-1.5 lg:text-sm">
              {countdown}
            </p>
          )}
        </div>
      )}

      <RotateHint />

      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1.5">
        {!isAtHome && (
          <button
            className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-bold pointer-coarse:py-2 pointer-coarse:text-xs text-slate-600 shadow-sm backdrop-blur transition hover:border-cyan-300 hover:text-cyan-700 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
            onClick={reset}
            type="button"
          >
            Sıfırla · {zoom.toFixed(1)}x
          </button>
        )}
        <button aria-label="Yakınlaştır" className={ZOOM_BUTTON_CLASS} disabled={!canZoomIn} onClick={zoomIn} type="button">+</button>
        <button aria-label="Uzaklaştır" className={ZOOM_BUTTON_CLASS} disabled={!canZoomOut} onClick={zoomOut} type="button">−</button>
      </div>
    </div>
  );
}
