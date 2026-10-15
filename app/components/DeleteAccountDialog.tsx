"use client";

import { useEffect, useState } from "react";
import { deleteMyAccount } from "@/lib/auth";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { type Player } from "@/lib/game";

type DeleteAccountDialogProps = {
  player: Player;
  onClose: () => void;
  /** Hesap silindi ve bu cihazdaki oturum kapandı. */
  onDeleted: () => void;
};

/** Hesabı ve oyuncunun bütün verisini kalıcı olarak silmeden önce ne gideceğini anlatıp onay ister. */
export function DeleteAccountDialog({ player, onClose, onDeleted }: DeleteAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  useBackHandler(() => {
    if (!isDeleting) onClose();
  }, BACK_PRIORITY.dialog);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isDeleting) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isDeleting, onClose]);

  const confirm = async () => {
    setIsDeleting(true);
    setError(null);
    const message = await deleteMyAccount();
    if (message) {
      setError(message);
      setIsDeleting(false);
      return;
    }
    onDeleted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Vazgeç"
        className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
        disabled={isDeleting}
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />

      <div
        aria-describedby="delete-account-description"
        aria-labelledby="delete-account-title"
        aria-modal="true"
        className="relative flex max-h-full w-full max-w-md flex-col overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-7"
        role="alertdialog"
      >
        <h2 className="font-display text-2xl leading-tight font-bold text-slate-900" id="delete-account-title">
          Hesabın silinsin mi?
        </h2>
        <div className="mt-3 space-y-2 text-sm text-slate-600" id="delete-account-description">
          <p>
            <span className="font-semibold text-slate-800">{player.name}</span> hesabı ve şunlar kalıcı olarak silinir: sıralamadaki
            skorların, oynadığın turlar, düelloların ve kurduğun odalar.
          </p>
          <p className="font-semibold text-rose-700">Bu işlem geri alınamaz.</p>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            autoFocus
            className="rounded-full border-2 border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-slate-300 disabled:opacity-50"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            Vazgeç
          </button>
          <button
            className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 disabled:opacity-60"
            disabled={isDeleting}
            onClick={confirm}
            type="button"
          >
            {isDeleting ? "Siliniyor…" : "Hesabımı sil"}
          </button>
        </div>
      </div>
    </div>
  );
}
