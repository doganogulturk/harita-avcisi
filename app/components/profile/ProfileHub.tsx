"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeButton } from "../HomeButton";
import { LEGAL_PAGES } from "../legal/LegalPage";
import { PlayerAvatar } from "../PlayerBadge";
import { SignInDialog } from "../SignInDialog";
import { Chevron, LegalFooter, PROFILE_CARD, PROFILE_EYEBROW } from "./PageParts";
import { useBadges } from "@/lib/badges";
import { setHapticsEnabled, useHapticsEnabled, useHapticsSupported } from "@/lib/haptics";
import { flagUrl } from "@/lib/game";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useProfile } from "@/lib/hooks/useProfile";
import { localeTag, messages, setLocale, useLocale } from "@/lib/i18n";
import { setSoundEnabled, useSoundEnabled } from "@/lib/sound";
import { getSupabaseClient } from "@/lib/supabase";
import { CURRENT_VERSION } from "@/lib/versions";

const LANGUAGES = [
  { id: "tr", flag: "tr", short: "TR" },
  { id: "en", flag: "gb", short: "EN" },
] as const;

const ROW = "flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none lg:px-6";

function RowText({ title, note }: { title: string; note: string }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="font-bold text-slate-900">{title}</span>
      <span className="truncate text-sm text-slate-500">{note}</span>
    </span>
  );
}

