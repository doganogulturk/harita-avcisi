"use client";

import { type FormEvent, useState } from "react";
import { BackArrow, ROUND_BUTTON } from "../map-puzzle/MapPuzzle";
import { messages } from "@/lib/i18n";
import { type IntroGame } from "@/lib/intro-preferences";
import { ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS } from "@/lib/room";
import { gameInfo, GameIcon, groupInfo } from "./games";

type FriendsSetupProps = {
  onBack: () => void;
  /** Düello ya da Oda'nın kurulum ekranını açar. */
  onPick: (game: Extract<IntroGame, "duel" | "room">) => void;
  /** Kod bir düelloya ya da odaya götürür; bulunamazsa hata metnini döndürür. */
  onJoin: (code: string) => Promise<string | null>;
};

/** Seçeneğin rengi: oyunun kendi rengi (Düello turuncu, Oda mor); basılabilir oyun tuşu. */
const OPTION_STYLE = {
  duel: "border-orange-300/60 bg-orange-500 [--press-edge:#c2410c]",
  room: "border-violet-300/50 bg-violet-600 [--press-edge:#4c1d95]",
} as const;

/**
 * Arkadaşlarla: üstte oyun kurma (Düello: aynı anda, iki kişi; Oda: herkes kendi zamanında, kalabalık), altta
 * arkadaşının gönderdiği kodla katılma. İki oyunun sunucu tarafı ayrıdır; burada yalnızca giriş birleşir.
 */
export function FriendsSetup({ onBack, onPick, onJoin }: FriendsSetupProps) {
  const { friends: text, setup } = messages();
  const group = groupInfo("friends");
  const options = [
    { id: "duel" as const, when: text.live },
    { id: "room" as const, when: text.async(ROOM_MIN_PLAYERS, ROOM_MAX_PLAYERS) },
  ];

  return (
    <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-1 pb-3 short:gap-2 lg:gap-6">
      <div className="flex shrink-0 items-center gap-3">
        <button aria-label={setup.backToGames} className={ROUND_BUTTON} onClick={onBack} title={setup.backToGames} type="button">
          <BackArrow />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none font-bold text-white lg:text-5xl">{group.title}</h1>
          <p className="mt-1 text-xs font-semibold text-cyan-100/75 short:hidden lg:text-base">{group.description}</p>
        </div>
      </div>

      <section aria-labelledby="friends-host" className="flex shrink-0 flex-col gap-2 lg:gap-3">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-cyan-100/60 uppercase lg:text-xs" id="friends-host">
          {text.host}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:gap-4">
          {options.map(({ id, when }) => {
            const game = gameInfo(id);
            return (
              <button
                className={`press relative flex min-w-0 cursor-pointer items-start gap-3 rounded-3xl border-2 p-4 text-left text-white focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none short:items-center short:p-2.5 lg:gap-4 lg:p-6 ${OPTION_STYLE[id]}`}
                key={id}
                onClick={() => onPick(id)}
                type="button"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 short:h-9 short:w-9 lg:h-16 lg:w-16">
                  <GameIcon className="h-7 w-7 short:h-5 short:w-5 lg:h-9 lg:w-9" game={id} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-display text-2xl leading-tight font-bold short:text-lg lg:text-3xl">{game.title}</span>
                  <span className="text-sm font-bold opacity-95 lg:text-base">{when}</span>
                  <span className="mt-1 text-xs font-semibold opacity-80 short:hidden lg:text-sm">{game.description}</span>
                </span>
                <span aria-hidden="true" className="self-center font-display text-2xl leading-none opacity-80">
                  →
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="friends-join" className="flex shrink-0 flex-col gap-2 lg:gap-3">
        <h2 className="text-[11px] font-bold tracking-[0.15em] text-cyan-100/60 uppercase lg:text-xs" id="friends-join">
          {text.join}
        </h2>
        <JoinForm onJoin={onJoin} />
      </section>
    </div>
  );
}

/** Arkadaşın gönderdiği 6 karakterlik kod: düelloya ya da odaya, hangisiyse oraya götürür. */
function JoinForm({ onJoin }: { onJoin: (code: string) => Promise<string | null> }) {
  const { home } = messages();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const theme = gameInfo("duel").theme;

  const join = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (normalized.length !== 6) return setError(home.codeLength);
    setIsBusy(true);
    const joinError = await onJoin(normalized);
    setIsBusy(false);
    setError(joinError);
  };

  return (
    <form className="flex min-w-0 flex-wrap items-center gap-2 rounded-3xl bg-white/95 p-3 shadow-sm ring-1 ring-orange-200 lg:gap-3 lg:p-5" onSubmit={(event) => void join(event)}>
      <label className="flex w-full items-center gap-1.5 text-sm font-bold text-slate-700 lg:text-base" htmlFor="join-code">
        <span aria-hidden="true">🔑</span>
        {home.haveCode}
      </label>
      <input
        aria-label={home.codeLabel}
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        className={`h-11 w-36 min-w-0 rounded-full border-2 bg-white px-3 text-center font-mono text-base font-bold tracking-[0.2em] text-slate-900 uppercase outline-none focus:ring-2 lg:h-12 lg:w-44 ${theme.outline}`}
        enterKeyHint="go"
        id="join-code"
        maxLength={6}
        onChange={(event) => {
          setCode(event.target.value);
          setError(null);
        }}
        placeholder="KOD123"
        spellCheck={false}
        value={code}
      />
      <button
        className={`hit-area h-11 rounded-full px-6 text-base font-bold shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 lg:h-12 ${theme.badge}`}
        disabled={isBusy}
        type="submit"
      >
        {isBusy ? "…" : home.join}
      </button>
      {error && <span className="w-full text-sm font-semibold text-rose-600">{error}</span>}
    </form>
  );
}
