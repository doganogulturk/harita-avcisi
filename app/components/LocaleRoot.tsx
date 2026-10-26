"use client";

import { usePathname } from "next/navigation";
import { Fragment, useEffect } from "react";
import { applyLocale, messages, useLocale } from "@/lib/i18n";

/**
 * Bütün sayfanın dilini belirler: dil değişince altındaki her şey baştan, o dilde kurulur (anahtar değişir). Böylece
 * bileşenler metinleri `messages()`tan doğrudan okur. Sayfanın `lang` özniteliği ve sekmede görünen başlığı da dile uyar
 * (sayfaların metadata başlığı derlemede Türkçe sabitlenir).
 */
export function LocaleRoot({ children }: { children: React.ReactNode }) {
  const locale = useLocale();
  const pathname = usePathname();
  applyLocale(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    const title = messages().pageTitles[pathname.replace(/\/$/, "") || "/"];
    if (!title) return;
    // Next.js sayfanın metadata başlığını bizden sonra da yazabilir; başlık değişirse dile uygun olanı geri konur.
    const apply = () => {
      if (document.title !== title) document.title = title;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  return <Fragment key={locale}>{children}</Fragment>;
}
