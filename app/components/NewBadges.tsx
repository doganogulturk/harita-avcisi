"use client";

import Link from "next/link";
import { useNewBadges } from "@/lib/badges";
import { messages } from "@/lib/i18n";

/** Kutlamada en fazla bu kadar rozet tek tek yazar; fazlası "+2 rozet daha" olur (ilk açılışta geçmişten birkaç rozet gelebilir). */
const SHOWN_LIMIT = 3;

/**
 * Sonuç ekranında yeni kazanılan rozetlerin kutlaması: tur kaydedildikten (`isSaved`) sonra sunucuya sorulur; yeni rozet
 * yoksa hiçbir şey çizilmez. Profildeki rozet bölümüne bağlantı verir.
 */
export function NewBadges({ isSaved }: { isSaved: boolean }) {
  const badges = useNewBadges(isSaved);
  if (badges.length === 0) return null;

  const shown = badges.slice(0, SHOWN_LIMIT);
  const rest = badges.length - shown.length;
  return (
    <div aria-live="polite" className="badge-pop rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3" role="status">
      <p className="text-xs font-semibold tracking-[0.15em] text-amber-700 uppercase">🎉 {badges.length > 1 ? messages().badges.newMany : messages().badges.newOne}</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {shown.map((badge) => (
          <li className="flex items-center gap-2 font-bold text-slate-900" key={badge.id}>
            <span aria-hidden="true" className="text-xl leading-none">
              {badge.emoji}
            </span>
            {badge.title}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-amber-800">{rest > 0 ? messages().badges.more(rest) : ""}</span>
        <Link className="font-bold text-amber-800 underline-offset-4 hover:underline" href="/profil">
          {messages().badges.seeProfile}
        </Link>
      </p>
    </div>
  );
}
