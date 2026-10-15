"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { type MapBox } from "@/lib/world-countries";

type ViewBox = MapBox;

const MAX_ZOOM = 8;
const BUTTON_ZOOM_STEP = 1.6;
/** Sürükleme bu eşiği aşarsa işaretçi bırakıldığında seçim değil, kaydırma sayılır. Parmak dokunurken biraz
    kaydığı için dokunmatikte eşik daha geniştir. */
const DRAG_THRESHOLD_PX = { mouse: 5, touch: 10 };

type Point = { x: number; y: number };

/** İki parmağın arasındaki uzaklık ve orta noktası (ekran koordinatı). */
function pinchOf(pointers: Map<number, Point>) {
  const [first, second] = [...pointers.values()];
  return {
    distance: Math.hypot(second.x - first.x, second.y - first.y),
    center: { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 },
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Ekran koordinatını, viewBox ve ortalama payı dahil, SVG kullanıcı koordinatına çevirir. */
function toUserSpace(svg: SVGSVGElement, clientX: number, clientY: number) {
  const screenToUser = svg.getScreenCTM()?.inverse();
  if (!screenToUser) return null;
  return new DOMPoint(clientX, clientY).matrixTransform(screenToUser);
}

function parseViewBox(svg: SVGSVGElement): ViewBox | null {
  const raw = svg.getAttribute("viewBox");
  if (!raw) return null;
  const [x, y, width, height] = raw.trim().split(/[\s,]+/).map(Number);
  if ([x, y, width, height].some((value) => !Number.isFinite(value)) || width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

/** Kutuyu ortalayarak, haritanın en-boy oranına genişletir; böylece kutunun tamamı görünür. */
function fitToAspect(box: ViewBox, base: ViewBox): ViewBox {
  const ratio = base.height / base.width;
  const width = Math.max(box.width, box.height / ratio);
  const height = width * ratio;
  return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
}

/**
 * Gömülü SVG haritanın viewBox'ını değiştirerek yalnızca haritayı yakınlaştırır: tekerlek, sürükleme ve
 * dokunmatikte iki parmakla sıkıştırma.
 * Sayfanın kendisi etkilenmez; kaydırma sınırları haritanın dışına taşmaz.
 * `homeView` verilirse (ör. kıta antrenmanı) harita o bölgeyle açılır ve "Sıfırla" oraya döner.
 */
export function useMapZoom(containerRef: RefObject<HTMLDivElement | null>, mapMarkup: string | null, homeView: MapBox | null = null) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const baseViewBox = useRef<ViewBox | null>(null);
  const homeViewBox = useRef<ViewBox | null>(null);
  const viewBox = useRef<ViewBox | null>(null);
  /** Doğru cevabı göstermek için görünüm otomatik kaydırıldıysa, kaydırmadan önceki görünüm. */
  const viewBeforeReveal = useRef<ViewBox | null>(null);
  const dragDistance = useRef(0);
  const dragThreshold = useRef(DRAG_THRESHOLD_PX.mouse);
  /** Ekrana değen işaretçilerin (fare ya da parmaklar) son konumları. */
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<ReturnType<typeof pinchOf> | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isAtHome, setIsAtHome] = useState(true);

  const applyViewBox = useCallback((next: ViewBox) => {
    const base = baseViewBox.current;
    const svg = svgRef.current;
    if (!base || !svg) return;

    const width = clamp(next.width, base.width / MAX_ZOOM, base.width);
    const height = width * (base.height / base.width);
    const x = clamp(next.x, base.x, base.x + base.width - width);
    const y = clamp(next.y, base.y, base.y + base.height - height);

    viewBox.current = { x, y, width, height };
    svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
    setZoom(base.width / width);
    const home = homeViewBox.current ?? base;
    setIsAtHome(Math.abs(home.width - width) < 0.01 && Math.abs(home.x - x) < 0.01 && Math.abs(home.y - y) < 0.01);
  }, []);

  const reset = useCallback(() => {
    viewBeforeReveal.current = null;
    const home = homeViewBox.current ?? baseViewBox.current;
    if (home) applyViewBox(home);
  }, [applyViewBox]);

  /**
   * Verilen alanı görünür kılar: mevcut yakınlaştırmaya sığıyorsa oraya ortalar,
   * sığmıyorsa tam görünüme döner. Yakınlaşmışken doğru cevabın kaçırılmaması için.
   */
  const ensureVisible = useCallback(
    (element: SVGGraphicsElement) => {
      const view = viewBox.current;
      const base = baseViewBox.current;
      if (!view || !base) return;

      const box = element.getBBox();
      const isVisible =
        box.x >= view.x && box.y >= view.y && box.x + box.width <= view.x + view.width && box.y + box.height <= view.y + view.height;
      if (isVisible) return;

      viewBeforeReveal.current ??= view;
      if (box.width <= view.width && box.height <= view.height) {
        applyViewBox({ ...view, x: box.x + box.width / 2 - view.width / 2, y: box.y + box.height / 2 - view.height / 2 });
      } else {
        applyViewBox(base);
      }
    },
    [applyViewBox],
  );

  /** ensureVisible'ın kaydırdığı görünümü geri alır; oyuncu arada kendisi oynattıysa dokunmaz. */
  const restoreAfterReveal = useCallback(() => {
    const previous = viewBeforeReveal.current;
    viewBeforeReveal.current = null;
    if (previous) applyViewBox(previous);
  }, [applyViewBox]);

  /** Görünümün merkezini sabit tutarak yakınlaştırır. */
  const zoomBy = useCallback(
    (factor: number) => {
      const view = viewBox.current;
      if (!view) return;
      viewBeforeReveal.current = null;
      const width = view.width / factor;
      applyViewBox({
        x: view.x + (view.width - width) / 2,
        y: view.y + (view.height - width * (view.height / view.width)) / 2,
        width,
        height: width * (view.height / view.width),
      });
    },
    [applyViewBox],
  );

  // Harita ya da açılış bölgesi değiştiğinde temel viewBox'ı yeniden okur ve açılış görünümüne döner.
  // Önbellekteki işaretleme aynı kaldığında React SVG'yi yeniden yazmaz; temel viewBox bu yüzden
  // ilk okumada saklanır, sonraki turlarda değişmiş viewBox özniteliğinden okunmaz.
  useEffect(() => {
    const svg = containerRef.current?.querySelector("svg") ?? null;
    if (svg !== svgRef.current) baseViewBox.current = svg ? parseViewBox(svg) : null;
    svgRef.current = svg;
    const base = baseViewBox.current;
    homeViewBox.current = base && homeView ? fitToAspect(homeView, base) : null;
    const home = homeViewBox.current ?? base;
    viewBeforeReveal.current = null;
    if (!home) return setZoom(1);
    applyViewBox(home);
    // Açılış kutusu harita kenarına taşıyorsa applyViewBox onu içeri kaydırır; "evde mi" kontrolü
    // kaydırılmış haliyle yapılmalı.
    if (homeViewBox.current && viewBox.current) homeViewBox.current = { ...viewBox.current };
    setIsAtHome(true);
  }, [applyViewBox, containerRef, homeView, mapMarkup]);

  // Tekerlek olayı pasif olmayan bir dinleyici gerektirir; aksi halde sayfa kaymasını engelleyemeyiz.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      const svg = svgRef.current;
      const base = baseViewBox.current;
      const view = viewBox.current;
      if (!svg || !base || !view) return;
      event.preventDefault();

      const pointer = toUserSpace(svg, event.clientX, event.clientY);
      if (!pointer) return;
      viewBeforeReveal.current = null;
      const width = clamp(view.width * Math.exp(event.deltaY * 0.002), base.width / MAX_ZOOM, base.width);
      const ratio = width / view.width;

      applyViewBox({
        x: pointer.x - (pointer.x - view.x) * ratio,
        y: pointer.y - (pointer.y - view.y) * ratio,
        width,
        height: view.height * ratio,
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [applyViewBox, containerRef]);

  const startPan = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (pointers.current.size === 0) {
      dragDistance.current = 0;
      dragThreshold.current = event.pointerType === "mouse" ? DRAG_THRESHOLD_PX.mouse : DRAG_THRESHOLD_PX.touch;
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.current.size === 2) {
      // İkinci parmak değdi: bu artık bir sıkıştırma hareketi, parmaklar kalkınca seçim yapılmaz.
      pinch.current = pinchOf(pointers.current);
      dragDistance.current = Number.POSITIVE_INFINITY;
    }
  };

  const movePan = (event: React.PointerEvent<HTMLDivElement>) => {
    const last = pointers.current.get(event.pointerId);
    const svg = svgRef.current;
    const view = viewBox.current;
    if (!last || !svg || !view) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    const userToScreen = svg.getScreenCTM();
    if (!userToScreen) return;

    if (pointers.current.size >= 2) {
      const previous = pinch.current;
      const next = pinchOf(pointers.current);
      pinch.current = next;
      const base = baseViewBox.current;
      const anchor = toUserSpace(svg, previous?.center.x ?? next.center.x, previous?.center.y ?? next.center.y);
      if (!previous || !base || !anchor || next.distance === 0) return;
      viewBeforeReveal.current = null;

      // Parmakların altındaki nokta yerinde kalacak biçimde yakınlaştırır, sonra orta noktanın kaydığı kadar kaydırır.
      const width = clamp((view.width * previous.distance) / next.distance, base.width / MAX_ZOOM, base.width);
      const ratio = width / view.width;
      applyViewBox({
        x: anchor.x - (anchor.x - view.x) * ratio - ((next.center.x - previous.center.x) * ratio) / userToScreen.a,
        y: anchor.y - (anchor.y - view.y) * ratio - ((next.center.y - previous.center.y) * ratio) / userToScreen.d,
        width,
        height: view.height * ratio,
      });
      return;
    }

    const deltaX = event.clientX - last.x;
    const deltaY = event.clientY - last.y;
    dragDistance.current += Math.abs(deltaX) + Math.abs(deltaY);
    if (dragDistance.current <= dragThreshold.current) return;

    viewBeforeReveal.current = null;
    event.currentTarget.setPointerCapture(event.pointerId);
    applyViewBox({ ...view, x: view.x - deltaX / userToScreen.a, y: view.y - deltaY / userToScreen.d });
  };

  const endPan = (event: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    // Bir parmak kalkınca kalan parmak kaldığı yerden kaydırmayı sürdürür.
    if (pointers.current.size < 2) pinch.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return {
    zoom,
    isAtHome,
    canZoomIn: zoom < MAX_ZOOM - 0.01,
    canZoomOut: zoom > 1.01,
    zoomIn: () => zoomBy(BUTTON_ZOOM_STEP),
    zoomOut: () => zoomBy(1 / BUTTON_ZOOM_STEP),
    reset,
    ensureVisible,
    restoreAfterReveal,
    /** Sürükleme sonrası gelen tıklamanın seçim sayılmaması için. */
    wasDragged: () => dragDistance.current > dragThreshold.current,
    panHandlers: { onPointerDown: startPan, onPointerMove: movePan, onPointerUp: endPan, onPointerCancel: endPan },
  };
}
