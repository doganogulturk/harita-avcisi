import Link from "next/link";

/** Profil, İstatistikler ve Hakkında sayfalarının ortak kartı. */
export const PROFILE_CARD = "rounded-3xl border-2 border-slate-200 bg-white p-5 lg:p-6";
export const PROFILE_EYEBROW = "text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase";

const ROUND = "hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:h-11 lg:w-11";

/** Sol üstte küçük yuvarlak geri tuşu: alt sayfadan bir üst sayfaya (İstatistikler ve Hakkında → Profil). */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link aria-label={label} className={ROUND} href={href} title={label}>
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} viewBox="0 0 24 24">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
    </Link>
  );
}

/** Satırın sağındaki ok. */
export function Chevron() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} viewBox="0 0 24 24">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** Profil ve Hakkında'nın altındaki küçük yasal bağlantılar. */
export function LegalFooter({ label, pages }: { label: string; pages: readonly { href: string; label: string }[] }) {
  return (
    <nav aria-label={label} className="flex flex-wrap justify-center gap-x-4 gap-y-1 pt-2 pb-4 text-xs font-semibold text-slate-500">
      {pages.map((page) => (
        <Link className="underline-offset-4 transition hover:text-cyan-700 hover:underline" href={page.href} key={page.href}>
          {page.label}
        </Link>
      ))}
    </nav>
  );
}
