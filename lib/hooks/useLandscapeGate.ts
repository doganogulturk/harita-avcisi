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
 * Zamanlı bir turu yatay ekrana bağlar: dikeyde istenen tur hemen başlamaz, telefon yan çevrilince başlar. Böylece
 * süre, oyuncu telefonunu çevirirken işlemez. Beklerken `isWaiting` doğrudur; `cancel` isteği bırakır.
 */
export function useLandscapeGate<T>(onReady: (value: T) => void) {
  const isPortrait = useIsPortrait();
  const [waiting, setWaiting] = useState<{ value: T } | null>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  });

  useEffect(() => {
    if (!waiting || isPortrait) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- yön değişimi dış bir olay; bekleyen istek bir kez işlenir.
    setWaiting(null);
    onReadyRef.current(waiting.value);
  }, [isPortrait, waiting]);

  return {
    request: (value: T) => (isPortraitNow() ? setWaiting({ value }) : onReady(value)),
    isWaiting: waiting !== null,
    cancel: () => setWaiting(null),
  };
}
