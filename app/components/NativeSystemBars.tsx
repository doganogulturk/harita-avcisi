"use client";

import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from "@capacitor/core";
import { useEffect } from "react";

/**
 * Android uygulamasında durum çubuğunu gizler: oyun yatay ve tam ekran oynanır, iPhone da yatayda durum çubuğunu
 * kendisi gizler. Gezinme çubuğu (geri hareketi) yerinde kalır. Sitede ve iOS'ta hiçbir şey yapmaz.
 */
export function NativeSystemBars() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    SystemBars.hide({ bar: SystemBarType.StatusBar }).catch(() => {
      // Gizlenemezse durum çubuğu görünür kalır; güvenli alan boşluğu (.safe-area) içeriği yine korur.
    });
  }, []);

  return null;
}

/** Koyu deniz zeminli ekranların rengi (globals.css, .sea-backdrop); tarayıcı çubuğu da bu renge boyanır. */
const SEA_COLOR = "#0b3a5b";

/**
 * Koyu zeminli sayfa (ana ekran, oyun, sonuç) açıkken durum çubuğunun yazıları açık renkli olur (iOS uygulaması) ve
 * tarayıcının çubuğu deniz rengine boyanır (Android Chrome). Sayfadan çıkılınca eski hâline döner; açık zeminli sayfalar
 * (düello, oda, profil) bunu kullanmaz.
 */
export function DarkSystemBars() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const previousColor = meta?.content;
    if (meta) meta.content = SEA_COLOR;
    const isNative = Capacitor.isNativePlatform();
    if (isNative) SystemBars.setStyle({ style: SystemBarsStyle.Dark }).catch(() => {});
    return () => {
      if (meta && previousColor) meta.content = previousColor;
      if (isNative) SystemBars.setStyle({ style: SystemBarsStyle.Default }).catch(() => {});
    };
  }, []);

  return null;
}
