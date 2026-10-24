"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AccountMenu } from "../AccountMenu";
import { BottomSheet } from "../BottomSheet";
import { DuelAvatar } from "../duel/DuelParts";
import { Logo } from "../Logo";
import { PlayerAvatar } from "../PlayerBadge";
import { DUEL_RULES, duelModeLabel } from "@/lib/duel";
import { BOARDS, choiceForBoard, choiceLabel, formatTime, QUESTIONS_PER_ROUND, type BoardVariant, type GameMode } from "@/lib/game";
import { usePlayer } from "@/lib/hooks/usePlayer";
import { useProfile, type DuelResultKind, type Profile, type ProfileDuel } from "@/lib/hooks/useProfile";
import { getSupabaseClient } from "@/lib/supabase";

const CARD = "rounded-3xl border-2 border-slate-200 bg-white p-5 lg:p-6";
const EYEBROW = "text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase";

const DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const SHORT_DATE = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" });

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

const DUEL_FILTERS: { id: DuelFilter; label: string; key: "played" | "wins" | "draws" | "losses" }[] = [
  { id: "all", label: "Oynanan", key: "played" },
  { id: "win", label: "Galibiyet", key: "wins" },
  { id: "draw", label: "Beraberlik", key: "draws" },
  { id: "loss", label: "Mağlubiyet", key: "losses" },
];

const RESULT_STYLE: Record<DuelResultKind, { label: string; className: string }> = {
  win: { label: "Galibiyet", className: "bg-emerald-50 text-emerald-700" },
  draw: { label: "Beraberlik", className: "bg-slate-100 text-slate-600" },
  loss: { label: "Mağlubiyet", className: "bg-rose-50 text-rose-700" },
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
  const name = duel.opponent_name ?? "Rakip";
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
          {DATE.format(new Date(duel.finished_at))}
          {duel.finish_reason === "forfeit" && " · hükmen"}
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

function ProfileContent({ profile }: { profile: Profile }) {
  const { summary, duels } = profile;
  const [duelFilter, setDuelFilter] = useState<DuelFilter | null>(null);
  const filterInfo = DUEL_FILTERS.find((filter) => filter.id === duelFilter);
  const listedDuels = profile.duel_history.filter((duel) => duelFilter === "all" || duel.result === duelFilter);
  const accuracy = summary.answered > 0 ? Math.round((summary.correct / summary.answered) * 100) : 0;

  if (summary.rounds === 0 && duels.played === 0) {
    return (
      <section className={`${CARD} text-center`}>
        <p className="font-display text-2xl font-bold text-slate-900">Henüz yarış turu oynamadın</p>
        <p className="mt-1.5 text-sm text-slate-500">İlk yarış turundan sonra istatistiklerin, sıralamadaki yerin ve en çok yanlış yaptığın yerler burada görünür.</p>
        <Link className="mt-4 inline-block rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700" href="/">
          Yarışa başla
        </Link>
      </section>
    );
  }

  return (
    // Sütunlar içerikle genişlemez (minmax(0,1fr)); uzun adlar kısalır, kartlar ekrandan taşmaz.
    <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2 lg:gap-5">
      <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
        <section className={CARD}>
          <p className={EYEBROW}>Yarış özeti</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Tile label="Yarış turu" value={String(summary.rounds)} />
            <Tile label="Başarı" value={`%${accuracy}`} />
            <Tile label="En uzun seri" value={String(summary.best_streak)} />
            <Tile label="Oynadığın gün" value={String(summary.play_days)} />
          </div>
          {summary.answered > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              {summary.answered} sorunun {summary.correct} tanesini doğru bildin.
            </p>
          )}
        </section>

        <section className={CARD}>
          <p className={EYEBROW}>Düellolar</p>
          {duels.played > 0 ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DUEL_FILTERS.map((filter) => (
                <DuelTile key={filter.id} label={filter.label} onClick={() => setDuelFilter(filter.id)} value={duels[filter.key]} />
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Henüz düello oynamadın. Bir arkadaşına kod gönder, aynı sorularla yarışın.</p>
          )}
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:gap-5">
        <section className={CARD}>
          <p className={EYEBROW}>Sıralamalardaki yerin</p>
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
                        {best.rank}. <span className="text-xs font-semibold text-slate-400">/ {best.players}</span>
                      </span>
                    </>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400">Henüz oynamadın</span>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {profile.recent.length > 0 && (
          <section className={CARD}>
            <p className={EYEBROW}>Son yarış turların</p>
            <ol className="mt-3 flex flex-col gap-1">
              {profile.recent.map((round) => (
                <li className="flex items-center gap-3 rounded-xl px-3 py-1.5 text-sm odd:bg-slate-50" key={round.created_at}>
                  <span className="w-14 shrink-0 text-xs text-slate-500">{SHORT_DATE.format(new Date(round.created_at))}</span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">
                    {boardLabel(round.game_mode, round.variant)}
                    {round.in_room && <span className="ml-1.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-violet-700">Oda</span>}
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
            duels.played > profile.duel_history.length ? `Son ${profile.duel_history.length} düellon gösteriliyor.` : undefined
          }
          onClose={() => setDuelFilter(null)}
          title={filterInfo.id === "all" ? "Düellolar" : filterInfo.label}
        >
          {listedDuels.length > 0 ? (
            <ol className="flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1">
              {listedDuels.map((duel, index) => (
                <DuelRow duel={duel} key={`${duel.finished_at}-${index}`} />
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">Bu sonuçla biten düello yok.</p>
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

  const signOut = async () => {
    await getSupabaseClient()?.auth.signOut();
    setPlayer(null);
    router.push("/");
  };

  return (
    <main className="safe-area flex h-[100dvh] flex-col bg-slate-50 text-slate-900">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-3 lg:px-8 lg:pt-5">
        <Link aria-label="Ana sayfa" href="/">
          <Logo isHeading={false} />
        </Link>
        <AccountMenu onSignOut={() => void signOut()} player={player} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3 lg:px-8 lg:py-5">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 lg:gap-5">
          {!isPlayerLoaded ? (
            <p className="py-12 text-center text-sm text-slate-500">Yükleniyor…</p>
          ) : !player ? (
            <section className={`${CARD} text-center`}>
              <p className="font-display text-2xl font-bold text-slate-900">Profil için giriş yap</p>
              <p className="mt-1.5 text-sm text-slate-500">Google ile ya da misafir olarak giriş yapınca istatistiklerin burada görünür.</p>
              <Link className="mt-4 inline-block rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700" href="/">
                Ana sayfaya dön
              </Link>
            </section>
          ) : (
            <>
              <section className={`${CARD} flex items-center gap-4`}>
                <PlayerAvatar player={player} size="lg" />
                <div className="min-w-0">
                  <h1 className="truncate font-display text-2xl leading-tight font-bold text-slate-900 lg:text-3xl">{player.name}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {profile?.is_guest ? "Misafir hesap" : "Google hesabı"}
                    {profile?.first_played_at && ` · İlk oyun ${DATE.format(new Date(profile.first_played_at))}`}
                  </p>
                </div>
              </section>

              {profile?.is_guest && (
                <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <span className="font-bold">Misafir hesap:</span> çıkış yaparsan ya da cihaz değiştirirsen istatistiklerin kaybolur.
                </p>
              )}

              {profile === undefined ? (
                <p className="py-12 text-center text-sm text-slate-500">İstatistiklerin yükleniyor…</p>
              ) : profile === null ? (
                <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-800">
                  Profil yüklenemedi. Bağlantını kontrol edip sayfayı yenile.
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
