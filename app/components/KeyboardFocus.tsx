"use client";

import { useEffect } from "react";

/** Klavyenin açılma animasyonunun bitmesi için tanınan süre; görünür alan bu arada küçülmediyse yine de kaydırılır. */
const KEYBOARD_SETTLE_MS = 350;

/**
 * Dokunmatik cihazda bir yazı alanına (misafir adı, oda adı, düello / oda kodu) odaklanılınca, klavye açıldıktan sonra
 * alanı ekranın ortasına kaydırır. Ekranlar sayfa olarak kaymadığı (h-dvh) ve yatay telefonda klavye ekranın yarısından
 * fazlasını kapladığı için alt kartlardaki alanlar aksi halde klavyenin altında kalabilir. Fareli cihazda bir şey yapmaz.
 */
export function KeyboardFocus() {
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;

    let timer: number | undefined;
    const handleFocus = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      if (target instanceof HTMLInputElement && !["text", "search", "email", "url", "tel", "password", ""].includes(target.type)) return;

      const reveal = () => {
        window.clearTimeout(timer);
        window.visualViewport?.removeEventListener("resize", reveal);
        if (document.activeElement === target) target.scrollIntoView({ block: "center", behavior: "smooth" });
      };
      // Klavye görünür alanı küçültünce hemen, küçültmezse (bazı tarayıcılar) kısa bir beklemenin sonunda.
      window.visualViewport?.addEventListener("resize", reveal, { once: true });
      timer = window.setTimeout(reveal, KEYBOARD_SETTLE_MS);
    };

    document.addEventListener("focusin", handleFocus);
    return () => {
      document.removeEventListener("focusin", handleFocus);
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
