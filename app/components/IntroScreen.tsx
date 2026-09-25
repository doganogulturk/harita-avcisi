"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AuthPanel } from "./AuthPanel";
import { PlayButton } from "./PlayButton";
import { PlayerBadge } from "./PlayerBadge";
import { LeaderboardPanel } from "./LeaderboardPanel";
import { ScopePreviewMap } from "./ScopePreviewMap";
import {
  boardIdFor,
  choiceLabel,
  flagUrl,
  GAME_DURATION_SECONDS,
  MAP_URLS,
  QUESTIONS_PER_ROUND,
  turkeyChoice,
  worldChoice,
  type GameMode,
  type PlayChoice,
  type PlayKind,
  type Player,
  type TurkeyPrompt,
  type WorldPrompt,
} from "@/lib/game";
import {
  setPlayKind,
  setQuestionPrompt,
  setTurkeyPrompt,
  setWorldScope,
  usePlayKind,
  useQuestionPrompt,
  useTurkeyPrompt,
  useWorldScope,
} from "@/lib/intro-preferences";
import { provinces } from "@/lib/turkish-plates";
import { CONTINENTS, continentInfo, countryCount, isContinentScope, scopeCountryCount, type WorldScope } from "@/lib/world-countries";

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

/**
 * Giriş animasyonu sayfa yaşamı boyunca bir kez oynar. Sunucuda ve ilk istemci çiziminde
 * aynı değer okunduğu için hidrasyon uyuşmazlığı olmaz; oyundan ana menüye dönüldüğünde
 * bileşen yeniden kurulsa da animasyon tekrarlanmaz.
 */
let hasPlayedIntro = false;

/** Açılış katmanının çekilip bittiği an (globals.css'teki intro-curtain gecikmesi + süresi). */
const INTRO_CURTAIN_MS = 1820;
/** Seçim ekranı, katman çekilirken netleşmeye başlar. */
const INTRO_CONTENT_DELAY_MS = 1400;

/**
 * Yarış ve antrenman iki ayrı oyun havası: yarış kronometreyle ve turkuazla, antrenman
 * döngü okuyla ve kehribarla anlatılır. Aynı renkler oyun içindeki üst barda da kullanılır.
 */
const KIND_OPTIONS: { id: PlayKind; label: string; summary: string; selected: string; icon: React.ReactNode }[] = [
  {
    id: "ranked",
    label: "Yarış",
    summary: `${QUESTIONS_PER_ROUND} soru, ${GAME_DURATION_SECONDS} saniye. Eşit puanda hızlı olan önde.`,
    selected: "bg-cyan-600 text-white shadow-md shadow-cyan-600/25",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} viewBox="0 0 24 24">
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2M9 2h6" />
      </svg>
    ),
  },
  {
    id: "practice",
    label: "Antrenman",
    summary: "Giriş yok, süre yok. Sen bitirene kadar sürer, sıralamaya kaydedilmez.",
    selected: "bg-amber-400 text-amber-950 shadow-md shadow-amber-400/30",
    icon: (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} viewBox="0 0 24 24">
        <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3v4.5h-4.5" />
      </svg>
    ),
  },
];

