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

/** Doğru cevap ekranda bundan küçükse (ör. dikey telefonda Malta) cevap gösterilirken oraya yakınlaşılır. */
const SMALL_TARGET_PX = 24;
/** Küçük yere yakınlaşınca yerin ekrandaki hedef boyu; çevresi de görünsün diye ekranın tamamı değil. */
const REVEAL_TARGET_PX = 72;
/** Cevap gösterimindeki otomatik yakınlaşma ve geri dönüşün süresi. */
const ANIMATION_MS = 450;

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Gömülü SVG haritanın viewBox'ını değiştirerek yalnızca haritayı yakınlaştırır: tekerlek, sürükleme ve
 * dokunmatikte iki parmakla sıkıştırma.
 * Sayfanın kendisi etkilenmez; kaydırma sınırları haritanın dışına taşmaz.
 * `homeView` verilirse (ör. kıta antrenmanı) harita o bölgeyle açılır ve "Sıfırla" oraya döner.
 *
 * Görünen alan haritanın değil kabın en-boy oranındadır. Açılışta harita yine tam sığar (dikey telefonda üstünde ve
 * altında boşlukla), ama yakınlaşınca kabın tamamı dolar: dikey telefonda yakınlaşan harita ekranın yalnızca ortasındaki
 * bir şeritte kalmaz.
 */
