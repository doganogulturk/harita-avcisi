import { Capacitor } from "@capacitor/core";

/** Sitenin kalıcı adresi. Mobil uygulamadan paylaşılan bağlantılar bu adrese gider. */
export const SITE_URL = "https://haritaavcisi.com";

/**
 * Paylaşılacak tam bağlantı. Sitede o an açık olan adres kullanılır (önizleme ve yerel geliştirmede de doğru
 * bağlantı çıksın diye); mobil uygulamada sayfa cihazın içinden (https://localhost) sunulduğu için sitenin
 * kalıcı adresi kullanılır.
 */
export function shareUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return `${Capacitor.isNativePlatform() ? SITE_URL : window.location.origin}${path}`;
}
