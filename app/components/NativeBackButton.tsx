"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";
import { runBackHandler } from "@/lib/hooks/useBackHandler";

/**
 * Android uygulamasında geri tuşunu yönetir (lib/hooks/useBackHandler.ts): önce açık pencere ya da ekran karşılar,
 * yoksa geçmişte geri gidilir, geçmiş de yoksa uygulamadan çıkılır. Sitede ve iOS'ta bir şey yapmaz; Capacitor'ın
 * varsayılanı her ekrandan uygulamayı kapatıyordu, çünkü oyun ekranları adres değiştirmeden açılır.
 */
export function NativeBackButton() {
  useEffect(() => {
    if (Capacitor.getPlatform() !== "android") return;
    const listener = App.addListener("backButton", ({ canGoBack }) => {
      if (runBackHandler()) return;
      if (canGoBack) window.history.back();
      else void App.exitApp();
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
