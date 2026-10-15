"use client";

import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { useSyncExternalStore } from "react";

const noSubscription = () => () => {};
const isShareAvailable = () => Capacitor.isNativePlatform() || typeof navigator.share === "function";

/**
 * Sistemin paylaşma menüsü açılabilir mi: mobil uygulamada her zaman (@capacitor/share; Android'in WebView'inde
 * tarayıcının paylaşma API'si yok), sitede tarayıcı destekliyorsa (telefonlar, bazı masaüstleri). Sunucuda çizilen
 * ilk halde yok sayılır, uyuşmazlık olmaz.
 */
export function useCanShare() {
  return useSyncExternalStore(noSubscription, isShareAvailable, () => false);
}

/** Paylaşma menüsünü açar. Kullanıcı menüyü kapatırsa ya da paylaşma olmazsa sessizce biter. */
export async function shareLink({ text, url }: { text: string; url: string }) {
  const title = "Harita Avcısı";
  try {
    if (Capacitor.isNativePlatform()) await Share.share({ title, text, url, dialogTitle: title });
    else await navigator.share({ title, text, url });
  } catch {
    // Menü kapatıldı ya da paylaşma desteklenmiyor; yapılacak bir şey yok.
  }
}
