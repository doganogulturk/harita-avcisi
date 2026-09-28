"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { GameMap } from "../GameMap";
import { PlateBadge } from "../GameTopBar";
import { useMapMarkup } from "@/lib/hooks/useMapMarkup";
import {
  DUEL_QUESTION_MS,
  DUEL_QUESTIONS,
  DUEL_REVEAL_MS,
  answerOf,
  duelChoice,
  duelSides,
  locationLabel,
  questionForLocation,
  type DuelAnswer,
  type DuelPlayer,
  type DuelState,
} from "@/lib/duel";
import { flagUrl, isFlagChoice, isPlateChoice, normalizeLocationId } from "@/lib/game";
import { DuelAvatar, TONE_TEXT, type DuelTone } from "./DuelParts";

/** Sunucu saatine göre akan saat; geri sayım ve kalan süre bununla çizilir. */
function useServerClock(serverNow: () => number) {
  const [now, setNow] = useState(serverNow);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(serverNow()), 100);
    return () => window.clearInterval(timer);
  }, [serverNow]);
  return now;
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} sn`;
}

const CHIP_TONE: Record<DuelTone, string> = {
  me: "border-sky-200 bg-sky-50",
  opponent: "border-orange-200 bg-orange-50",
};

/** Oyuncunun o sorudaki durumu: düşünüyor, cevapladı (yeri gizli) ya da soru bittikten sonra cevabı. */
function answerStatus(state: DuelState, answer: DuelAnswer | undefined, isEnded: boolean, isMe: boolean, isCountdown: boolean): string {
  if (isCountdown) return "Hazır";
  if (!answer) return isEnded ? "Cevaplamadı" : "Düşünüyor…";
  if (!isEnded || answer.selected === null) return isMe ? "Cevapladın" : "Cevapladı";
  const label = locationLabel(state.game_mode, state.variant, answer.selected);
  return answer.correct ? `✓ ${label} · ${formatSeconds(answer.response_ms ?? 0)}` : `✗ ${label}`;
}

function ScoreChip({ player, tone, status, gained }: { player: DuelPlayer; tone: DuelTone; status: string; gained: number }) {
  const isOpponent = tone === "opponent";
  return (
    <div className={`flex min-w-0 items-center gap-2 rounded-2xl border-2 px-3 py-1.5 lg:gap-3 lg:px-4 lg:py-2 ${CHIP_TONE[tone]} ${isOpponent ? "flex-row-reverse" : ""}`}>
      <DuelAvatar avatar={player.avatar} name={player.name} tone={tone} />
      <div className={`min-w-0 ${isOpponent ? "text-right" : ""}`}>
        <p className="truncate text-sm font-bold text-slate-900">{player.name}</p>
        <p className="truncate text-xs text-slate-500">{status}</p>
      </div>
      <span className={`relative font-display text-3xl font-bold tabular-nums lg:text-4xl ${TONE_TEXT[tone]}`}>
        {player.score}
        {gained > 0 && (
          <span className={`absolute -top-2 ${isOpponent ? "-left-5" : "-right-5"} rounded-full bg-emerald-500 px-1.5 text-xs text-white`}>+{gained}</span>
        )}
      </span>
    </div>
  );
}

/** Soru bitince çıkan bildirim: kim kaptı, kim bildi. */
function revealMessage(state: DuelState, mine: DuelAnswer | undefined, theirs: DuelAnswer | undefined, opponentName: string): { text: string; tone: DuelTone | null } {
  const myPoints = mine?.points ?? 0;
  const theirPoints = theirs?.points ?? 0;
  if (myPoints === 0 && theirPoints === 0) return { text: "Kimse bilemedi", tone: null };
  if (state.rule === "snatch") return myPoints > 0 ? { text: "⚡ Kaptın! +1", tone: "me" } : { text: `⚡ ${opponentName} kaptı! +1`, tone: "opponent" };
  if (mine?.correct && theirs?.correct) {
    return myPoints > theirPoints
      ? { text: "🎯 İkiniz de bildiniz · sen daha hızlıydın (+1)", tone: "me" }
      : { text: `🎯 İkiniz de bildiniz · ${opponentName} daha hızlıydı (+1)`, tone: "opponent" };
  }
  return myPoints > 0 ? { text: "🎯 Bildin! +1", tone: "me" } : { text: `🎯 ${opponentName} bildi +1`, tone: "opponent" };
}

const BANNER_TONE: Record<DuelTone | "none", string> = {
  me: "bg-sky-500 shadow-sky-500/30",
  opponent: "bg-orange-500 shadow-orange-500/30",
  none: "bg-slate-600 shadow-slate-600/30",
};

type DuelGameProps = {
  state: DuelState;
  serverNow: () => number;
  onAnswer: (position: number, selected: string) => void;
  onExit: () => void;
};

export function DuelGame({ state, serverNow, onAnswer, onExit }: DuelGameProps) {
  const now = useServerClock(serverNow);
  const { mapMarkup, mapError } = useMapMarkup(state.game_mode);
  // Tıklama, sunucunun cevabı gelmeden işaretlensin diye beklemedeki cevap.
  const [pending, setPending] = useState<{ position: number; location: string } | null>(null);

  const { me, opponent } = duelSides(state);
  if (!me || !opponent) return null;

  const mode = state.game_mode;
  const choice = duelChoice(mode, state.variant);
  const position = state.question_index;
  const startedAt = state.question_started_at ? Date.parse(state.question_started_at) : 0;
  const endedAt = state.question_ended_at ? Date.parse(state.question_ended_at) : null;
  const isCountdown = now < startedAt;
  const isEnded = endedAt !== null;
  const location = state.questions.find((item) => item.position === position)?.location;
  const question = location ? questionForLocation(mode, location) : undefined;

  const mine = answerOf(state, position, me.id);
  const theirs = answerOf(state, position, opponent.id);
  const myLocation = mine?.selected ?? (pending?.position === position ? pending.location : null);
  const canAnswer = !isCountdown && !isEnded && !myLocation && question !== undefined;

  const remainingMs = Math.max(0, startedAt + DUEL_QUESTION_MS - now);
  const nextInSeconds = endedAt ? Math.max(0, Math.ceil((endedAt + DUEL_REVEAL_MS - now) / 1000)) : 0;
  const reveal = isEnded ? revealMessage(state, mine, theirs, opponent.name) : null;

  const select = (locationId: string) => {
    if (!canAnswer) return;
    const selected = normalizeLocationId(mode, locationId);
    setPending({ position, location: selected });
    onAnswer(position, selected);
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-200 px-3 py-2 lg:gap-6 lg:px-5 lg:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            aria-label="Düellodan çık"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-rose-300 hover:text-rose-600 lg:h-9 lg:w-9"
            onClick={onExit}
            title="Düellodan çık · 30 saniye içinde dönmezsen hükmen kaybedersin"
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <path d="M14 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8M17 16l4-4-4-4M21 12H10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <ScoreChip gained={isEnded ? (mine?.points ?? 0) : 0} player={me} status={answerStatus(state, mine, isEnded, true, isCountdown)} tone="me" />
        </div>

        <div className="flex min-w-0 flex-col items-center">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase lg:text-xs">
            Soru {Math.min(position + 1, DUEL_QUESTIONS)} / {DUEL_QUESTIONS}
          </p>
          <div className="flex min-w-0 items-center gap-2 lg:gap-3">
            {isCountdown || !question || !location ? (
              <h1 className="font-display text-2xl font-bold text-slate-400 lg:text-3xl">Hazır ol…</h1>
            ) : isFlagChoice(choice) && "code" in question ? (
              <>
                <h1 className="sr-only">Bu bayrak hangi ülkenin?</h1>
                <Image
                  alt="Sorulan ülkenin bayrağı"
                  className="h-9 w-auto rounded-sm border border-slate-200 shadow-sm lg:h-11"
                  height={44}
                  key={question.code}
                  src={flagUrl(question.code)}
                  unoptimized
                  width={59}
                />
                {isEnded && <span className="truncate font-display text-xl font-bold text-cyan-700 lg:text-2xl">{question.name}</span>}
              </>
            ) : isPlateChoice(choice) && "plate" in question ? (
              <>
                <h1 className="sr-only">Bu plaka hangi ilin?</h1>
                <PlateBadge key={question.plate} plate={question.plate} />
                {isEnded && <span className="truncate font-display text-xl font-bold text-cyan-700 lg:text-2xl">{question.city}</span>}
              </>
            ) : (
              <h1 className="truncate font-display text-2xl font-bold text-cyan-700 lg:text-3xl">{"city" in question ? question.city : question.name}</h1>
            )}
            {!isCountdown && !isEnded && question && (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold tabular-nums lg:h-10 lg:w-10 ${
                  remainingMs <= 5000 ? "border-rose-400 text-rose-600" : "border-cyan-300 text-cyan-700"
                }`}
              >
                {Math.ceil(remainingMs / 1000)}
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 justify-end">
          <ScoreChip
            gained={isEnded ? (theirs?.points ?? 0) : 0}
            player={opponent}
            status={answerStatus(state, theirs, isEnded, false, isCountdown)}
            tone="opponent"
          />
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <GameMap
          answerState={isEnded ? (mine?.correct ? "correct" : "incorrect") : null}
          isInteractive
          mapError={mapError}
          mapMarkup={mapMarkup}
          mode={mode}
          onSelect={select}
          opponentLocation={theirs?.selected ?? null}
          pendingLocation={myLocation}
          question={isCountdown ? undefined : question}
          selectedLocation={mine?.selected ?? null}
        />

        {isCountdown && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <p className="font-display text-xl font-bold tracking-[0.2em] text-slate-500 uppercase">Düello başlıyor</p>
            <p className="font-display text-9xl font-bold text-cyan-600 tabular-nums" key={Math.ceil((startedAt - now) / 1000)}>
              {Math.max(1, Math.ceil((startedAt - now) / 1000))}
            </p>
          </div>
        )}

        {reveal && (
          <div
            className={`pointer-events-none absolute top-4 left-1/2 max-w-[90%] -translate-x-1/2 rounded-2xl px-5 py-2.5 text-center font-display text-lg font-bold text-white shadow-xl lg:top-6 lg:px-6 lg:py-3 lg:text-2xl ${BANNER_TONE[reveal.tone ?? "none"]}`}
          >
            {reveal.text}
          </div>
        )}

        {isEnded && (
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col gap-1.5 rounded-2xl bg-white/90 p-3 text-xs shadow-lg backdrop-blur lg:bottom-6 lg:left-6 lg:p-4 lg:text-sm">
            <span className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400" /> Doğru cevap
            </span>
            {mine && !mine.correct && (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400" /> Senin tıkladığın
              </span>
            )}
            {theirs && (
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full border-2 border-orange-600 bg-orange-300" /> {opponent.name} tıkladı
              </span>
            )}
          </div>
        )}

        {isEnded && (
          <div className="pointer-events-none absolute right-16 bottom-3 rounded-full bg-cyan-100 px-4 py-2 text-xs font-bold text-cyan-800 lg:bottom-6 lg:text-sm">
            {position + 1 >= DUEL_QUESTIONS ? "Sonuçlar" : "Sonraki soru"}: {nextInSeconds} sn
          </div>
        )}

        {!opponent.online && (
          <div className="pointer-events-none absolute top-20 left-1/2 -translate-x-1/2 rounded-xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-800 shadow">
            {opponent.name} bağlantısını kaybetti. 30 saniye içinde dönmezse düelloyu kazanırsın.
          </div>
        )}
      </div>
    </section>
  );
}