export function useMapZoom(containerRef: RefObject<HTMLDivElement | null>, mapMarkup: string | null, homeView: MapBox | null = null) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const baseViewBox = useRef<ViewBox | null>(null);
  const homeViewBox = useRef<ViewBox | null>(null);
  const viewBox = useRef<ViewBox | null>(null);
  /** Kabın yüksekliğinin genişliğine oranı; görünen alan bu orandadır. */
  const aspect = useRef(1);
  /** Doğru cevabı göstermek için görünüm otomatik kaydırıldıysa, kaydırmadan önceki görünüm. */
  const viewBeforeReveal = useRef<ViewBox | null>(null);
  const animationFrame = useRef<number | null>(null);
  const isAtHomeRef = useRef(true);
  const dragDistance = useRef(0);
  const dragThreshold = useRef(DRAG_THRESHOLD_PX.mouse);
  /** Ekrana değen işaretçilerin (fare ya da parmaklar) son konumları. */
  const pointers = useRef(new Map<number, Point>());
  const pinch = useRef<ReturnType<typeof pinchOf> | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isAtHome, setIsAtHome] = useState(true);

  /** Kutuyu ortalayarak kabın en-boy oranına genişletir; böylece kutunun tamamı görünür. */
  const fitBox = useCallback((box: ViewBox): ViewBox => {
    const ratio = aspect.current;
    const width = Math.max(box.width, box.height / ratio);
    const height = width * ratio;
    return { x: box.x + (box.width - width) / 2, y: box.y + (box.height - height) / 2, width, height };
  }, []);

  /**
   * İstenen görünümü sınırlara oturtur: merkezini ve genişliğini korur, yakınlaştırmayı tam görünüm ile MAX_ZOOM arasında
   * tutar. Görünüm bir eksende haritadan büyükse o eksende ortalanır, değilse haritanın dışına taşmaz.
   */
  const normalize = useCallback(
    (next: ViewBox): ViewBox | null => {
      const base = baseViewBox.current;
      if (!base) return null;
      const full = fitBox(base);
      const width = clamp(next.width, full.width / MAX_ZOOM, full.width);
      const height = width * aspect.current;
      const centerX = next.x + next.width / 2;
      const centerY = next.y + next.height / 2;
      const place = (center: number, size: number, start: number, extent: number) =>
        size >= extent ? start + (extent - size) / 2 : clamp(center - size / 2, start, start + extent - size);
      return { x: place(centerX, width, base.x, base.width), y: place(centerY, height, base.y, base.height), width, height };
    },
    [fitBox],
  );

  const draw = (view: ViewBox) => svgRef.current?.setAttribute("viewBox", `${view.x} ${view.y} ${view.width} ${view.height}`);

  /** Görünümü hemen uygular ve yakınlaştırma durumunu günceller. */
  const setView = useCallback(
    (next: ViewBox) => {
      const view = normalize(next);
      const base = baseViewBox.current;
      if (!view || !base || !svgRef.current) return;
      viewBox.current = view;
      draw(view);
      const full = fitBox(base);
      setZoom(full.width / view.width);
      const home = homeViewBox.current ?? full;
      const atHome = Math.abs(home.width - view.width) < 0.01 && Math.abs(home.x - view.x) < 0.01 && Math.abs(home.y - view.y) < 0.01;
      isAtHomeRef.current = atHome;
      setIsAtHome(atHome);
    },
    [fitBox, normalize],
  );

  const cancelAnimation = () => {
    if (animationFrame.current !== null) cancelAnimationFrame(animationFrame.current);
    animationFrame.current = null;
  };

  /** Oyuncunun kendi hareketi (tekerlek, sürükleme, sıkıştırma, tuşlar): süren otomatik geçişi keser. */
  const applyViewBox = useCallback(
    (next: ViewBox) => {
      cancelAnimation();
      setView(next);
    },
    [setView],
  );

  /** Cevap gösteriminde görünümü yumuşak bir geçişle değiştirir; hareket azaltma açıksa hemen. */
  const animateTo = useCallback(
    (next: ViewBox) => {
      cancelAnimation();
      const from = viewBox.current;
      const to = normalize(next);
      if (!from || !to) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setView(to);
      const startedAt = performance.now();
      const step = (now: number) => {
        const t = easeOutCubic(Math.min(1, (now - startedAt) / ANIMATION_MS));
        const mix = (key: keyof ViewBox) => from[key] + (to[key] - from[key]) * t;
        if (t < 1) {
          const frame = { x: mix("x"), y: mix("y"), width: mix("width"), height: mix("height") };
          viewBox.current = frame;
          draw(frame);
          animationFrame.current = requestAnimationFrame(step);
        } else {
          animationFrame.current = null;
          setView(to);
        }
      };
      animationFrame.current = requestAnimationFrame(step);
    },
    [normalize, setView],
  );

  const reset = useCallback(() => {
    viewBeforeReveal.current = null;
    const home = homeViewBox.current ?? (baseViewBox.current && fitBox(baseViewBox.current));
    if (home) applyViewBox(home);
  }, [applyViewBox, fitBox]);

  /**
   * Doğru cevabı görünür kılar: mevcut yakınlaştırmaya sığıyorsa oraya kayar, sığmıyorsa tam görünüme döner.
   * `zoomIfSmall` verilirse ve yer ekranda çok küçükse (ör. Malta) yerin çevresiyle görüneceği kadar yakınlaşılır.
   * Sonraki soruda restoreAfterReveal görünümü oyuncunun bıraktığı yere döndürür.
   */
  const ensureVisible = useCallback(
    (element: SVGGraphicsElement, { zoomIfSmall = false }: { zoomIfSmall?: boolean } = {}) => {
      const view = viewBox.current;
      const base = baseViewBox.current;
      const container = containerRef.current;
      if (!view || !base || !container) return;

      const box = element.getBBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const screenSize = (Math.max(box.width, box.height) * container.clientWidth) / view.width;
      if (zoomIfSmall && screenSize < SMALL_TARGET_PX) {
        viewBeforeReveal.current ??= view;
        const width = (view.width * Math.max(screenSize, 1)) / REVEAL_TARGET_PX;
        const height = width * aspect.current;
        animateTo({ x: centerX - width / 2, y: centerY - height / 2, width, height });
        return;
      }

      const isVisible =
        box.x >= view.x && box.y >= view.y && box.x + box.width <= view.x + view.width && box.y + box.height <= view.y + view.height;
      if (isVisible) return;

      viewBeforeReveal.current ??= view;
      if (box.width <= view.width && box.height <= view.height) {
        animateTo({ ...view, x: centerX - view.width / 2, y: centerY - view.height / 2 });
      } else {
        animateTo(fitBox(base));
      }
    },
    [animateTo, containerRef, fitBox],
  );

  /** ensureVisible'ın değiştirdiği görünümü geri alır; oyuncu arada kendisi oynattıysa dokunmaz. */
  const restoreAfterReveal = useCallback(() => {
    const previous = viewBeforeReveal.current;
    viewBeforeReveal.current = null;
    if (previous) animateTo(previous);
  }, [animateTo]);

  /** Görünümün merkezini sabit tutarak yakınlaştırır. */
  const zoomBy = useCallback(
    (factor: number) => {
      const view = viewBox.current;
      if (!view) return;
      viewBeforeReveal.current = null;
      const width = view.width / factor;
      const height = width * aspect.current;
      applyViewBox({ x: view.x + (view.width - width) / 2, y: view.y + (view.height - height) / 2, width, height });
    },
    [applyViewBox],
  );

  /** Kabın en-boy oranını okur; kab henüz ölçülemiyorsa haritanın kendi oranı kullanılır. */
  const readAspect = useCallback(() => {
    const container = containerRef.current;
    const base = baseViewBox.current;
    if (container && container.clientWidth > 0 && container.clientHeight > 0) aspect.current = container.clientHeight / container.clientWidth;
    else if (base) aspect.current = base.height / base.width;
  }, [containerRef]);

  /** Açılış görünümünü (tam harita ya da açılış bölgesi) kabın şimdiki oranına göre hesaplar. */
  const computeHome = useCallback(() => {
    const base = baseViewBox.current;
    homeViewBox.current = base && homeView ? normalize(fitBox(homeView)) : null;
  }, [fitBox, homeView, normalize]);

  // Harita ya da açılış bölgesi değiştiğinde temel viewBox'ı yeniden okur ve açılış görünümüne döner.
  // Önbellekteki işaretleme aynı kaldığında React SVG'yi yeniden yazmaz; temel viewBox bu yüzden
  // ilk okumada saklanır, sonraki turlarda değişmiş viewBox özniteliğinden okunmaz.
  useEffect(() => {
    const svg = containerRef.current?.querySelector("svg") ?? null;
    if (svg !== svgRef.current) baseViewBox.current = svg ? parseViewBox(svg) : null;
    svgRef.current = svg;
    cancelAnimation();
    viewBeforeReveal.current = null;
    const base = baseViewBox.current;
    if (!base) return setZoom(1);
    readAspect();
    computeHome();
    setView(homeViewBox.current ?? fitBox(base));
  }, [computeHome, containerRef, fitBox, mapMarkup, readAspect, setView]);

  // Kabın boyu değişince (telefon döndü, pencere büyüdü) görünüm yeni orana uyar: açılış görünümündeyse yeni açılış
  // görünümüne geçer, oyuncu yakınlaştırmışsa merkez ve yakınlaştırma korunur.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const view = viewBox.current;
      const base = baseViewBox.current;
      if (!view || !base) return;
      const wasAtHome = isAtHomeRef.current;
      readAspect();
      computeHome();
      if (wasAtHome) setView(homeViewBox.current ?? fitBox(base));
      else setView({ ...view, y: view.y + view.height / 2 - (view.width * aspect.current) / 2, height: view.width * aspect.current });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [computeHome, containerRef, fitBox, readAspect, setView]);

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
      const fullWidth = fitBox(base).width;
      const width = clamp(view.width * Math.exp(event.deltaY * 0.002), fullWidth / MAX_ZOOM, fullWidth);
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
  }, [applyViewBox, containerRef, fitBox]);

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
      const fullWidth = fitBox(base).width;
      const width = clamp((view.width * previous.distance) / next.distance, fullWidth / MAX_ZOOM, fullWidth);
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
