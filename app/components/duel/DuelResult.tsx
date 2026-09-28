"use client";

import { useState } from "react";
import {
  DUEL_RULES,
  answerOf,
  duelModeLabel,
  duelSides,
  locationLabel,
  type DuelAnswer,
  type DuelSettings,
  type DuelState,
} from "@/lib/duel";
import { DuelAvatar, DuelSettingsPicker, GlowHeading, SHIMMER_BUTTON, TONE_TEXT, type DuelTone } from "./DuelParts";

type DuelResultProps = {
  state: DuelState;
  onRematch: (settings: DuelSettings) => void;
  onAcceptRematch: (code: string) => void;
  onDeclineRematch: () => void;
  onHome: () => void;
  isRequestingRematch: boolean;
};

function AnswerCell({ state, answer, tone }: { state: DuelState; answer: DuelAnswer | undefined; tone: DuelTone }) {
  if (!answer || answer.selected === null) return <span className="text-slate-300">—</span>;
  const points = answer.points ?? 0;
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
      {answer.correct ? (
        <span className="font-semibold text-emerald-600">✓ {((answer.response_ms ?? 0) / 1000).toFixed(1).replace(".", ",")} sn</span>
      ) : (
        <span className="font-semibold text-rose-500">✗ {locationLabel(state.game_mode, state.variant, answer.selected)}</span>
      )}
      {points > 0 && (
        <span className={`rounded-full px-1.5 text-[11px] font-bold ${tone === "me" ? "bg-sky-100 text-sky-700" : "bg-orange-100 text-orange-700"}`}>
          {state.rule === "snatch" ? "⚡" : ""}+{points}
        </span>
      )}
    </span>
  );
}

