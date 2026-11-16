"use client";

import Link from "next/link";
import { PlayerAvatar } from "./PlayerBadge";
import { type Player } from "@/lib/game";
import { messages } from "@/lib/i18n";

/**
 * Ana ekranın sağ üstündeki profil tuşu: profil resmi (giriş yoksa kişi simgesi), geniş ekranda adla birlikte; Profil
 * sayfasını açar. Dil, ses, Nasıl oynanır, Hakkında, yasal sayfalar ve çıkış oradadır.
 */
export function ProfileButton({ player }: { player: Player | null }) {
  const t = messages();
  const label = player ? `${t.profileHub.title} · ${player.name}` : t.profileHub.title;
  return (
    <Link aria-label={label} className="hit-area flex shrink-0 items-center gap-2 rounded-full transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:gap-3" href="/profil" title={label}>
      {player ? (
        <>
          {/* Geniş ekranda ad da görünür; dar ekranda yalnızca profil resmi. */}
          <span className="hidden max-w-[12rem] truncate text-sm font-bold text-white sm:block">{player.name}</span>
          <PlayerAvatar player={player} />
        </>
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
          </svg>
        </span>
      )}
    </Link>
  );
}
