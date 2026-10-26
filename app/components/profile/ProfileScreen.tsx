"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountMenu } from "../AccountMenu";
import { BottomSheet } from "../BottomSheet";
import { DuelAvatar } from "../duel/DuelParts";
import { Logo } from "../Logo";
import { PlayerAvatar } from "../PlayerBadge";
import { BADGE_GROUPS, BADGES, useBadges, type BadgeInfo, type BadgeState } from "@/lib/badges";
import { DUEL_RULES, duelModeLabel } from "@/lib/duel";
import { BOARDS, choiceForBoard, choiceLabel, formatTime, QUESTIONS_PER_ROUND, type BoardVariant, type GameMode } from "@/lib/game";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { localeTag, messages } from "@/lib/i18n";
import { useProfile, type DuelResultKind, type Profile, type ProfileDuel } from "@/lib/hooks/useProfile";
import { getSupabaseClient } from "@/lib/supabase";

const CARD = "rounded-3xl border-2 border-slate-200 bg-white p-5 lg:p-6";
const EYEBROW = "text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase";

/** Tarihler arayüz dilinde yazılır ("26 Ekim 2026" / "26 October 2026"). */
const formatDate = (value: string) => new Intl.DateTimeFormat(localeTag(), { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
const formatShortDate = (value: string) => new Intl.DateTimeFormat(localeTag(), { day: "numeric", month: "short" }).format(new Date(value));

const seconds = (ms: number) => formatTime(Math.round(ms / 1000));

/** Sıralamanın ya da (eski "normal" gibi) kaldırılmış bir türün adı. */
function boardLabel(mode: GameMode, variant: BoardVariant): string {
  return BOARDS.find((board) => board.mode === mode && board.variant === variant)?.label ?? choiceLabel(choiceForBoard({ mode, variant }));
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold text-slate-900 tabular-nums lg:text-3xl">{value}</p>
    </div>
  );
}

/** Düello listesinin süzgeci: tümü ya da tek bir sonuç. */
type DuelFilter = "all" | DuelResultKind;

const DUEL_FILTERS: { id: DuelFilter; readonly label: string; key: "played" | "wins" | "draws" | "losses" }[] = [
  { id: "all", get label() { return messages().profile.filters.all; }, key: "played" },
  { id: "win", get label() { return messages().profile.filters.win; }, key: "wins" },
  { id: "draw", get label() { return messages().profile.filters.draw; }, key: "draws" },
  { id: "loss", get label() { return messages().profile.filters.loss; }, key: "losses" },
];

const RESULT_STYLE: Record<DuelResultKind, { readonly label: string; className: string }> = {
  win: { get label() { return messages().profile.filters.win; }, className: "bg-emerald-50 text-emerald-700" },
  draw: { get label() { return messages().profile.filters.draw; }, className: "bg-slate-100 text-slate-600" },
  loss: { get label() { return messages().profile.filters.loss; }, className: "bg-rose-50 text-rose-700" },
};

/** Düello kartı: sayı ve etiket; dokununca o sonuçtaki düellolar alttan açılan listede görünür. */
function DuelTile({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button
      className="group rounded-2xl bg-slate-50 px-4 py-3 text-left transition hover:bg-cyan-50 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-slate-50"
      disabled={value === 0}
      onClick={onClick}
      type="button"
    >
      <p className="flex items-center justify-between text-xs text-slate-500">
        {label}
        {value > 0 && (
          <svg aria-hidden="true" className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-cyan-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </p>
      <p className="mt-0.5 font-display text-2xl font-bold text-slate-900 tabular-nums lg:text-3xl">{value}</p>
    </button>
  );
}

/** Bir düello: rakip, mod ve kural, tarih; sağda skor ve sonuç. */
function DuelRow({ duel }: { duel: ProfileDuel }) {
  const name = duel.opponent_name ?? messages().profile.opponent;
  const result = RESULT_STYLE[duel.result];
  return (
    <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
      <DuelAvatar avatar={duel.opponent_avatar} name={name} tone="opponent" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-slate-900">{name}</p>
        {/* Kural yalnızca simgesiyle (⚡ Kapan kazanır, 🎯 Herkes puan alır); dar ekranda satır kesilmesin. */}
        <p className="truncate text-xs text-slate-500" title={DUEL_RULES[duel.rule].label}>
          {duelModeLabel(duel.game_mode, duel.variant)} · {DUEL_RULES[duel.rule].icon}
        </p>
        <p className="text-xs text-slate-400">
          {formatDate(duel.finished_at)}
          {duel.finish_reason === "forfeit" && messages().profile.forfeit}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="font-display text-xl font-bold text-slate-900 tabular-nums">
          {duel.my_score}–{duel.opponent_score}
        </span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${result.className}`}>{result.label}</span>
      </div>
    </li>
  );
}

/** Tek rozet satırı: simge, ad, kazanıldıysa tarihi, değilse nasıl kazanılacağı; sağda ✓ ya da ilerleme ("3/7"). */
function BadgeRow({ info, state }: { info: BadgeInfo; state: BadgeState | undefined }) {
  const isEarned = Boolean(state?.earned_at);
  const showsProgress = !isEarned && state !== undefined && state.goal > 1;
  return (
    <li className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 ${isEarned ? "bg-amber-50" : "bg-slate-50"}`}>
      <span aria-hidden="true" className={`w-8 shrink-0 text-center text-2xl leading-none ${isEarned ? "" : "opacity-40 grayscale"}`}>
        {info.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-tight font-bold ${isEarned ? "text-slate-900" : "text-slate-500"}`}>{info.title}</p>
        <p className={`mt-0.5 text-xs leading-snug ${isEarned ? "text-amber-700" : "text-slate-500"}`}>
          {isEarned && state?.earned_at ? formatDate(state.earned_at) : info.description}
        </p>
        {showsProgress && (
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-cyan-500" style={{ width: `${(state.progress / state.goal) * 100}%` }} />
          </div>
        )}
      </div>
      <span className={`shrink-0 text-sm font-bold tabular-nums ${isEarned ? "text-amber-600" : "text-slate-400"}`}>
        {isEarned ? "✓" : showsProgress ? `${state.progress}/${state.goal}` : ""}
      </span>
    </li>
  );
}

/**
 * Rozetler, gruplarıyla (gün serisi, günlük meydan okuma, kusursuz tur...) ve her grupta kademe sırasıyla: aşağı doğru
 * 3 → 7 → 30 gün gibi ilerler. Telefonda tek sütun; geniş ekranda gruplar iki sütunda yan yana. Kazanılanlar renkli ve
 * tarihli, kazanılmamışlar soluk; nasıl kazanılacağı ve hedefi birden büyükse ilerlemesi yazar.
 */
function BadgesSection({ badges }: { badges: BadgeState[] }) {
  const earnedCount = badges.filter((badge) => badge.earned_at).length;
  return (
    <section className={CARD}>
      <p className={EYEBROW}>
        {messages().profile.badges} <span className="ml-1 text-slate-400">{earnedCount} / {BADGES.length}</span>
      </p>
      <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-x-5 gap-y-4 lg:grid-cols-2">
        {BADGE_GROUPS.map((group) => (
          <div key={group.id}>
            <p className="mb-1.5 text-xs font-bold text-slate-500">{group.title}</p>
            <ul className="flex flex-col gap-1.5">
              {BADGES.filter((badge) => badge.group === group.id).map((info) => (
                <BadgeRow info={info} key={info.id} state={badges.find((badge) => badge.id === info.id)} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfileContent({ profile }: { profile: Profile }) {
  const { summary, duels } = profile;
  const [duelFilter, setDuelFilter] = useState<DuelFilter | null>(null);
  const filterInfo = DUEL_FILTERS.find((filter) => filter.id === duelFilter);
  const listedDuels = profile.duel_history.filter((duel) => duelFilter === "all" || duel.result === duelFilter);
  const accuracy = summary.answered > 0 ? Math.round((summary.correct / summary.answered) * 100) : 0;
  const text = messages().profile;

  if (summary.rounds === 0 && duels.played === 0) {
    return (
      <section className={`${CARD} text-center`}>
        <p className="font-display text-2xl font-bold text-slate-900">{text.emptyTitle}</p>
        <p className="mt-1.5 text-sm text-slate-500">{text.emptyBody}</p>
        <Link className="mt-4 inline-block rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700" href="/">
          {text.startRace}
        </Link>
      </section>
    );
  }

  return (
    // Sütunlar içerikle genişlemez (minmax(0,1fr)); uzun adlar kısalır, kartlar ekrandan taşmaz.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2 lg:gap-5">
      <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
        <section className={CARD}>
          <p className={EYEBROW}>{text.summary}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tile label={text.rounds} value={String(summary.rounds)} />
            <Tile label={text.accuracy} value={messages().result.percent(accuracy)} />
            <Tile label={text.bestStreak} value={String(summary.best_streak)} />
            <Tile label={text.playDays} value={String(summary.play_days)} />
          </div>
          {summary.answered > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {text.answered(summary.answered, summary.correct)}
            </p>
          )}
        </section>

        <section className={CARD}>
          <p className={EYEBROW}>{text.duels}</p>
          {duels.played > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DUEL_FILTERS.map((filter) => (
                <DuelTile key={filter.id} label={filter.label} onClick={() => setDuelFilter(filter.id)} value={duels[filter.key]} />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">{text.noDuels}</p>
          )}
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
        <section className={CARD}>
          <p className={EYEBROW}>{text.boards}</p>
          <ul className="mt-3 flex flex-col gap-1.5">
            {BOARDS.map((board) => {
              const best = profile.boards.find((item) => item.game_mode === board.mode && item.variant === board.variant);
              return (
                <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2" key={board.id}>
                  <span className="min-w-0 flex-1 truncate font-bold text-slate-900">{board.label}</span>
                  {best ? (
                    <>
                      <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                        {best.score}/{QUESTIONS_PER_ROUND} · {seconds(best.duration_ms)}
                      </span>
                      <span className="w-20 shrink-0 text-right text-sm font-bold text-cyan-700 tabular-nums">
                        {messages().common.rank(best.rank)} <span className="text-xs font-semibold text-slate-400">/ {best.players}</span>
                      </span>
                    </>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400">{text.notPlayed}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {profile.recent.length > 0 && (
          <section className={CARD}>
            <p className={EYEBROW}>{text.recent}</p>
            <ol className="mt-3 flex flex-col gap-1">
              {profile.recent.map((round) => (
                <li className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm odd:bg-slate-50" key={round.created_at}>
                  <span className="w-14 shrink-0 text-xs text-slate-500">{formatShortDate(round.created_at)}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
                    {boardLabel(round.game_mode, round.variant)}
                    {round.in_room && <span className="ml-1.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">{text.room}</span>}
                  </span>
                  <span className="shrink-0 font-bold text-slate-900 tabular-nums">
                    {round.score}/{QUESTIONS_PER_ROUND}
                  </span>
                  <span className="w-12 shrink-0 text-right text-xs text-slate-500 tabular-nums">{seconds(round.duration_ms)}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      {filterInfo && (
        <BottomSheet
          description={
            duels.played > profile.duel_history.length ? text.lastDuels(profile.duel_history.length) : undefined
          }
          onClose={() => setDuelFilter(null)}
          title={filterInfo.id === "all" ? text.duels : filterInfo.label}
        >
          {listedDuels.length > 0 ? (
            <ol className="flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1">
              {listedDuels.map((duel, index) => (
                <DuelRow duel={duel} key={`${duel.finished_at}-${index}`} />
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">{text.noDuelsWithResult}</p>
          )}
        </BottomSheet>
      )}
    </div>
  );
}

/**
 * Profil sayfası: yalnızca oyuncunun kendisi görür. Başlıkta profil resmi, ad, hesap türü ve ilk oyun tarihi; altında
 * yarış özeti, düellolar (kartlara dokununca o sonuçtaki düellolar alttan açılan listede), sıralamalardaki yer ve son
 * turlar. Misafir hesapta verinin
 * çıkışta ya da cihaz değişince kaybolacağı söylenir.
 */
export function ProfileScreen() {
  const router = useRouter();
  const [player, setPlayer, isPlayerLoaded] = usePlayer();
  const profile = useProfile(player);
  const badges = useBadges(player);
  const text = messages().profile;

  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    setPlayer(null);
    router.push("/");
  };

  return (
    <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
        <Link aria-label={text.homeLink} href="/">
          <Logo isHeading={false} />
        </Link>
        <AccountMenu onSignOut={() => void signOut()} player={player} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3 lg:px-8 lg:py-5">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 lg:gap-5">
          {!isPlayerLoaded ? (
            <p className="py-12 text-center text-sm text-slate-500">{text.loading}</p>
          ) : !player ? (
            <section className={`${CARD} text-center`}>
              <p className="font-display text-2xl font-bold text-slate-900">{text.signInTitle}</p>
              <p className="mt-1.5 text-sm text-slate-500">{text.signInBody}</p>
              <Link className="mt-4 inline-block rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700" href="/">
                {text.backHome}
              </Link>
            </section>
          ) : (
            <>
              <section className={`${CARD} flex items-center gap-4`}>
                <PlayerAvatar player={player} size="lg" />
                <div className="min-w-0">
                  <h1 className="truncate font-display text-2xl leading-tight font-bold text-slate-900 lg:text-3xl">{player.name}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {profile?.is_guest ? text.guestAccount : text.googleAccount}
                    {profile?.first_played_at && text.firstPlayed(formatDate(profile.first_played_at))}
                  </p>
                </div>
              </section>

              {profile?.is_guest && (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span className="font-bold">{text.guestWarningTitle}</span>
                  {text.guestWarning}
                </p>
              )}

              {badges && <BadgesSection badges={badges} />}

              {profile === undefined ? (
                <p className="py-12 text-center text-sm text-slate-500">{text.statsLoading}</p>
              ) : profile === null ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
                  {text.loadFailed}
                </p>
              ) : (
                <ProfileContent profile={profile} />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
