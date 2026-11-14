import Link from "next/link";

const CLASS =
  "hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none lg:h-11 lg:w-11";

function HouseIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} viewBox="0 0 24 24">
      <path d="M3 10.5 12 3l9 7.5M5.5 9v11h13V9M10 20v-6h4v6" />
    </svg>
  );
}

/**
 * Ana menüye dönüş: sol üstte küçük yuvarlak ev tuşu. Logo ve hesap menüsü yalnızca ana ekranda durur; düello ve oda
 * lobisinde ve profilde ana menünün yolu bu tuştur. `href` verilirse bağlantı, `onClick` verilirse tuş olur.
 */
export function HomeButton({ label, href, onClick }: { label: string; href?: string; onClick?: () => void }) {
  if (href) {
    return (
      <Link aria-label={label} className={CLASS} href={href} title={label}>
        <HouseIcon />
      </Link>
    );
  }
  return (
    <button aria-label={label} className={CLASS} onClick={onClick} title={label} type="button">
      <HouseIcon />
    </button>
  );
}
