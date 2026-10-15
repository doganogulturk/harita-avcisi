"use client";

import { useEffect } from "react";
import { SignInPanel } from "./SignInPanel";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";

/**
 * Ana menüdeki "Giriş yap" penceresi: oyuncu bir tur seçmeden, istediği an giriş yapabilsin. Yarış, düello ve oda
 * giriş ister; giriş tam oyuna başlarken sürpriz olarak çıkmasın diye burada önceden de yapılabilir. Misafir girişi
 * bitince pencere kapanır, oturum usePlayer'a kendiliğinden yansır; Google girişi sayfadan ayrılıp ana sayfaya döner.
 */
export function SignInDialog({ onClose }: { onClose: () => void }) {
  useBackHandler(onClose, BACK_PRIORITY.dialog);
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Kapat" className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]" onClick={onClose} tabIndex={-1} type="button" />
      <div aria-label="Giriş yap" aria-modal="true" className="relative max-h-full w-full max-w-xl overflow-y-auto rounded-3xl bg-white shadow-2xl shadow-slate-900/20" role="dialog">
        <SignInPanel
          cancelLabel="Kapat"
          guestSubmitLabel="Giriş yap"
          description="Yarışta skorun sıralamaya işlenir; düelloda ve odada rakiplerin seni adınla görür. Antrenman için giriş gerekmez."
          onCancel={onClose}
          onSignedIn={onClose}
          redirectTo={window.location.origin}
          title="Giriş yap"
        />
      </div>
    </div>
  );
}
