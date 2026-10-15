"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Tarayıcının bağlantı durumu. Haritalar ve bayraklar sitenin kendi dosyaları olduğu için antrenman bağlantısız da
 * oynanır; yarış, düello ve oda Supabase'e bağlıdır. Sunucuda çizilen ilk halde bağlı sayılır.
 */
export function useIsOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