/** Rövanş bölümü: istek gönder, gelen isteği kabul et / reddet, ya da başka modla iste. */
function RematchPanel({ state, onRematch, onAcceptRematch, onDeclineRematch, isRequestingRematch }: Omit<DuelResultProps, "onHome">) {
  const { me, opponent } = duelSides(state);
  const [isChoosing, setIsChoosing] = useState(false);
  const [settings, setSettings] = useState<DuelSettings>({ mode: state.game_mode, variant: state.variant, rule: state.rule });
  const rematch = state.rematch;
  const opponentName = opponent?.name ?? "Rakibin";

  if (rematch && !rematch.declined && rematch.by !== me?.id) {
    return (
      <div className="rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 text-center">
        <p className="font-display text-xl font-bold text-slate-900">{opponentName} rövanş istiyor!</p>
        <p className="mt-1 text-sm text-slate-600">
          {duelModeLabel(rematch.game_mode, rematch.variant)} · {DUEL_RULES[rematch.rule].icon} {DUEL_RULES[rematch.rule].label}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button className={`${SHIMMER_BUTTON} !py-2.5 !text-lg`} onClick={() => onAcceptRematch(rematch.code)} type="button">
            Kabul et
          </button>
          <button
            className="rounded-2xl border-2 border-slate-200 bg-white font-display text-lg font-bold text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
            onClick={onDeclineRematch}
            type="button"
          >
            Reddet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <GlowHeading>Rövanş</GlowHeading>
      {rematch?.declined && rematch.by === me?.id && (
        <p className="rounded-xl bg-slate-100 px-3 py-2 text-center text-sm text-slate-600">{opponentName} rövanşı reddetti.</p>
      )}
      {isChoosing ? (
        <>
          <DuelSettingsPicker onChange={setSettings} value={settings} />
          <button className={SHIMMER_BUTTON} disabled={isRequestingRematch} onClick={() => onRematch(settings)} type="button">
            Rövanş iste
          </button>
          <button className="text-sm font-semibold text-slate-500 hover:text-cyan-700" onClick={() => setIsChoosing(false)} type="button">
            Vazgeç
          </button>
        </>
      ) : (
        <>
          <button
            className={SHIMMER_BUTTON}
            disabled={isRequestingRematch}
            onClick={() => onRematch({ mode: state.game_mode, variant: state.variant, rule: state.rule })}
            type="button"
          >
            ↻ Rövanş
          </button>
          <button
            className="sweep sweep-cyan rounded-2xl py-3 font-display text-base font-bold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:text-cyan-700"
            onClick={() => setIsChoosing(true)}
            type="button"
          >
            Başka modla rövanş
          </button>
          <p className="text-center text-xs text-slate-500">{opponentName} kabul ederse ikiniz de yeni düellonun lobisine geçersiniz.</p>
        </>
      )}
    </div>
  );
}

export function DuelResult(props: DuelResultProps) {
  const { state, onHome } = props;
  const { me, opponent, myWins, opponentWins } = duelSides(state);
  if (!me || !opponent) return null;

  const isDraw = state.winner_id === null;
  const iWon = state.winner_id === me.id;
  const title = isDraw ? "Berabere! 🤝" : iWon ? "Kazandın! 🏆" : `${opponent.name} kazandı`;
  const forfeitNote =
    state.finish_reason === "forfeit" ? (iWon ? `${opponent.name} düellodan ayrıldı; hükmen kazandın.` : "Bağlantın koptuğu için hükmen kaybettin.") : null;

  return (
    <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[26rem_minmax(0,1fr)] lg:gap-5">
      <aside className="flex flex-col items-center gap-4 rounded-3xl border-2 border-slate-200 bg-white p-5 text-center lg:min-h-0 lg:overflow-y-auto lg:p-7">
        <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">
          {duelModeLabel(state.game_mode, state.variant)} · {DUEL_RULES[state.rule].icon} {DUEL_RULES[state.rule].label}
        </p>
        <p className="font-display text-4xl font-bold text-slate-900">{title}</p>
        <div className="flex items-center gap-4">
          <DuelAvatar avatar={me.avatar} name={me.name} size="md" tone="me" />
          <p className="font-display text-5xl font-bold whitespace-nowrap tabular-nums lg:text-6xl">
            <span className={TONE_TEXT.me}>{me.score}</span>
            <span className="text-slate-300"> – </span>
            <span className={TONE_TEXT.opponent}>{opponent.score}</span>
          </p>
          <DuelAvatar avatar={opponent.avatar} name={opponent.name} size="md" tone="opponent" />
        </div>
        {forfeitNote && <p className="text-sm text-slate-500">{forfeitNote}</p>}
        {myWins + opponentWins > 1 && (
          <span className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-600">
            Seri: Sen {myWins} – {opponentWins} {opponent.name}
          </span>
        )}
        <div className="flex w-full flex-col gap-3 pt-2 lg:mt-auto">
          <RematchPanel {...props} />
          <button className="text-sm font-semibold text-slate-500 underline-offset-4 hover:text-cyan-700 hover:underline" onClick={onHome} type="button">
            Ana menü
          </button>
        </div>
      </aside>

      <section className="rounded-3xl border-2 border-slate-200 bg-white p-5 lg:min-h-0 lg:overflow-y-auto lg:p-7">
        <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">Soru soru</p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="w-8 pb-2 font-semibold">#</th>
              <th className="pb-2 font-semibold">Soru</th>
              <th className={`pb-2 font-semibold ${TONE_TEXT.me}`}>Sen</th>
              <th className={`pb-2 font-semibold ${TONE_TEXT.opponent}`}>{opponent.name}</th>
            </tr>
          </thead>
          <tbody>
            {state.questions.map((item) => (
              <tr className="border-t border-slate-100" key={item.position}>
                <td className="py-2.5 font-bold text-slate-400 tabular-nums">{item.position + 1}</td>
                <td className="py-2.5 font-bold text-slate-900">{locationLabel(state.game_mode, state.variant, item.location)}</td>
                <td className="py-2.5">
                  <AnswerCell answer={answerOf(state, item.position, me.id)} state={state} tone="me" />
                </td>
                <td className="py-2.5">
                  <AnswerCell answer={answerOf(state, item.position, opponent.id)} state={state} tone="opponent" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-xs text-slate-500">✓ doğru ve cevap süresi · ✗ yanlış tıkladığı yer · — cevaplamadı</p>
      </section>
    </div>
  );
}
