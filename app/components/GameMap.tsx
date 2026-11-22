"use client";

import { messages } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { vibrate } from "@/lib/haptics";
import { playSound, primeSound } from "@/lib/sound";
import { canLockLandscape, keepLandscapeLock, lockLandscape, releaseLandscapeLock } from "@/lib/orientation";
import { useMapZoom } from "@/lib/hooks/useMapZoom";
import {
  correctLocationId,
  formatPlate,
  isPlateChoice,
  isSameLocation,
  locationIdOf,
  locationName,
  LOCATION_SELECTOR,
  normalizeLocationId,
  type AnswerState,
  type GameMode,
  type PlayChoice,
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
  /** Verilirse cevaptan sonra haritaya dokunmak sonraki soruya geçirir (kısa gösterim: Oyna, Antrenman). */
  onContinue?: () => void;
  /**
   * Şıklı soru: doğru yer haritada işaretlenir (map-marked) ve oraya odaklanılır (küçükse yakınlaşılır); harita seçim
   * almaz, cevap şıklardan gelir. Cevaptan sonra olağan doğru/yanlış renkleri görünür.
   */
  isMarking?: boolean;
  /**
   * Şıklı soruda işaretlenecek yer. Verilmezse sorunun doğru yeridir; komşuluk sorusunda işaretlenen il konudur ve doğru cevap
   * (haritada yeşil boyanan) komşusudur, ayrı bir yerdir.
   */
  markedLocation?: string | null;
  /** Yanlış cevapta oyuncunun tıkladığı yerin adı, ör. "Kayseri" (wrongPickNotice). */
  wrongPick?: string | null;
  /**
   * Doğru yerin komşuları (yer kimlikleri; lib/neighbors.ts). Verilirse yanlış cevaptan sonra haritada kesik çizgili açık yeşille
   * işaretlenir, adları yazılır ve oyuncunun tıkladığı yer bir komşuysa "Komşu il" rozeti çıkar. Yalnızca Türkiye illerinde var.
   */
  neighborIds?: readonly string[] | null;
  /**
   * Komşuluk sorusunda komşular (konunun komşuları) cevap doğru da olsa yanlış da olsa gösterilir: bütün komşuları görmek öğrenmenin
   * kendisidir. Olağan turlarda yalnızca yanlış cevaptan sonra gösterilir. `neighborsLabel` o yazının başlığıdır ("Kayseri · komşuları").
   */
  alwaysShowNeighbors?: boolean;
  neighborsLabel?: string | null;
  /** Bildirimler (seri, geri sayım) dikey telefonda üst barda gösteriliyorsa (GameTopBar) haritanın üstünde dar ekranda gizlenir. */
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

/**
 * Cevaptan sonraki geri sayım; son soruda sonuç ekranına geçişi söyler. Cevap yokken gösterilmez. Kısa gösterimde
 * (`isQuick`) doğru cevaptan sonra 1 saniyelik bir geri sayım gürültü olur, gösterilmez; yanlış cevapta dokunarak
 * geçilebildiği söylenir.
 */
export function nextQuestionCountdown(answerState: AnswerState, seconds: number, isLastQuestion: boolean, isQuick = false): string | null {
  const { game, common } = messages();
  if (!answerState) return null;
  if (isQuick) return answerState === "correct" ? null : `${game.tapToContinue} · ${common.seconds(seconds)}`;
  return `${isLastQuestion ? game.results : game.nextQuestion} · ${common.seconds(seconds)}`;
}

/**
 * Yanlış cevapta oyuncunun tıkladığı yerin adı; kırmızı yanan yerin ne olduğunu öğrensin. Plaka turunda plakasıyla
 * ("38 Kayseri"). Yalnızca ad yazar; kırmızı rengi haritada kırmızı yanan yerle eşleşir.
 */
export function wrongPickNotice(choice: PlayChoice, answerState: AnswerState, selectedLocation: string | null): string | null {
  if (answerState !== "incorrect" || !selectedLocation) return null;
  const locationId = normalizeLocationId(choice.mode, selectedLocation);
  const name = locationName(choice.mode, locationId);
  return isPlateChoice(choice) ? `${formatPlate(Number(locationId))} ${name}` : name;
}

/** Doğru cevaptan sonra gösterilecek seri kutlaması; seri kısaysa ya da cevap yanlışsa yok. */
export function streakCelebration(answerState: AnswerState, streak: number): string | null {
  return answerState === "correct" && streak >= STREAK_CELEBRATION_FROM ? messages().game.streak(streak) : null;
}

/** Dikey ipucu bir kez kapatılınca sayfa açık kaldıkça bir daha gösterilmez (turlar arasında da). */
let isRotateHintDismissed = false;

/**
 * Dikeyde oynanırken haritanın sol altındaki küçük ipucu: yatayda harita iki kat büyür. Yalnızca dikey telefonda
 * görünür (portrait-phone); oyuncu kapatabilir. Mobil uygulamada ipucu bir tuştur: dokununca ekran yataya kilitlenir,
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
    <div className="absolute bottom-3 left-3 z-10 hidden items-center gap-1 rounded-full border border-slate-200 bg-white/90 py-1 pr-1 pl-3 text-xs font-semibold text-slate-600 shadow-sm backdrop-blur portrait-phone:flex">
      {canLockLandscape() ? (
        <button className="flex items-center gap-1 text-cyan-700" onClick={() => void lockLandscape()} type="button">
          {icon}
          {messages().game.toLandscape}
        </button>
      ) : (
        <>
          {icon}
          {messages().game.rotateHint}
        </>
      )}
      <button
        aria-label={messages().game.closeHint}
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
  wrongPick = null,
  neighborIds = null,
  alwaysShowNeighbors = false,
  neighborsLabel = null,
  areNoticesInHeaderWhenNarrow = false,
  onContinue,
  isMarking = false,
  markedLocation = null,
  onSelect,
}: GameMapProps) {
  // Mobil uygulamada ipucuyla konan yatay kilit oyun boyunca sürer; harita kaldırılınca (oyun bitince) kalkar.
  useEffect(() => {
    keepLandscapeLock();
    return releaseLandscapeLock;
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastPointerType = useRef("mouse");
  // Son dokunuşun haritadaki yeri (kapsayıcıya göre); doğru cevabın "+1"i oradan uçar. Klavyeyle seçilirse üst orta.
  const lastTapPoint = useRef<{ x: number; y: number } | null>(null);
  const [pointPop, setPointPop] = useState<{ x: number; y: number; key: number } | null>(null);

  useEffect(() => {
    primeSound();
  }, []);
  const { zoom, isAtHome, canZoomIn, canZoomOut, zoomIn, zoomOut, reset, ensureVisible, restoreAfterReveal, focusOn, wasDragged, panHandlers } = useMapZoom(
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
      // Şıklı soruda yerler seçilmez; klavyeyle 180 yerin arasında gezilmesin.
      location.setAttribute("tabindex", isInactive || isMarking ? "-1" : "0");
    });
  }, [activeLocationIds, isMarking, mapMarkup, mode]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !question) return;
    const correctLocation = correctLocationId(question);
    // Yeni soruya geçildi: doğru cevap için kaydırılan görünüm oyuncunun bıraktığı yere döner. Şıklı soruda bunu focusOn yapar:
    // iki ayrı adım olsaydı yakınlaştırma, geri dönüş animasyonunun ortasındaki görünümü "önceki" diye kaydederdi.
    if (answerState === null && !isMarking) restoreAfterReveal();
    container.querySelectorAll<SVGGraphicsElement>(LOCATION_SELECTOR[mode]).forEach((location) => {
      const locationId = locationIdOf(location, mode);
      const isCorrect = isSameLocation(mode, locationId, correctLocation);
      // Komşuluk sorusunda işaretli il (konu) cevaptan sonra da işaretli kalır: komşular onun çevresinde gösterilir. Olağan şıklı
      // soruda işaretli yer cevabın kendisidir ve cevaptan sonra yeşile döner.
      const isMarked = isMarking && (answerState === null || markedLocation !== null) && isSameLocation(mode, locationId, markedLocation ?? correctLocation);
      location.classList.toggle("map-marked", isMarked);
      location.classList.toggle("map-correct", answerState !== null && isCorrect);
      location.classList.toggle("map-incorrect", answerState === "incorrect" && isSameLocation(mode, locationId, selectedLocation));
      location.classList.toggle("map-pending", answerState === null && isSameLocation(mode, locationId, pendingLocation));
      location.classList.toggle("map-opponent", isSameLocation(mode, locationId, opponentLocation));
      if (isMarked) {
        // İşaretli yer komşularının altında kalmasın; zaten sondaysa dokunulmaz (taşımak animasyonu baştan başlatır).
        if (location.parentNode && location.parentNode.lastElementChild !== location) location.parentNode.appendChild(location);
        // Odaklanma yalnızca yeni soruda; cevaptan sonra harita doğru yere kayabilir (ensureVisible), konuya geri sıçramasın.
        if (answerState === null) focusOn(location);
      }
      if (answerState !== null && isCorrect) {
        // Büyüme animasyonu komşu yerlerin altında kalmasın: SVG'de sonra çizilen üstte durur. Zaten sondaysa
        // dokunulmaz; taşımak animasyonu baştan başlatır.
        if (location.parentNode && location.parentNode.lastElementChild !== location) location.parentNode.appendChild(location);
        // Yanlış cevapta doğru yer ekranda çok küçükse (Malta, Lüksemburg) harita oraya yakınlaşır; oyuncu yeri
        // görerek öğrensin. Doğru bilen zaten yeri bulduğu için harita yerinde kalır.
        ensureVisible(location, { zoomIfSmall: answerState === "incorrect" });
      }
    });
  }, [answerState, ensureVisible, focusOn, isMarking, mapMarkup, markedLocation, mode, opponentLocation, pendingLocation, question, restoreAfterReveal, selectedLocation]);

  // Yanlış cevaptan sonra doğru yerin komşuları: ayrı bir efekt, çünkü cevap efekti her değişimde görünümü yeniden oynatır.
  const neighborKey = neighborIds?.join(",") ?? "";
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isShown = answerState === "incorrect" || (alwaysShowNeighbors && answerState !== null);
    const wanted = isShown && neighborKey ? new Set(neighborKey.split(",").map(Number)) : null;
    container.querySelectorAll<SVGGraphicsElement>(LOCATION_SELECTOR[mode]).forEach((location) => {
      const locationId = locationIdOf(location, mode);
      location.classList.toggle("map-neighbor", wanted !== null && locationId !== undefined && wanted.has(Number(locationId)));
    });
  }, [alwaysShowNeighbors, answerState, mapMarkup, mode, neighborKey, question]);

  // Oyuncu cevap verdiği anda kısa bir titreşim ve ses; doğruysa dokunduğu yerden "+1" uçar. Düelloda oyuncu
  // cevaplamadan biten soruda tepki yok.
  const previousAnswerState = useRef<AnswerState>(null);
  useEffect(() => {
    if (answerState && !previousAnswerState.current && selectedLocation) {
      const isCorrect = answerState === "correct";
      vibrate(isCorrect ? "correct" : "incorrect");
      playSound(isCorrect ? "correct" : "incorrect");
      if (isCorrect) {
        const container = containerRef.current;
        const point = lastTapPoint.current ?? (container ? { x: container.clientWidth / 2, y: container.clientHeight * 0.35 } : null);
        if (point) setPointPop({ ...point, key: Date.now() });
      }
    }
    previousAnswerState.current = answerState;
  }, [answerState, selectedLocation]);

  // Seri kutlaması belirdiğinde kısa bir fanfar (cevap sesinin hemen ardından).
  useEffect(() => {
    if (!celebration) return;
    const timer = window.setTimeout(() => playSound("streak"), 180);
    return () => window.clearTimeout(timer);
  }, [celebration]);

  const selectFromEvent = (target: EventTarget) => {
    const location = (target as Element).closest<SVGElement>(LOCATION_SELECTOR[mode]);
    return locationIdOf(location, mode);
  };

  if (!mapMarkup) {
    return (
      <div className="map-sea flex min-h-0 flex-1 items-center justify-center text-center text-sm font-semibold text-sky-900/60">
        {mapError ?? messages().game.mapLoading}
      </div>
    );
  }

  return (
    <div className="map-sea relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
      <div
        className={`map ${isInteractive ? "map-interactive" : "pointer-events-none opacity-70"} ${isMarking ? "map-marking" : ""}`}
        dangerouslySetInnerHTML={{ __html: mapMarkup }}
        id="game-map"
        onClick={(event) => {
          if (wasDragged()) return;
          // Kısa gösterimde cevaptan sonra haritanın her yerine dokunmak sonraki soruya geçirir; cevap ve haritadaki
          // yer seçimi bu sırada zaten kilitlidir.
          if (answerState && onContinue) return onContinue();
          // Şıklı soruda cevap şıklardan gelir; harita yalnızca gezilir (kaydırma, yakınlaştırma).
          if (isMarking) return;
          const bounds = containerRef.current?.parentElement?.getBoundingClientRect();
          // "+1" ekranın kenarında kırpılmasın: kenara yakın dokunuşta biraz içeriden uçar.
          lastTapPoint.current =
            bounds && event.detail > 0
              ? { x: Math.min(Math.max(event.clientX - bounds.left, 32), bounds.width - 32), y: Math.max(event.clientY - bounds.top, 56) }
              : null;
          const locationId =
            selectFromEvent(event.target) ??
            (lastPointerType.current === "mouse" ? undefined : locationNear(event.currentTarget, mode, event.clientX, event.clientY));
          if (locationId) onSelect(locationId);
        }}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          if (answerState && onContinue) {
            event.preventDefault();
            return onContinue();
          }
          if (isMarking) return;
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

      {/* Haritanın üst ortası: seri kutlaması, altında sonraki soruya geri sayım. Dikey telefonda bunlar üst barın soru
          şeridindedir. Dokunmalar haritaya geçer. */}
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
          <div className="flex flex-wrap items-center justify-center gap-2 empty:hidden">
            {countdown && (
              <p className="rounded-full border border-cyan-200 bg-white/90 px-3.5 py-1 text-xs font-bold whitespace-nowrap text-cyan-800 tabular-nums shadow-sm backdrop-blur lg:px-4 lg:py-1.5 lg:text-sm">
                {countdown}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Yanlış cevap: oyuncunun dokunduğu yerin adı sorudan ayrı, haritanın altında kırmızı bir etikette ve çarpıyla;
          haritada kırmızı yanan yerle eşleşir. Dikey telefonda yön ipucunun üstünde durur. */}
      {(wrongPick || (alwaysShowNeighbors && answerState)) && (
        <div aria-live="polite" className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex flex-col items-center gap-2 px-16 portrait-phone:bottom-14 lg:bottom-6">
          {/* Doğru yerin komşuları: oyuncu yanlış bildiği yerin çevresini de öğrensin. Kimlikler ad sırasına göre dizilir. */}
          {neighborIds && neighborIds.length > 0 && (
            <p className="line-clamp-2 max-w-md rounded-xl border border-emerald-300 bg-white/95 px-3 py-1 text-center text-xs font-semibold text-emerald-900 shadow-md lg:text-sm">
              <span className="font-bold">{neighborsLabel ?? messages().game.neighborsOf}:</span>{" "}
              {[...neighborIds]
                .map((id) => locationName(mode, id))
                .sort((a, b) => a.localeCompare(b, "tr"))
                .join(" · ")}
            </p>
          )}
          {wrongPick && (
          <p className="badge-pop flex max-w-full min-w-0 items-center gap-2 rounded-2xl border-2 border-rose-300 bg-rose-500 py-1.5 pr-4 pl-1.5 text-white shadow-lg shadow-rose-900/25 lg:gap-3 lg:py-2 lg:pr-5 lg:pl-2">
            <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white text-rose-600 lg:h-9 lg:w-9">
              <svg className="h-4 w-4 lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={3.5} viewBox="0 0 24 24">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.12em] text-rose-100 uppercase lg:text-xs">
                {messages().game.yourPick}
                {neighborIds && selectedLocation && neighborIds.some((id) => isSameLocation(mode, id, selectedLocation)) && (
                  <span className="rounded-full bg-emerald-200 px-1.5 py-px tracking-normal text-emerald-900 normal-case">{messages().game.neighborBadge}</span>
                )}
              </span>
              <span className="truncate font-display text-lg font-bold lg:text-2xl">{wrongPick}</span>
            </span>
          </p>
          )}
        </div>
      )}

      {pointPop && (
        <span
          aria-hidden="true"
          className="point-float pointer-events-none absolute z-20 font-display text-3xl font-bold text-emerald-50 lg:text-4xl"
          key={pointPop.key}
          onAnimationEnd={() => setPointPop(null)}
          style={{ left: pointPop.x, top: pointPop.y }}
        >
          +1
        </span>
      )}

      <RotateHint />

      <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1.5">
        {!isAtHome && (
          <button
            className="rounded-lg border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-bold pointer-coarse:py-2 pointer-coarse:text-xs text-slate-600 shadow-sm backdrop-blur transition hover:border-cyan-300 hover:text-cyan-700 focus:ring-2 focus:ring-cyan-300 focus:outline-none"
            onClick={reset}
            type="button"
          >
            {messages().game.resetZoom} · {zoom.toFixed(1)}x
          </button>
        )}
        <button aria-label={messages().game.zoomIn} className={ZOOM_BUTTON_CLASS} disabled={!canZoomIn} onClick={zoomIn} type="button">+</button>
        <button aria-label={messages().game.zoomOut} className={ZOOM_BUTTON_CLASS} disabled={!canZoomOut} onClick={zoomOut} type="button">−</button>
      </div>
    </div>
  );
}
