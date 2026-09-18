import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { AuthPanel } from "./AuthPanel";
import { PlayButton } from "./PlayButton";
import { PlayerBadge } from "./PlayerBadge";
import {
  choiceLabel,
  FLAG_CHOICE,
  flagUrl,
  GAME_DURATION_SECONDS,
  MAP_URLS,
  QUESTIONS_PER_ROUND,
  type GameMode,
  type PlayChoice,
  type PlayKind,
  type Player,
  type QuestionPrompt,
} from "@/lib/game";
import { provinces } from "@/lib/turkish-plates";
import { CONTINENTS, countriesIn, countryCount } from "@/lib/world-countries";

type IntroScreenProps = {
  player: Player | null;
  readyModes: GameMode[];
  pendingChoice: PlayChoice | null;
  isSigningIn: boolean;
  authError: string | null;
  supabaseConfigured: boolean;
  onPlay: (choice: PlayChoice) => void;
  onCancelPendingChoice: () => void;
  onGoogleSignIn: () => void;
  onGuestSignIn: (name: string) => void;
  onSignOut: () => void;
};

const KIND_OPTIONS: { id: PlayKind; label: string; summary: string }[] = [
  { id: "ranked", label: "Yarış", summary: `${QUESTIONS_PER_ROUND} soru · ${GAME_DURATION_SECONDS} saniye · Eşit puanda hızlı olan önde` },
  { id: "practice", label: "Antrenman", summary: "Giriş yok, süre yok · Sen bitirene kadar sürer · Sıralamaya kaydedilmez" },
];

/** Bayrak turunun rozeti: sayı yerine küçük bir bayrak. */
const FLAG_BADGE = (
  <Image
    alt=""
    className="block h-4 w-auto rounded-[3px] shadow-sm ring-2 ring-white"
    height={16}
    src={flagUrl("tr")}
    unoptimized
    width={21}
  />
);

const PROMPT_OPTIONS: { id: QuestionPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "flag", label: "Bayrak" },
];

/**
 * Seçili sekme tarayıcıda hatırlanır; antrenmandan ana menüye dönen oyuncu yine Antrenman'ı görür.
 * Sunucuda her zaman "Yarış" çizildiği için hidrasyon uyuşmazlığı olmaz. Depolama kullanılamıyorsa
 * seçim yalnızca sayfa açık kaldığı sürece bellekte tutulur.
 */
const KIND_STORAGE_KEY = "harita-avcisi:intro-kind";
const kindListeners = new Set<() => void>();
let kindInMemory: PlayKind = "ranked";

function readKind(): PlayKind {
  try {
    const stored = localStorage.getItem(KIND_STORAGE_KEY);
    if (stored === "ranked" || stored === "practice") return stored;
  } catch {
    // Depolama kapalı; bellekteki değer kullanılır.
  }
  return kindInMemory;
}

function writeKind(kind: PlayKind) {
  kindInMemory = kind;
  try {
    localStorage.setItem(KIND_STORAGE_KEY, kind);
  } catch {
    // Depolama kapalı; seçim bu sayfa yaşamı boyunca bellekte kalır.
  }
  kindListeners.forEach((listener) => listener());
}

function subscribeKind(listener: () => void) {
  kindListeners.add(listener);
  return () => {
    kindListeners.delete(listener);
  };
}

