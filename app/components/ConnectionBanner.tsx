"use client";

import { useIsOnline } from "@/lib/hooks/useIsOnline";

/** Bağlantı kopunca her ekranın altında beliren uyarı; bağlantı gelince kendiliğinden kalkar. */
export function ConnectionBanner() {
  const isOnline = useIsOnline();
  if (isOnline) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-[60] flex justify-center px-4"
      role="status"
    >
      <p className="max-w-md rounded-2xl bg-slate-900/95 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-xl">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-500 align-middle" />
        Bağlantı yok. Antrenman oynanabilir; yarış, düello ve oda için bağlantı gerekir.
      </p>
    </div>
  );
}
