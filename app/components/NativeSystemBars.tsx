"use client";

import { Capacitor, SystemBars, SystemBarType } from "@capacitor/core";
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