/** Başlıktaki Yarış / Antrenman ve Dünya kartındaki İsim / Bayrak seçicisi. */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
  tone,
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  tone: "cyan" | "amber";
}) {
  const active = tone === "cyan" ? "bg-cyan-600 text-white shadow-sm" : "bg-amber-100 text-amber-800";
  const ring = tone === "cyan" ? "focus-visible:ring-cyan-300" : "focus-visible:ring-amber-300";
  const padding = size === "md" ? "px-6 py-2 text-sm lg:text-base" : "px-3 py-1 text-xs";
  return (
    <div aria-label={label} className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5" role="radiogroup">
      {options.map((option) => (
        <button
          aria-checked={value === option.id}
          className={`rounded-full font-bold transition focus-visible:ring-2 focus-visible:outline-none ${padding} ${ring} ${value === option.id ? active : "text-slate-500 hover:text-slate-800"}`}
          key={option.id}
          onClick={() => onChange(option.id)}
          role="radio"
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ModeCard({
  aside,
  children,
  isReady,
  mapMode,
  subtitle,
  title,
}: {
  aside?: React.ReactNode;
  children: React.ReactNode;
  isReady: boolean;
  mapMode: GameMode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="group relative isolate flex min-h-[13rem] flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white p-6 transition-all short:min-h-0 short:p-5 lg:p-8 duration-200 hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-950/10">
      {/* Başlık ile tuşlar arasında silik harita silüeti. SVG'lerde dolgu rengi olmadığı için resim olarak siyah çizilir; opaklıkla soldurulur. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-20 bottom-16 -z-10 bg-contain bg-center bg-no-repeat opacity-[0.07] transition-opacity duration-200 group-hover:opacity-[0.11] lg:inset-x-10 lg:top-28 lg:bottom-24"
        style={{ backgroundImage: `url(${MAP_URLS[mapMode]})` }}
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-bold text-slate-800 transition-colors group-hover:text-cyan-800 short:text-xl lg:text-3xl">{title}</p>
          <p className="mt-0.5 text-sm text-slate-500 lg:text-base">{subtitle}</p>
        </div>
        {aside}
      </div>
      {/* Tuşlar kartın dibine yaslanır; kart yüksekliği ekranla büyüdükçe silüete yer açılır. */}
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-3 pt-8 short:pt-5 lg:gap-x-3">{children}</div>
      {!isReady && <p className="mt-2 text-xs text-slate-400">Harita hazırlanıyor...</p>}
    </div>
  );
}

export function IntroScreen({
  player,
  readyModes,
  pendingChoice,
  isSigningIn,
  authError,
  supabaseConfigured,
  onPlay,
  onCancelPendingChoice,
  onGoogleSignIn,
  onGuestSignIn,
  onSignOut,
}: IntroScreenProps) {
  const isTurkeyReady = readyModes.includes("turkey");
  const isWorldReady = readyModes.includes("world");
  const kind = useSyncExternalStore(subscribeKind, readKind, () => "ranked" as const);
  // Antrenmanda soru tipi yalnızca Dünya'da seçilir; Türkiye'de bayrak yok.
  const [practicePrompt, setPracticePrompt] = useState<QuestionPrompt>("name");
  const practiceWorld = (choice: Omit<PlayChoice, "kind" | "mode" | "prompt">) =>
    onPlay({ kind: "practice", mode: "world", prompt: practicePrompt, ...choice });

  return (
    <section className="flex w-full flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-cyan-950/10 sm:p-10 short:p-5 lg:p-14">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-3 lg:gap-4">
              <span
                aria-hidden="true"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 sm:h-14 sm:w-14 short:h-9 short:w-9 short:rounded-xl lg:h-16 lg:w-16"
              >
                {/* Nişangah: "avcı" ve haritada bir yeri hedefleme. */}
                <svg className="h-7 w-7 sm:h-9 sm:w-9 short:h-6 short:w-6 lg:h-10 lg:w-10" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="7" />
                  <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  <circle cx="12" cy="12" fill="currentColor" r="1.5" stroke="none" />
                </svg>
              </span>
              <span className="font-display text-4xl leading-none font-bold tracking-[-0.03em] text-slate-900 sm:text-5xl short:text-3xl lg:text-6xl">
                harita <span className="text-cyan-700">avcısı</span>
              </span>
            </h1>
            <p className="mt-3 text-lg text-slate-600 short:mt-1 short:text-base">Sorulan ili, ülkeyi ya da bayrağı haritada bul.</p>
          </div>
          <PlayerBadge onSignOut={onSignOut} player={player} />
        </div>

        {pendingChoice && !player ? (
          <div className="mt-7">
            <AuthPanel
              authError={authError}
              choiceLabel={choiceLabel(pendingChoice)}
              isSigningIn={isSigningIn}
              onCancel={onCancelPendingChoice}
              onGoogleSignIn={onGoogleSignIn}
              onGuestSignIn={onGuestSignIn}
              supabaseConfigured={supabaseConfigured}
            />
          </div>
        ) : pendingChoice ? (
          // Google girişinden dönüldü: seçim korundu, ama zamanlı turu kullanıcı hazırken başlatıyoruz.
          <div className="mt-7 rounded-2xl border-2 border-cyan-200 bg-cyan-50/60 p-5 sm:p-6">
            <p className="text-lg font-bold text-slate-900">
              Giriş tamam — <span className="text-cyan-700">{choiceLabel(pendingChoice)}</span> turun hazır
            </p>
            <p className="mt-1 text-sm text-slate-600">Başla dediğin anda {GAME_DURATION_SECONDS} saniyelik süre işlemeye başlar.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <PlayButton
                disabled={!readyModes.includes(pendingChoice.mode)}
                label="Başla"
                onClick={() => onPlay(pendingChoice)}
                tone={pendingChoice.difficulty === "hard" ? "red" : "green"}
              />
              <button
                className="text-xs font-semibold text-slate-500 underline-offset-2 transition hover:text-cyan-700 hover:underline"
                onClick={onCancelPendingChoice}
                type="button"
              >
                Başka bir harita seç
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-col items-start gap-2.5 short:mt-4 lg:mt-10">
              <Segmented label="Oyun türü" onChange={writeKind} options={KIND_OPTIONS} tone="cyan" value={kind} />
              <p className="text-sm text-slate-500">{KIND_OPTIONS.find((option) => option.id === kind)?.summary}</p>
            </div>

            <div className="mt-6 grid flex-1 items-stretch gap-4 sm:grid-cols-2 short:mt-4 short:gap-3 lg:mt-8 lg:gap-6">
              <ModeCard isReady={isTurkeyReady} mapMode="turkey" subtitle="İl adıyla" title="Türkiye">
                <PlayButton
                  badge={provinces.length}
                  badgeLabel={`${provinces.length} il`}
                  disabled={!isTurkeyReady}
                  label="Oyna"
                  onClick={() => onPlay({ kind, mode: "turkey", difficulty: "normal" })}
                />
              </ModeCard>

              {kind === "ranked" ? (
                <ModeCard isReady={isWorldReady} mapMode="world" subtitle="Ülke adıyla veya bayrağıyla" title="Dünya">
                  <PlayButton
                    badge={countryCount("normal")}
                    badgeLabel={`${countryCount("normal")} ülke`}
                    disabled={!isWorldReady}
                    label="Normal"
                    onClick={() => onPlay({ kind: "ranked", mode: "world", difficulty: "normal" })}
                  />
                  <PlayButton
                    badge={countryCount("hard")}
                    badgeLabel={`${countryCount("hard")} ülke`}
                    disabled={!isWorldReady}
                    label="Zor"
                    onClick={() => onPlay({ kind: "ranked", mode: "world", difficulty: "hard" })}
                    tone="red"
                  />
                  <PlayButton
                    badge={FLAG_BADGE}
                    badgeLabel={`${countryCount("hard")} ülkenin bayrağı`}
                    disabled={!isWorldReady}
                    label="Bayrak"
                    onClick={() => onPlay(FLAG_CHOICE)}
                    tone="red"
                  />
                </ModeCard>
              ) : (
                <ModeCard
                  aside={<Segmented label="Soru tipi" onChange={setPracticePrompt} options={PROMPT_OPTIONS} size="sm" tone="amber" value={practicePrompt} />}
                  isReady={isWorldReady}
                  mapMode="world"
                  subtitle="Tüm dünya ya da tek kıta"
                  title="Dünya"
                >
                  <PlayButton
                    badge={countryCount("normal")}
                    badgeLabel={`${countryCount("normal")} ülke`}
                    disabled={!isWorldReady}
                    label="Normal"
                    onClick={() => practiceWorld({ difficulty: "normal" })}
                  />
                  <PlayButton
                    badge={countryCount("hard")}
                    badgeLabel={`${countryCount("hard")} ülke`}
                    disabled={!isWorldReady}
                    label="Tümü"
                    onClick={() => practiceWorld({ difficulty: "hard" })}
                    tone="red"
                  />
                  <div className="flex w-full flex-wrap items-center gap-1.5 pt-1">
                    {CONTINENTS.map((continent) => (
                      <button
                        className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-bold text-slate-700 transition hover:border-amber-400 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50"
                        disabled={!isWorldReady}
                        key={continent.id}
                        onClick={() => practiceWorld({ difficulty: "hard", continent: continent.id })}
                        type="button"
                      >
                        {continent.label}
                        <span className="ml-1 font-semibold text-slate-400">{countriesIn(continent.id).length}</span>
                      </button>
                    ))}
                  </div>
                </ModeCard>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
