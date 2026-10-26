"use client";

import Link from "next/link";
import { Logo } from "../Logo";
import { currentLocale, messages, setLocale } from "@/lib/i18n";

/** Yasal sayfaların sırası; yasal sayfaların altındaki gezinme ve ekran başlıklarındaki hesap menüsü (AccountMenu) bunu kullanır. */
export const LEGAL_PAGES = [
  { href: "/gizlilik", get label() { return messages().legalLinks.privacy; } },
  { href: "/kvkk", get label() { return messages().legalLinks.kvkk; } },
  { href: "/kullanim-kosullari", get label() { return messages().legalLinks.terms; } },
  { href: "/hesap-silme", get label() { return messages().legalLinks.deletion; } },
] as const;

/** Metinlerdeki iletişim bilgileri; bir yerde değişsin diye burada. */
export const DATA_CONTROLLER = "Doğan Oğultürk";
export const CONTACT_EMAIL = "doganogulturk@gmail.com";

export function ContactEmail() {
  return <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;
}

/** Bir dildeki sayfa: başlık, görünen son güncelleme tarihi ve metin. */
type LegalVariant = {
  title: string;
  /**
   * Görünen son güncelleme tarihi, ör. "13 Ekim 2026". Gizlilik, KVKK ve koşullarda okurun hangi sürümü okuduğunu
   * bilmesi için gerekir; yalnızca nasıl yapılır anlatan sayfada (hesap silme) verilmez.
   */
  updated?: string;
  body: React.ReactNode;
  /** Bilgi amaçlı çeviri (KVKK): üstte esas metnin Türkçe olduğunu söyleyen not ve Türkçeye geçiş bağlantısı çıkar. */
  isCourtesyTranslation?: boolean;
};

/**
 * Gizlilik, KVKK, kullanım koşulları ve hesap silme sayfalarının ortak iskeleti. Oyun ekranlarının aksine
 * kaydırılabilir; mağazalar bu sayfaların uygulama dışından da açılabilmesini istediği için sitede de durur. Metin arayüz
 * dilinde gösterilir.
 */
export function LegalPage({ tr, en }: { tr: LegalVariant; en?: LegalVariant }) {
  const isEnglish = currentLocale() === "en";
  const page = isEnglish && en ? en : tr;
  const text = messages().legal;
  return (
    <main className="safe-area min-h-[100dvh] bg-slate-50 text-slate-900">
      <div className="mx-auto w-full max-w-2xl px-5 py-6 sm:py-10">
        <header className="flex items-center justify-between gap-4">
          <Link aria-label={text.homeAria} href="/">
            <Logo isHeading={false} />
          </Link>
          <Link className="text-sm font-semibold text-cyan-700 underline-offset-2 hover:underline" href="/">
            {text.backToGame}
          </Link>
        </header>

        {isEnglish && en?.isCourtesyTranslation && (
          <p className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {text.courtesy}{" "}
            <button className="font-bold underline underline-offset-2 hover:text-amber-950" lang="tr" onClick={() => setLocale("tr")} type="button">
              {text.readTurkish}
            </button>
          </p>
        )}

        <h1 className="mt-10 font-display text-4xl leading-tight font-bold">{page.title}</h1>
        {page.updated && <p className="mt-2 text-sm text-slate-500">{text.updated(page.updated)}</p>}

        <article className="legal mt-8" lang={isEnglish && en ? "en" : "tr"}>
          {page.body}
        </article>

        <nav aria-label={text.nav} className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-200 pt-6 text-sm">
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
