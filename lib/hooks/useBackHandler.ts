"use client";

import { useEffect, useRef } from "react";

/**
 * Android'in geri tuşu (ve geri hareketi). Sitede tarayıcının kendi geri davranışı geçerlidir; bu kayıtlar yalnızca
 * Android uygulamasında (NativeBackButton) kullanılır.
 *
 * Ekranlar ve pencereler geri tuşunda ne olacağını buraya kaydeder; en yüksek öncelikli, eşitse en son kaydolan
 * çalışır. Kayıt yoksa uygulama geçmişte geri gider (ör. ayar ekranından oyun seçimine, düellodan ana sayfaya);
 * geçmiş de yoksa uygulamadan çıkılır.
 */
export const BACK_PRIORITY = {
  /** Oyun, sonuç, giriş adımı gibi bütün ekranı kaplayan durum. */
  screen: 1,
  /** Ekranın üstünde açılan pencere (giriş, sıralama, tanıtım); önce o kapanır. */
  dialog: 2,
} as const;

type BackHandler = { priority: number; order: number; run: () => void };

const handlers = new Set<BackHandler>();
let registrationCount = 0;

/** Geri tuşuna basılınca çalışacak kayıt; varsa çalıştırıp true döner. */
export function runBackHandler(): boolean {
  let top: BackHandler | null = null;
  for (const handler of handlers) {
    if (!top || handler.priority > top.priority || (handler.priority === top.priority && handler.order > top.order)) top = handler;
  }
  top?.run();
  return top !== null;
}

/** `isEnabled` doğruyken geri tuşunu bu ekran ya da pencere karşılar. */
export function useBackHandler(onBack: () => void, priority: number, isEnabled = true) {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!isEnabled) return;
    const handler: BackHandler = { priority, order: ++registrationCount, run: () => onBackRef.current() };
    handlers.add(handler);
    return () => {
      handlers.delete(handler);
    };
  }, [isEnabled, priority]);
}
