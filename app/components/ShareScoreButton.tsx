"use client";

import { useState } from "react";
import { shareLink, useCanShare } from "@/lib/share";
import { shareUrl } from "@/lib/site";

/**
 * Sonuç ekranındaki "Skorumu paylaş": telefonda ve mobil uygulamada sistemin paylaşma menüsünü açar (WhatsApp,
 * LinkedIn, X...), menü yoksa (çoğu masaüstü tarayıcı) metni ve site bağlantısını panoya kopyalar. Bağlantı paylaşıldığında
 * sitenin önizleme kartı (app/opengraph-image.png) görünür. `isCompact`: başka bir tuşun yanında yarım genişlikte
 * durur, yazı kısalır ("Paylaş" / "Kopyala").
 */
export function ShareScoreButton({ text, isCompact = false }: { text: string; isCompact?: boolean }) {
  const [isCopied, setIsCopied] = useState(false);
  const canShare = useCanShare();

  const share = async () => {
    const url = shareUrl("/");
    if (canShare) return shareLink({ text, url });
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Pano kullanılamıyorsa paylaşılacak bir yol kalmıyor; tuş sessizce bir şey yapmaz.
    }
  };

  return (
    <button
      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-cyan-200 bg-white px-3 py-2.5 text-sm font-bold whitespace-nowrap text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:py-2"
      onClick={() => void share()}
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} viewBox="0 0 24 24">
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v13" />
      </svg>
      {isCopied ? (isCompact ? "✓ Kopyalandı" : "✓ Panoya kopyalandı") : canShare ? (isCompact ? "Paylaş" : "Skorumu paylaş") : isCompact ? "Kopyala" : "Skorumu kopyala"}
    </button>
  );
}
