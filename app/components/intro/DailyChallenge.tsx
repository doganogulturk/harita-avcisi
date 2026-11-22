"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "../BottomSheet";
import { Leaderboard } from "../Leaderboard";
import { ShareScoreButton } from "../ShareScoreButton";
import { SectionTitle } from "./SetupParts";
import { messages } from "@/lib/i18n";
import { boardOf, dailyChoice, dailyDateLabel, dailyShareText, msUntilNextDaily, useDailyLeaderboards, type DailyStatus } from "@/lib/daily";
import { BOARDS, emptyLeaderboards, formatTime, QUESTIONS_PER_ROUND, type BoardId, type PlayChoice } from "@/lib/game";

/** Günlük sayfasının iki bölümü: Türkiye (İller, Plakalar) ve Dünya (Ülkeler, Bayraklar, Başkentler). */
const DAILY_GROUPS: { id: "turkey" | "world"; boards: BoardId[] }[] = [
  { id: "turkey", boards: ["turkey", "turkey-plates"] },
  { id: "world", boards: ["world-hard", "world-flags", "world-capitals"] },
];

/** "05:12" biçiminde saat ve dakika; geri sayım yarım dakikada bir güncellenir. */
export function hoursMinutes(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function useNextDailyCountdown() {
  const [msLeft, setMsLeft] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setMsLeft(msUntilNextDaily());
    update();
    const timer = window.setInterval(update, 30000);
    return () => window.clearInterval(timer);
  }, []);
  return msLeft;
}

/** Bir modun bugünkü durumu: bitirildi (sonucuyla), başlatılıp bırakıldı ya da oynanmadı. */
export function dailyStateOf(status: DailyStatus | null, boardId: BoardId) {
  const result = status?.results.find((item) => boardOf(item) === boardId);
  const isUsed = !result && (status?.started.some((item) => boardOf(item) === boardId) ?? false);
  return { result, isUsed, isOpen: !result && !isUsed };
}

type DailyState = ReturnType<typeof dailyStateOf>;

/** Mod kartının renkleri: bitirilen yeşil, bırakılan gri, oynanmamış (hâlâ yapılabilir) açık gül tonu. Çarpı kullanılmaz. */
function rowClass(state: DailyState) {
  if (state.result) return "border-emerald-200 bg-emerald-50 hover:bg-emerald-100";
  if (state.isUsed) return "border-slate-200 bg-slate-50 text-slate-500";
  return "border-rose-200 bg-rose-50 hover:bg-rose-100";
}

/** Kartın altındaki durum: "✓ 8/10" (bitti), "Bırakıldı" ya da "Başla ›". Durum yalnızca renkle söylenmez. */
function StateLabel({ state }: { state: DailyState }) {
  const text = messages().dailySheet;
  if (state.result) {
    return (
      <span className="text-sm font-bold text-emerald-700 tabular-nums">
        ✓ {state.result.score}/{QUESTIONS_PER_ROUND}
      </span>
    );
  }
  if (state.isUsed) return <span className="text-sm font-bold text-slate-400">{text.abandoned}</span>;
  return <span className="text-sm font-bold text-rose-700">{text.start} ›</span>;
}

/** Ana ekrandaki Günlük girişi için bugünün özeti: kaç mod bitirildi, kaç mod var, gün serisi. */
export function dailyProgress(status: DailyStatus | null) {
  return {
    done: BOARDS.filter((board) => dailyStateOf(status, board.id).result).length,
    total: BOARDS.length,
    streak: status?.streak ?? 0,
  };
}

type DailySheetProps = {
  status: DailyStatus | null;
  playerId: string | undefined;
  notice: string | null;
  onPlay: (choice: PlayChoice) => void;
  onClose: () => void;
};

/**
 * Günün meydan okuması, alttan açılan sayfada (geniş ekranda ortada pencere). Üstte tarih, gün serisi ve kalan süre,
 * altında iki bölüm, Oyna ekranındaki gibi bayrak ya da dünya simgesi ve adıyla: Türkiye (İller, Plakalar) ve Dünya
 * (Ülkeler, Bayraklar, Başkentler). Bir bölümün modları yan yana kartlardır ve her biri bugünkü durumunu söyler:
 * oynanmamış (gül tonu, "Başla ›"), bitirilmiş (yeşil, "✓ 8/10") ya da bırakılmış (gri). Oynanmamış moda dokununca tur başlar. Bitirilmiş ya da bırakılmış moda dokununca sayfa o modun ayrıntısına geçer:
 * oyuncunun sonucu, paylaşma tuşu ve günün sıralaması; ← ile modlara dönülür. Sayfa uzamasın diye liste ve ayrıntı aynı
 * anda gösterilmez.
 */
