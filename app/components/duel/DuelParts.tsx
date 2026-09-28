"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { DUEL_MODES, DUEL_RULES, type DuelRule, type DuelSettings } from "@/lib/duel";
import { flagUrl, type BoardVariant, type GameMode } from "@/lib/game";

/** Düelloda oyuncunun kendisi hep mavi, rakibi hep turuncu. */
export type DuelTone = "me" | "opponent";

export const TONE_TEXT: Record<DuelTone, string> = { me: "text-sky-600", opponent: "text-orange-500" };

const AVATAR_TONE: Record<DuelTone, string> = {
  me: "bg-sky-100 text-sky-700 ring-sky-400",
  opponent: "bg-orange-100 text-orange-700 ring-orange-400",
};

const AVATAR_SIZE = {
  sm: "h-9 w-9 text-sm ring-2",
  md: "h-14 w-14 text-2xl ring-4 lg:h-16 lg:w-16",
  lg: "h-20 w-20 text-3xl ring-4 lg:h-24 lg:w-24 lg:text-4xl",
};

export function DuelAvatar({ name, avatar, tone, size = "sm" }: { name: string; avatar: string | null; tone: DuelTone; size?: keyof typeof AVATAR_SIZE }) {
  const className = `flex shrink-0 items-center justify-center rounded-full font-bold ${AVATAR_SIZE[size]} ${AVATAR_TONE[tone]}`;
  if (avatar) {
    return <Image alt="" className={`${className} object-cover`} height={96} referrerPolicy="no-referrer" src={avatar} unoptimized width={96} />;
  }
  return <span className={className}>{name.slice(0, 1).toUpperCase()}</span>;
}

/** Başlık: ortada yazı, iki yanında solan çizgiler ve parlayan noktalar (sonuç ekranındaki "Yeni oyun" gibi). */
export function GlowHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-300 to-cyan-500" />
      <span aria-hidden="true" className="glow-dot h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_2px_rgb(6_182_212/0.6)]" />
      <span className="font-display text-lg font-bold tracking-[0.18em] text-slate-900 uppercase">{children}</span>
      <span aria-hidden="true" className="glow-dot h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_2px_rgb(6_182_212/0.6)]" />
      <span aria-hidden="true" className="h-px flex-1 bg-gradient-to-l from-transparent via-cyan-300 to-cyan-500" />
    </div>
  );
}

export const SHIMMER_BUTTON =
  "shimmer flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 px-6 py-3.5 font-display text-xl font-bold text-white shadow-lg shadow-cyan-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-cyan-500/40 active:translate-y-0 active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-cyan-200 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60";

function GroupIcon({ mode }: { mode: "turkey" | "world" }) {
  if (mode === "turkey") {
    return <Image alt="" className="h-4 w-auto rounded-[2px] shadow-sm" height={16} src={flagUrl("tr")} unoptimized width={21} />;
  }
  return (
    <svg aria-hidden="true" className="h-4 w-4 text-cyan-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  );
}

/** Harita ve mod seçimi (Türkiye: Şehir, Plaka · Dünya: Normal, Zor, Bayrak): düello ve oda kurarken. */
export function ModePicker({ mode, variant, onChange }: { mode: GameMode; variant: BoardVariant; onChange: (mode: GameMode, variant: BoardVariant) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-900">Harita ve mod</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {DUEL_MODES.map((group) => {
          const isGroupSelected = mode === group.mode;
          return (
            <div
              className={`rounded-2xl border-2 p-4 transition ${isGroupSelected ? "border-cyan-500 bg-cyan-50/60" : "border-slate-200"}`}
              key={group.mode}
            >
              <p className={`flex items-center gap-2 font-display text-xl font-bold ${isGroupSelected ? "text-slate-900" : "text-slate-500"}`}>
                <GroupIcon mode={group.mode} /> {group.title}
              </p>
              <div className="mt-3 flex flex-wrap gap-2" role="radiogroup">
                {group.options.map((option) => {
                  const isSelected = isGroupSelected && variant === option.variant;
                  return (
                    <button
                      aria-checked={isSelected}
                      className={`rounded-full px-4 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${
                        isSelected ? "bg-cyan-600 text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-cyan-300 hover:text-cyan-700"
                      }`}
                      key={option.variant}
                      onClick={() => onChange(group.mode, option.variant)}
                      role="radio"
                      type="button"
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Düello kuralı: Kapan kazanır ya da Herkes puan alır. */
export function RulePicker({ rule, onChange }: { rule: DuelRule; onChange: (rule: DuelRule) => void }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-900">Kural</p>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
        {(Object.keys(DUEL_RULES) as DuelRule[]).map((option) => {
          const isSelected = rule === option;
          return (
            <button
              aria-checked={isSelected}
              className={`rounded-2xl border-2 p-4 text-left transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none ${
                isSelected ? "border-cyan-500 bg-gradient-to-br from-cyan-50 to-white shadow-md shadow-cyan-500/10" : "border-slate-200 hover:border-cyan-300"
              }`}
              key={option}
              onClick={() => onChange(option)}
              role="radio"
              type="button"
            >
              <span className={`block font-display text-xl font-bold ${isSelected ? "text-slate-900" : "text-slate-600"}`}>
                {DUEL_RULES[option].icon} {DUEL_RULES[option].label}
              </span>
              <span className="mt-1 block text-sm text-slate-500">{DUEL_RULES[option].summary}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Düello kurarken ve başka modla rövanş isterken: harita, mod ve kural. */
export function DuelSettingsPicker({ value, onChange }: { value: DuelSettings; onChange: (value: DuelSettings) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <ModePicker mode={value.mode} onChange={(mode, variant) => onChange({ ...value, mode, variant })} variant={value.variant} />
      <RulePicker onChange={(rule) => onChange({ ...value, rule })} rule={value.rule} />
    </div>
  );
}

const noSubscription = () => () => {};

/** Paylaşma satırı: kod, bağlantıyı kopyalama ve (telefonda) paylaşma menüsü. */
export function ShareCode({ code, path, label, shareText }: { code: string; path: string; label: string; shareText: string }) {
  const [isCopied, setIsCopied] = useState(false);
  const url = typeof window === "undefined" ? path : `${window.location.origin}${path}`;
  // Paylaşma menüsü tarayıcıya bağlı; sunucuda çizilen ilk halde yok sayılır, uyuşmazlık olmaz.
  const canShare = useSyncExternalStore(
    noSubscription,
    () => typeof navigator.share === "function",
    () => false,
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Pano kullanılamıyorsa kod ekranda zaten okunuyor.
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
      {label}
      <span className="rounded-lg bg-slate-100 px-3 py-1 font-mono text-lg font-bold tracking-[0.3em] text-slate-900">{code}</span>
      <button className="font-semibold text-cyan-700 underline-offset-4 hover:underline" onClick={copy} type="button">
        {isCopied ? "✓ Kopyalandı" : "Bağlantıyı kopyala"}
      </button>
      {canShare && (
        <button
          className="font-semibold text-cyan-700 underline-offset-4 hover:underline"
          onClick={() => void navigator.share({ title: "Harita Avcısı", text: shareText, url }).catch(() => {})}
          type="button"
        >
          Paylaş
        </button>
      )}
    </div>
  );
}
