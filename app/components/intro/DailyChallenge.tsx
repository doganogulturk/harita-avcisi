"use client";

import { useEffect, useState } from "react";
import { BottomSheet } from "../BottomSheet";
import { Leaderboard } from "../Leaderboard";
import { ShareScoreButton } from "../ShareScoreButton";
import { boardOf, dailyChoice, dailyDateLabel, dailyShareText, msUntilNextDaily, useDailyLeaderboards, type DailyStatus } from "@/lib/daily";
import { BOARDS, emptyLeaderboards, formatTime, QUESTIONS_PER_ROUND, type BoardId, type PlayChoice, type Player } from "@/lib/game";

/** "05:12" biçiminde saat ve dakika; geri sayım yarım dakikada bir güncellenir. */
function hoursMinutes(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function useNextDailyCountdown() {
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
function dailyStateOf(status: DailyStatus | null, boardId: BoardId) {
  const result = status?.results.find((item) => boardOf(item) === boardId);
  const isUsed = !result && (status?.started.some((item) => boardOf(item) === boardId) ?? false);
  return { result, isUsed, isOpen: !result && !isUsed };
}

/** Mod düğmesinin renkleri: bitirilen yeşil, bırakılan gri, oynanmamış camgöbeği. */
function stateClass(state: ReturnType<typeof dailyStateOf>) {
  if (state.result) return "border-emerald-200 bg-emerald-50 hover:bg-emerald-100";
  if (state.isUsed) return "border-slate-200 bg-slate-50 hover:bg-slate-100";
  return "border-cyan-200 bg-cyan-50 hover:bg-cyan-100";
}

function StateLabel({ state, className = "" }: { state: ReturnType<typeof dailyStateOf>; className?: string }) {
  const tone = state.result ? "text-emerald-700" : state.isUsed ? "text-slate-400" : "text-cyan-700";
  return (
    <span className={`font-bold tabular-nums ${tone} ${className}`}>
      {state.result ? `✓ ${state.result.score}/${QUESTIONS_PER_ROUND}` : state.isUsed ? "Bırakıldı" : "Oyna"}
    </span>
  );
}

const BADGE_SEEN_KEY = "harita-avcisi:daily-badge-opened";

/**
 * Başlıkta, profil resminin yanında günlük meydan okuma rozeti: gün serisi ("🔥 3"; seri yoksa "🗓 Günlük"). Bugün
 * oynanmamış bir meydan okuma varsa köşesinde kırmızı nokta durur. Hiç açılmadıysa bir halka atar, ilk açılışta durur.
 * Dokununca günün meydan okuması alttan açılır.
 */
export function DailyBadge({ status, player, onOpen }: { status: DailyStatus | null; player: Player | null; onOpen: () => void }) {
  const [hasOpened, setHasOpened] = useState(true);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı belleği yalnızca çizimden sonra okunabilir.
      setHasOpened(localStorage.getItem(BADGE_SEEN_KEY) === "1");
    } catch {
      // Depolama kapalı; halka atmaz.
    }
  }, []);

  const streak = status?.streak ?? 0;
  // Giriş yoksa her mod oynanmamış sayılır; giriş varsa durum gelince bakılır.
  const hasOpenChallenge = player ? status !== null && BOARDS.some((board) => dailyStateOf(status, board.id).isOpen) : true;

  return (
    <button
      aria-label={`Günün meydan okuması${streak > 0 ? ` · ${streak} günlük seri` : ""}${hasOpenChallenge ? " · oynanmamış meydan okuma var" : ""}`}
      className="hit-area relative flex h-9 shrink-0 items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none max-[25rem]:px-2.5"
      onClick={() => {
        setHasOpened(true);
        try {
          localStorage.setItem(BADGE_SEEN_KEY, "1");
        } catch {
          // Depolama kapalı; bu sayfa yaşamı boyunca halka yine atmaz.
        }
        onOpen();
      }}
      type="button"
    >
      {!hasOpened && <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-full bg-amber-300/40 motion-reduce:hidden" />}
      <span aria-hidden="true">{streak > 0 ? "🔥" : "🗓"}</span>
      {streak > 0 ? <span className="tabular-nums">{streak}</span> : <span className="max-[25rem]:hidden">Günlük</span>}
      {hasOpenChallenge && <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-slate-50" />}
    </button>
  );
}

type DailySheetProps = {
  status: DailyStatus | null;
  playerId: string | undefined;
  /** Açılışta seçili mod; verilmezse bitirilen ilk mod. */
  initialBoardId: BoardId | null;
  notice: string | null;
  onPlay: (choice: PlayChoice) => void;
  onClose: () => void;
};

/**
 * Günün meydan okuması, alttan açılan sayfada: seri ve kalan süre, beş mod ikişerli büyük düğmeler (tek kalan tam satır). Oynanmamış moda
 * dokununca tur başlar; bitirilen ya da bırakılan mod seçilir ve altında o modun günlük sıralaması, oyuncunun sonucu ve
 * paylaşma tuşu görünür.
 */
export function DailySheet({ status, playerId, initialBoardId, notice, onPlay, onClose }: DailySheetProps) {
  const msLeft = useNextDailyCountdown();
  const firstPlayed = BOARDS.find((board) => !dailyStateOf(status, board.id).isOpen)?.id ?? null;
  const [selected, setSelected] = useState<BoardId | null>(initialBoardId ?? firstPlayed);
  const leaderboards = useDailyLeaderboards(selected !== null);
  const mine = selected ? dailyStateOf(status, selected).result : undefined;
  const streak = status?.streak ?? 0;

  const description = [dailyDateLabel(), streak > 0 ? `🔥 ${streak} günlük seri` : null, msLeft !== null ? `yenisi ${hoursMinutes(msLeft)} sonra` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <BottomSheet description={description} onClose={onClose} title="Günün meydan okuması">
      <div className="grid shrink-0 grid-cols-2 gap-2">
        {BOARDS.map((board) => {
          const state = dailyStateOf(status, board.id);
          const isSelected = selected === board.id;
          return (
            <button
              aria-pressed={state.isOpen ? undefined : isSelected}
              className={`flex items-center justify-between gap-2 rounded-2xl border-2 px-3 py-2.5 text-left transition last:odd:col-span-2 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${stateClass(state)} ${
                isSelected ? "ring-2 ring-cyan-500 ring-offset-1" : ""
              }`}
              key={board.id}
              onClick={() => {
                if (!state.isOpen) return setSelected(board.id);
                onClose();
                onPlay(dailyChoice(board.id));
              }}
              type="button"
            >
              <span className="truncate font-display text-lg font-bold text-slate-900">{board.label}</span>
              <StateLabel className="shrink-0 text-sm" state={state} />
            </button>
          );
        })}
      </div>

      {notice && <p className="mt-2 shrink-0 text-center text-sm font-semibold text-rose-600">{notice}</p>}

      {selected ? (
        <div className="mt-4 flex min-h-0 flex-1 flex-col">
          {mine && (
            <div className="mb-3 flex shrink-0 items-center gap-3 rounded-2xl bg-emerald-50 px-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-emerald-800">Senin sonucun</p>
                <p className="font-display text-lg font-bold text-slate-900 tabular-nums">
                  {mine.score}/{QUESTIONS_PER_ROUND} · {formatTime(Math.round(mine.duration_ms / 1000))}
                  <span className="ml-2 text-sm font-semibold text-emerald-700">
                    {mine.rank}. / {mine.players}
                  </span>
                </p>
              </div>
              <div className="w-28 shrink-0">
                <ShareScoreButton isCompact text={dailyShareText(selected, mine.answers, mine.score, mine.duration_ms)} />
              </div>
            </div>
          )}
          <Leaderboard
            boardId={selected}
            currentPlayerId={playerId}
            emptyText="Bugün bu meydan okumayı henüz kimse bitirmedi."
            fillHeight
            hideTabs
            isLoading={leaderboards === null}
            leaderboardError={null}
            leaderboards={leaderboards ?? emptyLeaderboards()}
            onBoardChange={setSelected}
            showTitle={false}
          />
        </div>
      ) : (
        <p className="mt-4 text-center text-sm text-slate-500">
          Her mod için herkese aynı 10 soru, günde bir hak. Başlamak için bir moda dokun; bitirdiğinde günün sıralamasını burada
          görürsün.
        </p>
      )}
    </BottomSheet>
  );
}