export function DailySheet({ status, playerId, notice, onPlay, onClose }: DailySheetProps) {
  const msLeft = useNextDailyCountdown();
  const [detail, setDetail] = useState<BoardId | null>(null);
  const leaderboards = useDailyLeaderboards(detail !== null);
  const streak = status?.streak ?? 0;

  const text = messages().dailySheet;
  const description = [dailyDateLabel(), streak > 0 ? text.streak(streak) : null, msLeft !== null ? text.nextIn(hoursMinutes(msLeft)) : null]
    .filter(Boolean)
    .join(" · ");

  if (detail) {
    const mine = dailyStateOf(status, detail).result;
    return (
      <BottomSheet description={description} isFocused onClose={onClose} title={text.title}>
        <button
          className="mb-3 flex shrink-0 items-center gap-1.5 self-start rounded-full border border-slate-200 py-1.5 pr-3.5 pl-2.5 text-sm font-bold text-slate-600 transition hover:border-cyan-300 hover:text-cyan-700 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
          onClick={() => setDetail(null)}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {text.back}
        </button>
        <div className="flex min-h-0 flex-1 flex-col">
          {mine && (
            <div className="mb-3 flex shrink-0 items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-emerald-800">{text.yourResult}</p>
                <p className="font-display text-lg font-bold text-slate-900 tabular-nums">
                  {mine.score}/{QUESTIONS_PER_ROUND} · {formatTime(Math.round(mine.duration_ms / 1000))}
                  <span className="ml-2 text-sm font-semibold text-emerald-700">
                    {messages().common.rank(mine.rank)} / {mine.players}
                  </span>
                </p>
              </div>
              <div className="w-28 shrink-0">
                <ShareScoreButton isCompact text={dailyShareText(detail, mine.answers, mine.score, mine.duration_ms)} />
              </div>
            </div>
          )}
          <Leaderboard
            boardId={detail}
            currentPlayerId={playerId}
            emptyText={text.empty}
            fillHeight
            hideTabs
            isLoading={leaderboards === null}
            leaderboardError={null}
            leaderboards={leaderboards ?? emptyLeaderboards()}
            onBoardChange={setDetail}
            showTitle={false}
          />
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet description={description} isFocused onClose={onClose} title={text.title}>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-3 text-xs font-semibold text-slate-500">{text.rule}</p>
        {notice && <p className="mb-3 text-center text-sm font-semibold text-rose-600">{notice}</p>}

        <div className="flex flex-col gap-4 pb-1">
          {DAILY_GROUPS.map((group) => (
            <section aria-labelledby={`daily-${group.id}`} key={group.id}>
              {/* Oyna ekranındaki bölüm başlığı: bayrak ya da dünya simgesi ve ad, yanında ince çizgi. */}
              <div className="mb-2" id={`daily-${group.id}`}>
                <SectionTitle map={group.id} tone="light" />
              </div>
              {/* Bölümün modları yan yana: Türkiye'de iki, Dünya'da üç sütun. Dar telefonda üç kart da sığar, kartlar dar ve ad kısalır. */}
              <ul className={`grid gap-2 ${group.boards.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                {group.boards.map((id) => {
                  const state = dailyStateOf(status, id);
                  const name = messages().setup.tiles[id];
                  const stateText = state.result ? `✓ ${state.result.score}/${QUESTIONS_PER_ROUND}` : state.isUsed ? text.abandoned : text.start;
                  return (
                    <li key={id}>
                      <button
                        aria-label={text.stateAria(name, stateText)}
                        className={`flex h-full w-full min-w-0 flex-col items-start justify-between gap-1.5 rounded-2xl border-2 px-3 py-2.5 text-left transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${rowClass(state)}`}
                        onClick={() => {
                          if (!state.isOpen) return setDetail(id);
                          onClose();
                          onPlay(dailyChoice(id));
                        }}
                        type="button"
                      >
                        <span className="max-w-full truncate font-display text-base font-bold text-slate-900 sm:text-lg">{name}</span>
                        <StateLabel state={state} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
}