/** Aç/kapa anahtarının görünüşü; tuşun kendisi satırdır (aria-pressed). */
function Switch({ isOn }: { isOn: boolean }) {
  return (
    <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition ${isOn ? "bg-emerald-500" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${isOn ? "left-5.5" : "left-0.5"}`} />
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-3 py-2.5 text-center">
      <p className="font-display text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

const formatDate = (value: string) => new Intl.DateTimeFormat(localeTag(), { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));

/**
 * Profil: kim olarak oynandığı (giriş yoksa giriş kartı), istatistiklerin özeti ve tamamının sayfası, dil, ses ve
 * titreşim ayarları, Nasıl oynanır ve Hakkında (sürüm geçmişi), çıkış; en altta küçük yasal bağlantılar. Hesap silme de orada:
 * menüde öne çıksa insanı silmeye yöneltirdi. Ana ekranın sağ üstündeki profil tuşu buraya getirir; girişsiz de açılır.
 */
export function ProfileHub() {
  const [player, , isPlayerLoaded] = usePlayer();
  const profile = useProfile(player);
  const badges = useBadges(player);
  const locale = useLocale();
  const isSoundOn = useSoundEnabled();
  const isHapticsOn = useHapticsEnabled();
  const isHapticsSupported = useHapticsSupported();
  const router = useRouter();
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  // Hesabın türü (Google ya da Apple) oturumdan okunur; misafirliği profil söyler.
  const [provider, setProvider] = useState<string | null>(null);
  useEffect(() => {
    if (!player) return;
    void getSupabaseClient()?.auth.getSession().then(({ data }) => setProvider(data.session?.user.app_metadata.provider ?? null));
  }, [player]);
  const t = messages();
  const text = t.profileHub;

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (!error) router.replace("/");
  };

  const summary = profile?.summary;
  const accuracy = summary && summary.answered > 0 ? Math.round((summary.correct / summary.answered) * 100) : 0;
  const earnedBadges = badges ? badges.filter((badge) => badge.earned_at).length : null;

  return (
    <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
      <header className="flex shrink-0 items-center gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
        <HomeButton href="/" label={text.homeLink} />
        <h1 className="font-display text-2xl leading-none font-bold lg:text-3xl">{text.title}</h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3 lg:px-8 lg:py-5">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-3 lg:gap-4">
          {!isPlayerLoaded ? (
            <p className="py-8 text-center text-sm text-slate-500">{text.loading}</p>
          ) : player ? (
            <section className={`${PROFILE_CARD} flex flex-col gap-4`}>
              <div className="flex items-center gap-4">
                <PlayerAvatar player={player} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-display text-2xl leading-tight font-bold">{player.name}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {profile?.is_guest ? t.profile.guestAccount : provider === "apple" ? t.profile.appleAccount : t.profile.googleAccount}
                    {profile?.first_played_at && t.profile.firstPlayed(formatDate(profile.first_played_at))}
                  </p>
                </div>
              </div>
              {profile?.is_guest && (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span className="font-bold">{t.profile.guestWarningTitle}</span>
                  {t.profile.guestWarning}
                </p>
              )}
              <div className="grid grid-cols-3 gap-2">
                <StatTile label={text.rounds} value={summary ? String(summary.rounds) : "–"} />
                <StatTile label={text.accuracy} value={summary ? t.result.percent(accuracy) : "–"} />
                <StatTile label={text.badges} value={earnedBadges === null ? "–" : String(earnedBadges)} />
              </div>
              <Link className="-mx-5 -mb-5 flex items-center gap-3 rounded-b-3xl border-t border-slate-100 px-5 py-3.5 transition hover:bg-slate-50 lg:-mx-6 lg:-mb-6 lg:px-6" href="/profil/istatistikler">
                <RowText note={text.allStatsNote} title={text.allStats} />
                <Chevron />
              </Link>
            </section>
          ) : (
            <section className={`${PROFILE_CARD} text-center`}>
              <p className="font-display text-2xl font-bold">{text.signInTitle}</p>
              <p className="mt-1.5 text-sm text-slate-500">{text.signInBody}</p>
              <button
                className="mt-4 rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
                onClick={() => setIsSignInOpen(true)}
                type="button"
              >
                {text.signInTitle}
              </button>
            </section>
          )}

          <section aria-labelledby="profile-settings" className={`${PROFILE_CARD} p-0! overflow-hidden`}>
            <p className={`${PROFILE_EYEBROW} px-5 pt-4 pb-1 lg:px-6`} id="profile-settings">
              {text.settings}
            </p>
            <div className="flex items-center gap-3 px-5 py-3 lg:px-6">
              <RowText note={text.languageNote} title={text.language} />
              {/* Dil: yuvarlak bayrak ve kısa ad (TR / EN); seçim hatırlanır, sayfa o dilde yeniden çizilir. */}
              <div aria-label={t.language.title} className="grid shrink-0 grid-cols-2 gap-1 rounded-full bg-slate-100 p-1" role="radiogroup">
                {LANGUAGES.map(({ id, flag, short }) => (
                  <button
                    aria-checked={locale === id}
                    aria-label={t.language[id]}
                    className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${
                      locale === id ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-800"
                    }`}
                    key={id}
                    lang={id}
                    onClick={() => setLocale(id)}
                    role="radio"
                    title={t.language[id]}
                    type="button"
                  >
                    <Image alt="" className={`h-5 w-5 rounded-full object-cover ring-1 ring-slate-200 ${locale === id ? "" : "opacity-70 grayscale-[40%]"}`} height={20} src={flagUrl(flag)} unoptimized width={20} />
                    {short}
                  </button>
                ))}
              </div>
            </div>
            {/* Ses efektleri: açılınca kısa bir ses duyulur. */}
            <button aria-pressed={isSoundOn} className={`${ROW} border-t border-slate-100`} onClick={() => setSoundEnabled(!isSoundOn)} type="button">
              <RowText note={text.soundNote} title={text.sound} />
              <Switch isOn={isSoundOn} />
            </button>
            {/* Titreşim yalnızca çalıştığı yerde: mobil uygulama ve Android tarayıcıları (iPhone Safari ve masaüstünde yok). */}
            {isHapticsSupported && (
              <button aria-pressed={isHapticsOn} className={`${ROW} border-t border-slate-100`} onClick={() => setHapticsEnabled(!isHapticsOn)} type="button">
                <RowText note={text.hapticsNote} title={text.haptics} />
                <Switch isOn={isHapticsOn} />
              </button>
            )}
          </section>

          <nav className={`${PROFILE_CARD} p-0! overflow-hidden`}>
            <Link className={ROW} href="/?rehber">
              <RowText note={text.guideNote} title={text.guide} />
              <Chevron />
            </Link>
            <Link className={`${ROW} border-t border-slate-100`} href="/hakkinda">
              <RowText note={text.aboutNote(CURRENT_VERSION)} title={text.about} />
              <Chevron />
            </Link>
          </nav>

          {player && (
            <button
              className="rounded-2xl border-2 border-rose-200 bg-white px-5 py-3 text-sm font-bold text-rose-600 transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-200 focus-visible:outline-none"
              onClick={() => void signOut()}
              type="button"
            >
              {t.menu.signOut}
            </button>
          )}

          <LegalFooter label={text.legal} pages={LEGAL_PAGES} />
        </div>
      </div>

      {isSignInOpen && !player && <SignInDialog onClose={() => setIsSignInOpen(false)} />}
    </main>
  );
}
