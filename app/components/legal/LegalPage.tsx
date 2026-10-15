import Link from "next/link";
import { Logo } from "../Logo";

/** Yasal sayfaların sırası; yasal sayfaların altındaki gezinme ve giriş ekranının bilgi menüsü (LegalMenu) bunu kullanır. */
export const LEGAL_PAGES = [
  { href: "/gizlilik", label: "Gizlilik" },
  { href: "/kvkk", label: "KVKK" },
  { href: "/kullanim-kosullari", label: "Koşullar" },
  { href: "/hesap-silme", label: "Hesap silme" },
] as const;

/** Metinlerdeki iletişim bilgileri; bir yerde değişsin diye burada. */
export const DATA_CONTROLLER = "Doğan Oğultürk";
export const CONTACT_EMAIL = "doganogulturk@gmail.com";

export function ContactEmail() {
  return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
}

type LegalPageProps = {
  title: string;
  /** Görünen son güncelleme tarihi, ör. "13 Ekim 2026". */
  updated: string;
  children: React.ReactNode;
};

/**
 * Gizlilik, KVKK, kullanım koşulları ve hesap silme sayfalarının ortak iskeleti. Oyun ekranlarının aksine
 * kaydırılabilir; mağazalar bu sayfaların uygulama dışından da açılabilmesini istediği için sitede de durur.
 */
export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <main className="safe-area min-h-[100dvh] bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <Link aria-label="Harita Avcısı ana sayfa" href="/">
            <Logo isHeading={false} />
          </Link>
          <Link className="text-sm font-semibold text-cyan-700 underline-offset-2 hover:underline" href="/">
            ← Oyuna dön
          </Link>
        </header>

        <h1 className="mt-10 font-display text-4xl leading-tight font-bold">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Son güncelleme: {updated}</p>

        <article className="legal mt-8">{children}</article>

        <nav aria-label="Yasal sayfalar" className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-6 text-sm">
          {LEGAL_PAGES.map((page) => (
            <Link className="font-semibold text-slate-500 underline-offset-2 hover:text-cyan-700 hover:underline" href={page.href} key={page.href}>
              {page.label}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}
