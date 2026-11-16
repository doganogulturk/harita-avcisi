"use client";

import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { useSyncExternalStore } from "react";

/**
 * Cevaba kısa bir titreşimle tepki.
 *
 * - Mobil uygulamada (iOS ve Android) cihazın titreşim motoru kullanılır (@capacitor/haptics): doğru cevapta
 *   "başarılı", yanlışta "hata" bildirimi; iPhone'da bunlar birbirinden ayırt edilen kısa dokunuşlardır.
 * - Sitede tarayıcının titreşim API'si kullanılır; Android tarayıcılarında çalışır, iPhone Safari ve masaüstü
 *   desteklemez (çağrı sessizce bir şey yapmaz). Tarayıcı titreşimi yalnızca dokunuştan hemen sonra izin verdiği için
 *   cevap anında çağrılır.
 *
 * Titreşim Profil'deki Ayarlar'dan kapatılabilir; seçim cihazda hatırlanır. Anahtar yalnızca titreşimin çalıştığı yerde
 * görünür (hapticsSupported).
 */
const WEB_PATTERNS = {
  correct: 18,
  incorrect: [35, 50, 35],
} satisfies Record<string, VibratePattern>;

const STORAGE_KEY = "harita-avcisi:haptics";

const listeners = new Set<() => void>();
let inMemoryEnabled = true;

function readEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored !== "off";
  } catch {
    // Depolama kapalı; bellekteki değer kullanılır.
  }
  return inMemoryEnabled;
}

/**
 * Bu cihazda titreşim var mı: mobil uygulama ya da titreşim API'si olan dokunmatik tarayıcı (Android). Masaüstü Chrome
 * da API'yi tanımlar ama titreştiremez; dokunmatik ekran şartı onu ayıklar.
 */
export function hapticsSupported(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return false;
  return window.matchMedia("(pointer: coarse)").matches;
}

export function setHapticsEnabled(enabled: boolean) {
  inMemoryEnabled = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Depolama kapalı; seçim bu sayfa yaşamı boyunca bellekte kalır.
  }
  listeners.forEach((listener) => listener());
  // Açılınca kısa bir dokunuşla tepki verir: oyuncu titreşimin nasıl hissettirdiğini hemen bilir.
  if (!enabled) return;
  if (Capacitor.isNativePlatform()) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  else {
    try {
      navigator.vibrate?.(18);
    } catch {
      // Titreşim isteğe bağlı bir süs.
    }
  }
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useHapticsEnabled() {
  return useSyncExternalStore(subscribe, readEnabled, () => true);
}

/** Titreşim anahtarının görünüp görünmeyeceği; sunucuda çizilen sayfada gizlidir, tarayıcıda hemen belli olur. */
export function useHapticsSupported() {
  return useSyncExternalStore(subscribe, hapticsSupported, () => false);
}

export function vibrate(kind: keyof typeof WEB_PATTERNS) {
  if (!readEnabled()) return;
  if (Capacitor.isNativePlatform()) {
    void Haptics.notification({ type: kind === "correct" ? NotificationType.Success : NotificationType.Error }).catch(() => {});
    return;
  }
  try {
    navigator.vibrate?.(WEB_PATTERNS[kind]);
  } catch {
    // Bazı tarayıcılar (ör. kullanıcı etkileşimi olmadan) hata fırlatır; titreşim isteğe bağlı bir süs.
  }
}
