"use client";

import { useSyncExternalStore } from "react";
import { type GameMode, type TurkeyPrompt, type WorldPrompt } from "@/lib/game";
import { type WorldScope } from "@/lib/world-countries";

/**
 * Giriş ekranındaki seçimler tarayıcıda hatırlanır; antrenmandan ana menüye dönen oyuncu
 * yine Antrenman'ı ve bıraktığı kapsamı görür. Sunucuda her zaman varsayılan çizildiği için
 * hidrasyon uyuşmazlığı olmaz. Depolama kullanılamıyorsa seçim yalnızca sayfa açık kaldığı
 * sürece bellekte tutulur.
 */
function createPreference<T extends string>(key: string, isValid: (value: string) => value is T, fallback: T) {
  const listeners = new Set<() => void>();
  let inMemory: T = fallback;

  const read = (): T => {
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null && isValid(stored)) return stored;
    } catch {
      // Depolama kapalı; bellekteki değer kullanılır.
    }
    return inMemory;
  };

  const write = (value: T) => {
    inMemory = value;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Depolama kapalı; seçim bu sayfa yaşamı boyunca bellekte kalır.
    }
    listeners.forEach((listener) => listener());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return [() => useSyncExternalStore(subscribe, read, () => fallback), write] as const;
}

/** Giriş ekranının ilk adımındaki dört oyun. */
export type IntroGame = "ranked" | "practice" | "duel" | "room";

const GAMES: IntroGame[] = ["ranked", "practice", "duel", "room"];
const MAPS: GameMode[] = ["turkey", "world"];
const WORLD_PROMPTS: WorldPrompt[] = ["name", "flag"];
const TURKEY_PROMPTS: TurkeyPrompt[] = ["name", "plate"];
const SCOPES: WorldScope[] = ["normal", "hard", "africa", "america", "asia", "europe"];

/** En son başlatılan (ya da kurulan) oyun; ilk adımda o kart "Son oynadığın" diye işaretlenir. */
export const [useLastGame, setLastGame] = createPreference<IntroGame | "none">(
  "harita-avcisi:intro-last-game",
  (value): value is IntroGame => (GAMES as string[]).includes(value),
  "none",
);

/** İkinci adımdaki Türkiye / Dünya seçimi dört oyunda ortaktır. */
export const [useIntroMap, setIntroMap] = createPreference<GameMode>(
  "harita-avcisi:intro-map",
  (value): value is GameMode => (MAPS as string[]).includes(value),
  "turkey",
);

export const [useWorldScope, setWorldScope] = createPreference<WorldScope>(
  "harita-avcisi:intro-scope",
  (value): value is WorldScope => (SCOPES as string[]).includes(value),
  "normal",
);

export const [useQuestionPrompt, setQuestionPrompt] = createPreference<WorldPrompt>(
  "harita-avcisi:intro-prompt",
  (value): value is WorldPrompt => (WORLD_PROMPTS as string[]).includes(value),
  "name",
);

/** Türkiye haritasının soru tipi ayrı saklanır; dünyada seçilen bayrak Türkiye'ye taşınmasın. */
export const [useTurkeyPrompt, setTurkeyPrompt] = createPreference<TurkeyPrompt>(
  "harita-avcisi:intro-turkey-prompt",
  (value): value is TurkeyPrompt => (TURKEY_PROMPTS as string[]).includes(value),
  "name",
);

/** Son kurulan düellonun ayarları ("turkey|normal|snatch"); düello kurulumu bunlarla açılır. */
export type DuelSettingsKey = `${"turkey" | "world"}|${string}|${"snatch" | "shared"}`;
const DUEL_SETTINGS: string[] = ["turkey|normal", "turkey|plates", "world|normal", "world|hard", "world|flags"].flatMap((mode) => [
  `${mode}|snatch`,
  `${mode}|shared`,
]);

export const [useDuelSettingsKey, setDuelSettingsKey] = createPreference<DuelSettingsKey>(
  "harita-avcisi:duel-settings",
  (value): value is DuelSettingsKey => DUEL_SETTINGS.includes(value),
  "turkey|normal|snatch",
);
