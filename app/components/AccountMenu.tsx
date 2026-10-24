"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LEGAL_PAGES } from "./legal/LegalPage";
import { PlayerAvatar } from "./PlayerBadge";
import { type Player } from "@/lib/game";

type AccountMenuProps = {
  player: Player | null;
  onSignOut: () => void;
  /** Verilirse menünün başında "Nasıl oynanır?" durur (giriş ekranı; tanıtımı yeniden açar). */
  onShowGuide?: () => void;
};

const ITEM_CLASS = "block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline-none";

/**
 * Ekran başlıklarının sağındaki hesap menüsü: profil resmine (giriş yoksa kişi simgesine) dokununca açılır. İçinde
 * oyuncunun adı, "Nasıl oynanır?", yasal sayfalar ve Çıkış yap durur. Ayrı bir bilgi tuşu ve dikey telefonda görünmeyen
 * çıkış bağlantısı yerine tek ve her ekranda aynı yer.
 */
export function AccountMenu({ player, onSignOut, onShowGuide }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={player ? `Hesap menüsü · ${player.name}` : "Menü"}
        className="hit-area flex items-center gap-2 rounded-full transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:gap-3"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {player ? (
          <>
            {/* Geniş ekranda ad da görünür; dar ekranda yalnızca profil resmi. */}
            <span className="hidden max-w-[12rem] truncate text-sm font-bold text-slate-700 sm:block">{player.name}</span>
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
      </button>

      {isOpen && (
        <nav
          aria-label="Hesap menüsü"
          className="absolute top-full right-0 z-30 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          {player && (
            <>
              <p className="truncate px-3 pt-1.5 pb-2 text-sm font-bold text-slate-900" title={player.name}>
                {player.name}
              </p>
              <div className="mx-3 mb-1 border-t border-slate-100" />
            </>
          )}
          {onShowGuide && (
            <button
              className={`${ITEM_CLASS} font-bold text-cyan-700 hover:bg-cyan-50 focus-visible:bg-cyan-50`}
              onClick={() => {
                setIsOpen(false);
                onShowGuide();
              }}
              type="button"
            >
              Nasıl oynanır?
            </button>
          )}
          {LEGAL_PAGES.map((page) => (
            <Link className={`${ITEM_CLASS} text-slate-700 hover:bg-slate-100 focus-visible:bg-slate-100`} href={page.href} key={page.href}>
              {page.label}
            </Link>
          ))}
          {player && (
            <>
              <div className="mx-3 my-1 border-t border-slate-100" />
              <button
                className={`${ITEM_CLASS} text-rose-600 hover:bg-rose-50 focus-visible:bg-rose-50`}
                onClick={() => {
                  setIsOpen(false);
                  onSignOut();
                }}
                type="button"
              >
                Çıkış yap
              </button>
            </>
          )}
        </nav>
      )}
    </div>
  );
}
