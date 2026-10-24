"use client";

import Link from "next/link";
import { useState } from "react";
import { DeleteAccountDialog } from "../DeleteAccountDialog";
import { usePlayer } from "@/lib/hooks/usePlayer";

/**
 * Hesap Silme sayfasının sonundaki silme kutusu. Hesabı silme oyunun ana ekranında durmaz (orada görünmesi insanı silmeye
 * yöneltir); ana menüdeki hesap menüsü (profil resmi) → Hesap silme ile bu sayfaya gelinir. Giriş yapılmışsa kutu çıkar, onay penceresinden
 * sonra hesap silinir. Giriş yapılmamışsa (ya da sayfa mağaza kaydından açıldıysa) yalnızca sayfanın metni kalır.
 */
export function AccountDeletionPanel() {
  const [player, , isLoaded] = usePlayer();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  if (isDeleted) {
    return (
      <div className="mt-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50/70 p-4 sm:p-5">
        <p className="!mt-0 font-bold text-slate-900">Hesabın ve bütün verilerin silindi.</p>
        <p>
          Bu cihazdaki oturumun da kapandı. <Link href="/">Oyuna dön</Link>
        </p>
      </div>
    );
  }

  if (!isLoaded || !player) return null;

  return (
    <div className="mt-6 rounded-2xl border-2 border-rose-200 bg-rose-50/60 p-4 sm:p-5">
      <p className="!mt-0 font-bold text-slate-900">{player.name} olarak giriş yaptın</p>
      <p>Hesabını ve yukarıda sayılan bütün verilerini buradan hemen silebilirsin.</p>
      <button
        className="mt-3 rounded-full bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={() => setIsDialogOpen(true)}
        type="button"
      >
        Hesabımı sil
      </button>

      {isDialogOpen && (
        <DeleteAccountDialog
          onClose={() => setIsDialogOpen(false)}
          onDeleted={() => {
            setIsDialogOpen(false);
            setIsDeleted(true);
          }}
          player={player}
        />
      )}
    </div>
  );
}
