"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LEGAL_PAGES } from "./legal/LegalPage";

/**
 * Giriş ekranının başlığındaki bilgi tuşu: tanıtımı yeniden açan "Nasıl oynanır?" ve yasal sayfalara bağlantılar
 * açılır listede durur. Ekranın altında ayrı bir satır kaplamadıkları için yatay telefonda kartlara yer kalır.
 */
export function LegalMenu({ onShowGuide }: { onShowGuide: () => void }) {
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
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Bilgi"
        className="hit-area flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:h-10 lg:w-10"
        onClick={() => setIsOpen((open) => !open)}
        title="Bilgi"
        type="button"
      >
        <svg aria-hidden="true" className="h-5 w-5 lg:h-6 lg:w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <nav
          aria-label="Bilgi"
          className="absolute top-full right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
        >
          <button
            className="block w-full rounded-lg px-3 py-2 text-left text-sm font-bold text-cyan-700 transition hover:bg-cyan-50 focus-visible:bg-cyan-50 focus-visible:outline-none"
            onClick={() => {
              setIsOpen(false);
              onShowGuide();
            }}
            type="button"
          >
            Nasıl oynanır?
          </button>
          <div className="mx-3 my-1 border-t border-slate-100" />
          {LEGAL_PAGES.map((page) => (
            <Link
              className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
              href={page.href}
              key={page.href}
            >
              {page.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
