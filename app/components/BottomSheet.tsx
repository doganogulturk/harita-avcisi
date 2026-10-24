"use client";

import { useEffect, useId } from "react";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";

type BottomSheetProps = {
  title: string;
  /** Başlığın altındaki kısa açıklama. */
  description?: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Telefonda ekranın altından kayarak açılan, tam genişliği kullanan katman; geniş ekranda ortada bir penceredir.
 * Arka plana dokunmak, ✕, Esc ve Android geri tuşu kapatır. İçerik kalan yüksekliği doldurur; uzun liste kendi içinde
 * kayabilsin diye içerik `flex min-h-0 flex-1 flex-col` bir kaba yerleşir (sıralama, profildeki düello listesi).
 */
export function BottomSheet({ title, description, onClose, children }: BottomSheetProps) {
  const titleId = useId();
  useBackHandler(onClose, BACK_PRIORITY.dialog);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button aria-label="Kapat" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} tabIndex={-1} type="button" />

      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="sheet-up relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl shadow-slate-900/20 sm:max-h-full sm:max-w-2xl sm:rounded-3xl sm:p-7 sm:[animation:none]"
        role="dialog"
      >
        {/* Alttan açılan sayfanın tutamacı: sayfanın kapatılabilir bir katman olduğunu gösterir. */}
        <span aria-hidden="true" className="mx-auto mb-3 h-1.5 w-10 shrink-0 rounded-full bg-slate-200 sm:hidden" />
        <div className="flex shrink-0 items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-none font-bold text-slate-900 sm:text-3xl" id={titleId}>
              {title}
            </h2>
            {description && <p className="mt-1.5 text-sm text-slate-500 sm:mt-2">{description}</p>}
          </div>
          <button
            aria-label="Kapat"
            autoFocus
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
            onClick={onClose}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex min-h-0 flex-1 flex-col sm:mt-5">{children}</div>
      </div>
    </div>
  );
}
