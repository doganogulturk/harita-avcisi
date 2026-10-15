"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Telefonun ya da küçük tabletin dikey tutulduğu durum; RotateOverlay'in CSS koşuluyla (portrait:max-lg) aynıdır.
 * Menüler dikeyde de kullanılır, harita ise yalnızca yatayda oynanır.
 */
const PORTRAIT_QUERY = "(orientation: portrait) and (max-width: 63.999rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PORTRAIT_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

const isPortraitNow = () => window.matchMedia(PORTRAIT_QUERY).matches;

export function useIsPortrait() {
  return useSyncExternalStore(subscribe, isPortraitNow, () => false);
}

/**
 * Oyuncu süreli oyunlarda "Dikeyde devam et" dediyse bir daha yan çevirmesi istenmez. Tarayıcıda hatırlanır; depolama
 * kapalıysa sayfa açık kaldıkça geçerlidir. Antrenman bu tercihten bağımsız, her zaman dikeyde de oynanır.
 */
const PORTRAIT_PLAY_KEY = "harita-avcisi:portrait-play";
const portraitPlayListeners = new Set<() => void>();
let isPortraitPlayAllowedInMemory = false;

function readPortraitPlayAllowed() {
  if (isPortraitPlayAllowedInMemory) return true;
  try {
    return localStorage.getItem(PORTRAIT_PLAY_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribePortraitPlay(listener: () => void) {
  portraitPlayListeners.add(listener);
  return () => {
    portraitPlayListeners.delete(listener);
  };
}

export function usePortraitPlayAllowed() {
  return useSyncExternalStore(subscribePortraitPlay, readPortraitPlayAllowed, () => false);
}

export function allowPortraitPlay() {
  isPortraitPlayAllowedInMemory = true;
  try {
    localStorage.setItem(PORTRAIT_PLAY_KEY, "1");
  } catch {
    // Depolama kapalı; tercih bu sayfa yaşamı boyunca geçerli.
  }
  portraitPlayListeners.forEach((listener) => listener());
}

/**
 * Zamanlı bir turu yatay ekrana bağlar: dikeyde istenen tur hemen başlamaz, telefon yan çevrilince başlar. Böylece
 * süre, oyuncu telefonunu çevirirken işlemez. Beklerken `isWaiting` doğrudur; `cancel` isteği bırakır. Oyuncu
 * "Dikeyde devam et" derse (allowPortraitPlay) bekleyen tur hemen başlar, sonrakiler hiç beklemez.
 */
export function useLandscapeGate<T>(onReady: (value: T) => void) {
  const isPortrait = useIsPortrait();
  const isPortraitAllowed = usePortraitPlayAllowed();
  const [waiting, setWaiting] = useState<{ value: T } | null>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    if (!waiting || (isPortrait && !isPortraitAllowed)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- yön değişimi dış bir olay; bekleyen istek bir kez işlenir.
    setWaiting(null);
    onReadyRef.current(waiting.value);
  }, [isPortrait, isPortraitAllowed, waiting]);

  return {
    request: (value: T) => (isPortraitNow() && !readPortraitPlayAllowed() ? setWaiting({ value }) : onReady(value)),
    isWaiting: waiting !== null,
    cancel: () => setWaiting(null),
  };
}
