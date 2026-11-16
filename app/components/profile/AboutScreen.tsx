"use client";

import { LEGAL_PAGES, CONTACT_EMAIL, DATA_CONTROLLER } from "../legal/LegalPage";
import { Logo } from "../Logo";
import { BackLink, LegalFooter, PROFILE_CARD, PROFILE_EYEBROW } from "./PageParts";
import { messages, useLocale } from "@/lib/i18n";
import { CURRENT_VERSION, VERSIONS } from "@/lib/versions";

/**
 * Hakkında: ad, sürüm, geliştiren, iletişim ve sürüm geçmişi (lib/versions.ts). Girişsiz açılır; Profil'den gelinir.
 */
export function AboutScreen() {
  const locale = useLocale();
  const text = messages().about;
  return (
    <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
      <header className="flex shrink-0 items-center gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
        <BackLink href="/profil" label={text.back} />
        <h1 className="font-display text-2xl leading-none font-bold lg:text-3xl">{text.title}</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3 lg:px-8 lg:py-5">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 lg:gap-4">
          <section className={`${PROFILE_CARD} flex flex-col items-center gap-3 text-center`}>
            <div className="rounded-2xl bg-[#0b3a5b] px-4 py-3">
              <Logo isHeading={false} onDark />
            </div>
            <p className="text-sm font-bold text-cyan-700">{text.version(CURRENT_VERSION)}</p>
            <p className="text-sm text-slate-600">{text.description}</p>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-900">{text.developer(DATA_CONTROLLER)}</span> {text.contact}{" "}
              <a className="font-semibold text-cyan-700 underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </section>

          <section aria-labelledby="version-history" className={PROFILE_CARD}>
            <h2 className={PROFILE_EYEBROW} id="version-history">
              {text.history}
            </h2>
            <ol className="mt-3 flex flex-col gap-4">
              {VERSIONS.map((entry) => (
                <li key={entry.version}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-display text-xl font-bold">{entry.version}</span>
                    <span className="text-xs font-semibold text-slate-500">{entry.date[locale]}</span>
                  </div>
                  <ul className="mt-1 flex list-disc flex-col gap-1 pl-5 text-sm text-slate-600 marker:text-cyan-600">
                    {entry.notes[locale].map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </section>

          <LegalFooter label={messages().profileHub.legal} pages={LEGAL_PAGES} />
        </div>
      </div>
    </main>
  );
}
