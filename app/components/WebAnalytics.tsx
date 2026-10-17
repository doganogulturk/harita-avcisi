"use client";

import { Capacitor } from "@capacitor/core";
import { Analytics, type BeforeSendEvent } from "@vercel/analytics/next";

/** Eski /duello/ABCD ve /oda/ABCD bağlantıları (vercel.json yönlendirir); adreste kalırsa kod kalıba çevrilir. */
const PATTERNS: [RegExp, string][] = [
  [/^\/duello\/[^/]+/, "/duello/[kod]"],
  [/^\/oda\/[^/]+/, "/oda/[kod]"],
];

/**
 * Adresteki gizli parçalar istatistiğe gitmeden atılır: düello ve oda kodu sorgu dizgisinde (?kod=ABCD; kodu bilen
 * katılabilir), web'de Google girişinden dönüşte oturum belirteci de adresin # parçasında gelir. Panelde yine hangi
 * sayfanın kaç kez açıldığı görünür.
 */
function mask(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  for (const [pattern, replacement] of PATTERNS) {
    if (pattern.test(url.pathname)) {
      url.pathname = url.pathname.replace(pattern, replacement);
      break;
    }
  }
  url.search = "";
  url.hash = "";
  return { ...event, url: url.toString() };
}

/**
 * Vercel Web Analytics: çerezsiz, anonim sayfa görüntüleme sayıları (gizlilik politikasında anlatılır). Yalnızca
 * sitede çalışır; mobil uygulama sayfaları cihazdan sunar, betik oraya ulaşmaz ve mağaza gizlilik beyanları
 * analitiksizdir. Geliştirmede bir şey göndermez; Vercel panelinde Analytics açılmadıkça üretimde de veri toplanmaz.
 */
export function WebAnalytics() {
  if (Capacitor.isNativePlatform()) return null;
  return <Analytics beforeSend={mask} />;
}