/** Giriş ekranının başındaki büyük Yarış / Antrenman anahtarı. */
function ModeSwitch({ value, onChange }: { value: PlayKind; onChange: (value: PlayKind) => void }) {
  return (
    <div aria-label="Oyun türü" className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm" role="radiogroup">
      {KIND_OPTIONS.map((option) => (
        <button
          aria-checked={value === option.id}
          className={`flex items-center gap-2 rounded-full px-5 py-2 text-base font-bold transition-all duration-200 focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:px-4 short:py-1.5 short:text-sm lg:px-7 lg:py-2.5 lg:text-lg ${
            value === option.id ? option.selected : "text-slate-500 hover:text-slate-900"
          }`}
          key={option.id}
          onClick={() => onChange(option.id)}
          role="radio"
          type="button"
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  );
}

const PROMPT_OPTIONS: { id: WorldPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "flag", label: "Bayrak" },
];

const TURKEY_PROMPT_OPTIONS: { id: TurkeyPrompt; label: string }[] = [
  { id: "name", label: "İsim" },
  { id: "plate", label: "Plaka" },
];

const TURKEY_PROMPT_NOTES: Record<TurkeyPrompt, string> = {
  name: "Soru olarak ilin adı gelir, sen haritada yerini bulursun.",
  plate: "Soru olarak plaka kodu gelir, sen o ilin yerini bulursun. Yarışta ayrı bir sıralaması var.",
};

const SCOPE_LOCK_NOTE = `Yarışta bayrak turu ${countryCount("hard")} ülkenin tamamından sorulur.`;

/**
 * Kapsamın ne anlama geldiğini yazıyla söyler. Havuzlar haritada vurgulanmaz: "en bilinen 58 ülke"
 * gibi bir seçim haritada anlamlı bir şekil oluşturmuyor, kıtalar ise oluşturuyor.
 */
function scopeNote(scope: WorldScope): string {
  if (isContinentScope(scope)) return `${continentInfo(scope).label} kıtasındaki ${scopeCountryCount(scope)} ülke, haritada vurgulandı.`;
  if (scope === "normal") return `Adı daha çok bilinen ${countryCount("normal")} ülke.`;
  return `Haritadaki ${countryCount("hard")} ülkenin tamamı.`;
}

/** Turun kuralları; oyuncu Başla'ya basmadan önce ne olacağını bilsin. */
const ROUND_FACTS: Record<PlayKind, string[]> = {
  ranked: [`${QUESTIONS_PER_ROUND} soru`, `${GAME_DURATION_SECONDS} saniye`, "Sıralamaya işlenir"],
  practice: ["Sınırsız soru", "Süre yok", "Kaydedilmez"],
};

const LOGO_SIZES = {
  header: {
    row: "gap-2.5 lg:gap-3.5",
    badge: "h-10 w-10 rounded-2xl short:h-9 short:w-9 short:rounded-xl lg:h-12 lg:w-12",
    icon: "h-6 w-6 lg:h-7 lg:w-7",
    text: "text-3xl short:text-2xl lg:text-4xl",
  },
  curtain: {
    row: "gap-4 lg:gap-6",
    badge: "h-16 w-16 rounded-3xl short:h-12 short:w-12 short:rounded-2xl lg:h-24 lg:w-24",
    icon: "h-10 w-10 short:h-8 short:w-8 lg:h-14 lg:w-14",
    text: "text-5xl short:text-3xl lg:text-7xl",
  },
};

function Logo({ size = "header", isHeading = true }: { size?: keyof typeof LOGO_SIZES; isHeading?: boolean }) {
  const style = LOGO_SIZES[size];
  const Tag = isHeading ? "h1" : "p";
  return (
    <Tag className={`flex items-center ${style.row}`}>
      <span
        aria-hidden="true"
        className={`intro-lock flex shrink-0 items-center justify-center bg-cyan-50 text-cyan-700 ${style.badge}`}
      >
        {/* Nişangah: "avcı" ve haritada bir yeri hedefleme. */}
        <svg className={style.icon} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" fill="currentColor" r="1.5" stroke="none" />
        </svg>
      </span>
      <span className={`intro-reveal font-display leading-none font-bold tracking-[-0.03em] text-slate-900 ${style.text}`}>
        harita <span className="text-cyan-700">avcısı</span>
      </span>
    </Tag>
  );
}

/**
 * Açılış katmanı: oyunun adı ekranın ortasında belirir, sonra katman çekilerek arkadaki
 * seçim ekranını açar. Yalnızca animasyonlu ilk açılışta çizilir.
 */
function IntroCurtain() {
  return (
    <div aria-hidden="true" className="intro-curtain fixed inset-0 z-40 flex items-center justify-center bg-slate-50 px-6">
      <Logo isHeading={false} size="curtain" />
    </div>
  );
}

/** Yarış / Antrenman ve İsim / Bayrak gibi iki-üç seçenekli açık seçiciler. */
function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
}: {
  label: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
}) {
  const padding = size === "md" ? "px-5 py-1.5 text-sm lg:px-6 lg:py-2 lg:text-base" : "px-4 py-1.5 text-sm";
  return (
    <div aria-label={label} className="inline-flex shrink-0 rounded-full border border-slate-200 bg-white p-0.5" role="radiogroup">
      {options.map((option) => (
        <button
          aria-checked={value === option.id}
          className={`rounded-full font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${padding} ${
            value === option.id ? "bg-cyan-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
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

function ScopeChip({ label, count, isSelected, disabled, onClick }: { label: string; count: number; isSelected: boolean; disabled: boolean; onClick: () => void }) {
  return (
    <button
      aria-checked={isSelected}
      className={`flex items-baseline justify-between gap-2 rounded-xl border px-3 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none disabled:opacity-40 ${
        isSelected
          ? "border-cyan-600 bg-cyan-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:text-cyan-700"
      }`}
      disabled={disabled}
      onClick={onClick}
      role="radio"
      type="button"
    >
      {label}
      <span className={`text-xs font-semibold tabular-nums ${isSelected ? "text-cyan-100" : "text-slate-400"}`}>{count}</span>
    </button>
  );
}

/** Haritanın silik silüeti. SVG'lerde dolgu rengi olmadığı için resim olarak siyah çizilir; opaklıkla soldurulur. */
function MapSilhouette({ mode, className = "" }: { mode: GameMode; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-full w-full bg-contain bg-center bg-no-repeat ${className}`}
      style={{ backgroundImage: `url(${MAP_URLS[mode]})` }}
    />
  );
}

/** Adım 1: haritanın kendisi seçim yüzeyidir; başlık ve künye alta yaslanır. */
function MapChoiceCard({
  delayMs,
  isReady,
  meta,
  mode,
  onSelect,
  title,
}: {
  delayMs: number;
  isReady: boolean;
  meta: string;
  mode: GameMode;
  onSelect: () => void;
  title: string;
}) {
  return (
    <button
      className="group intro-focus relative flex min-h-0 flex-col overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-5 text-left transition-all duration-200 hover:border-cyan-400 hover:shadow-xl hover:shadow-cyan-950/10 focus-visible:border-cyan-400 focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:outline-none disabled:cursor-wait short:p-4 lg:p-7"
      disabled={!isReady}
      onClick={onSelect}
      style={{ "--intro-delay": `${delayMs}ms` } as React.CSSProperties}
      type="button"
    >
      <div className="pointer-events-none flex min-h-0 flex-1 items-center justify-center px-2 py-1">
        <MapSilhouette
          className="opacity-[0.13] transition-all duration-300 group-hover:scale-[1.02] group-hover:opacity-20"
          mode={mode}
        />
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display text-3xl leading-none font-bold text-slate-900 transition-colors group-hover:text-cyan-800 short:text-2xl lg:text-4xl">
            {title}
          </p>
          <p className="mt-1.5 text-sm text-slate-500 lg:text-base">{isReady ? meta : "Harita hazırlanıyor..."}</p>
        </div>
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-all duration-200 group-hover:bg-cyan-600 group-hover:text-white lg:h-12 lg:w-12"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </button>
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
  const kind = usePlayKind();
  const storedScope = useWorldScope();
  const prompt = useQuestionPrompt();
  const turkeyPrompt = useTurkeyPrompt();
  const [selectedMap, setSelectedMap] = useState<GameMode | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Karar ilk çizimde donar: haritalar yüklenince gelen yeniden çizim animasyonu yarıda kesmesin.
  const [shouldAnimate] = useState(() => !hasPlayedIntro);
  const [isCurtainUp, setIsCurtainUp] = useState(false);

  // Açılış katmanı çekildikten sonra DOM'dan kaldırılır. Hareket azaltma açıksa hiç beklenmez.
  useEffect(() => {
    hasPlayedIntro = true;
    if (!shouldAnimate) return;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setIsCurtainUp(true), isReducedMotion ? 0 : INTRO_CURTAIN_MS);
    return () => window.clearTimeout(timer);
  }, [shouldAnimate]);

  // Kıtaların kendi sıralaması yok; yarışa geçildiğinde kapsam 179 ülkelik havuza düşer.
  const scope: WorldScope = kind === "ranked" && isContinentScope(storedScope) ? "hard" : storedScope;
  // Yarışta bayrak turu tek bir sıralamaya bağlı olduğu için havuzu kendisi belirler.
  const isScopeLocked = kind === "ranked" && prompt === "flag";
  const effectiveScope: WorldScope = isScopeLocked ? "hard" : scope;

  const choiceFor = (mode: GameMode): PlayChoice =>
    mode === "turkey" ? turkeyChoice(kind, turkeyPrompt) : worldChoice(kind, scope, prompt);

  const goBack = () => setSelectedMap(null);

  const content = () => {
    if (pendingChoice && !player) {
      return (
        <div className="mx-auto w-full max-w-2xl">
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
      );
    }

    // Google girişinden dönüldü: seçim korundu, ama zamanlı turu oyuncu hazırken başlatıyoruz.
    if (pendingChoice) {
      return (
        <div className="mx-auto w-full max-w-2xl rounded-3xl border-2 border-cyan-200 bg-cyan-50/60 p-6 sm:p-8">
          <p className="text-xl font-bold text-slate-900">
            Giriş tamam — <span className="text-cyan-700">{choiceLabel(pendingChoice)}</span> turun hazır
          </p>
          <p className="mt-1.5 text-sm text-slate-600">Başla dediğin anda {GAME_DURATION_SECONDS} saniyelik süre işlemeye başlar.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <PlayButton disabled={!readyModes.includes(pendingChoice.mode)} label="Başla" onClick={() => onPlay(pendingChoice)} />
            <button
              className="text-sm font-semibold text-slate-500 underline-offset-2 transition hover:text-cyan-700 hover:underline"
              onClick={onCancelPendingChoice}
              type="button"
            >
              Başka bir harita seç
            </button>
          </div>
        </div>
      );
    }

    if (selectedMap === null) {
      return (
        <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2 lg:gap-5">
          <MapChoiceCard
            delayMs={INTRO_CONTENT_DELAY_MS + 120}
            isReady={readyModes.includes("turkey")}
            meta={`${provinces.length} il · adıyla ya da plakasıyla`}
            mode="turkey"
            onSelect={() => setSelectedMap("turkey")}
            title="Türkiye"
          />
          <MapChoiceCard
            delayMs={INTRO_CONTENT_DELAY_MS + 220}
            isReady={readyModes.includes("world")}
            meta={`${countryCount("hard")} ülke · adıyla ya da bayrağıyla`}
            mode="world"
            onSelect={() => setSelectedMap("world")}
            title="Dünya"
          />
        </div>
      );
    }

    return (
      <RoundSetup
        isReady={readyModes.includes(selectedMap)}
        kind={kind}
        mode={selectedMap}
        onBack={goBack}
        onStart={() => onPlay(choiceFor(selectedMap))}
        prompt={prompt}
        scope={effectiveScope}
        turkeyPrompt={turkeyPrompt}
        isScopeLocked={isScopeLocked}
      />
    );
  };

  return (
    <section
      className="flex h-full w-full flex-col gap-3 px-4 py-3 lg:gap-5 lg:px-8 lg:py-5"
      data-intro={shouldAnimate ? "" : undefined}
    >
      {/* Oyun türü üst şeridin ortasında durur: her iki adımı da kapsayan bir anahtar olduğu için
          ayarların içine girmez, ama kendi satırını da yemez. */}
      <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3">
        <Logo />
        {pendingChoice ? (
          <div />
        ) : (
          <div className="intro-focus" style={{ "--intro-delay": `${INTRO_CONTENT_DELAY_MS}ms` } as React.CSSProperties}>
            <ModeSwitch onChange={setPlayKind} value={kind} />
          </div>
        )}
        <div className="flex justify-end">
          <PlayerBadge onSignOut={onSignOut} player={player} />
        </div>
      </header>

      {!pendingChoice && selectedMap === null && (
        <p
          className="intro-focus flex shrink-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-sm text-slate-500 short:text-xs"
          style={{ "--intro-delay": `${INTRO_CONTENT_DELAY_MS}ms` } as React.CSSProperties}
        >
          {KIND_OPTIONS.find((option) => option.id === kind)?.summary}
          {/* Sıralama yalnızca yarış turlarında tutulduğu için bağlantı da yalnızca orada çıkar. */}
          {kind === "ranked" && (
            <button
              className="font-semibold text-cyan-700 underline decoration-cyan-300 underline-offset-4 transition hover:text-cyan-800 hover:decoration-cyan-600 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
              onClick={() => setIsLeaderboardOpen(true)}
              type="button"
            >
              Sıralamayı gör
            </button>
          )}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col justify-center">{content()}</div>

      {isLeaderboardOpen && (
        <LeaderboardPanel
          currentPlayerId={player?.id}
          initialBoardId={boardIdFor(choiceFor(selectedMap ?? "turkey"))}
          onClose={() => setIsLeaderboardOpen(false)}
          supabaseConfigured={supabaseConfigured}
        />
      )}

      {shouldAnimate && !isCurtainUp && <IntroCurtain />}
    </section>
  );
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-cyan-700"
      onClick={onClick}
      type="button"
    >
      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Harita seçimi
    </button>
  );
}

type RoundSetupProps = {
  mode: GameMode;
  kind: PlayKind;
  scope: WorldScope;
  prompt: WorldPrompt;
  turkeyPrompt: TurkeyPrompt;
  isScopeLocked: boolean;
  isReady: boolean;
  onBack: () => void;
  onStart: () => void;
};

/** Adım 2: seçilen haritanın önizlemesi solda, o haritanın ayarları ve Başla sağda. */
function RoundSetup({ mode, kind, scope, prompt, turkeyPrompt, isScopeLocked, isReady, onBack, onStart }: RoundSetupProps) {
  const isWorld = mode === "world";
  const poolScopes: { id: WorldScope; label: string }[] = [
    { id: "normal", label: "Normal" },
    { id: "hard", label: kind === "ranked" ? "Zor" : "Tümü" },
  ];

  return (
      <div className="flex min-h-0 flex-1 flex-col gap-3 md:flex-row md:gap-4 lg:gap-5">
        {/* Harita dar ekranlarda üstte kalır; ezilmemesi için kendi asgari yüksekliği var. */}
        <div className="relative flex min-h-[8rem] flex-1 items-center justify-center overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-3 md:min-h-0 lg:p-4">
          <ScopePreviewMap mode={mode} scope={scope} />
        </div>

        <aside className="flex w-full shrink-0 flex-col rounded-3xl border-2 border-slate-200 bg-white p-4 md:w-[19rem] lg:w-[23rem] lg:p-7">
          {/* Ayarlar taşarsa kendi içinde kayar; Başla alçak ekranlarda da hep görünür kalır. */}
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto lg:gap-6 short:gap-3">
            <div>
              <BackLink onClick={onBack} />
              <p className="mt-2 font-display text-3xl leading-none font-bold text-slate-900 short:mt-1.5 short:text-2xl lg:text-4xl">
                {isWorld ? "Dünya" : "Türkiye"}
              </p>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500 short:mt-1 short:text-xs">
                {ROUND_FACTS[kind].map((fact, index) => (
                  <span className="flex items-center gap-2" key={fact}>
                    {index > 0 && <span className="h-1 w-1 rounded-full bg-slate-300" />}
                    {fact}
                  </span>
                ))}
              </p>
            </div>

            {isWorld ? (
              <div className="flex flex-col gap-4 lg:gap-5">
                <Field label="Soru">
                  <Segmented label="Soru tipi" onChange={setQuestionPrompt} options={PROMPT_OPTIONS} size="sm" value={prompt} />
                  {prompt === "flag" && (
                    <Image
                      alt=""
                      className="ml-2 inline-block h-5 w-auto rounded-[3px] border border-slate-200 align-middle shadow-sm"
                      height={20}
                      src={flagUrl("tr")}
                      unoptimized
                      width={27}
                    />
                  )}
                </Field>

                <Field label="Kapsam" note={isScopeLocked ? SCOPE_LOCK_NOTE : scopeNote(scope)}>
                  <div className="flex flex-wrap gap-2" role="radiogroup">
                    {poolScopes.map((option) => (
                      <ScopeChip
                        count={scopeCountryCount(option.id)}
                        disabled={isScopeLocked}
                        isSelected={scope === option.id}
                        key={option.id}
                        label={option.label}
                        onClick={() => setWorldScope(option.id)}
                      />
                    ))}
                  </div>
                  {kind === "practice" && (
                    <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5" role="radiogroup">
                      {CONTINENTS.map((continent) => (
                        <ScopeChip
                          count={scopeCountryCount(continent.id)}
                          disabled={false}
                          isSelected={scope === continent.id}
                          key={continent.id}
                          label={continent.label}
                          onClick={() => setWorldScope(continent.id)}
                        />
                      ))}
                    </div>
                  )}
                </Field>
              </div>
            ) : (
              <Field label="Soru" note={`${provinces.length} ilin tamamı sorulur. ${TURKEY_PROMPT_NOTES[turkeyPrompt]}`}>
                <Segmented label="Soru tipi" onChange={setTurkeyPrompt} options={TURKEY_PROMPT_OPTIONS} size="sm" value={turkeyPrompt} />
              </Field>
            )}
          </div>

          <button
            className="mt-3 flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-6 py-3.5 text-lg font-bold text-white short:mt-2 short:py-2.5 short:text-base lg:mt-4 lg:py-4 shadow-lg shadow-cyan-600/20 transition-all duration-200 hover:gap-3.5 hover:bg-cyan-500 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50"
            disabled={!isReady}
            onClick={onStart}
            type="button"
          >
            {isReady ? "Başla" : "Harita hazırlanıyor..."}
            {isReady && (
              <svg aria-hidden="true" className="h-5 w-5 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </aside>
      </div>
  );
}

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-900 short:mb-1.5">{label}</p>
      {children}
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </div>
  );
}
