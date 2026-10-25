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

/** Dört oyun; giriş ekranının ilk adımında iki grupta durur: tek başına (Yarış, Antrenman) ve arkadaşlarla (Düello, Oda). */
export type IntroGame = "ranked" | "practice" | "duel" | "room";
export type SoloGame = Extract<IntroGame, "ranked" | "practice">;
export type FriendsGame = Extract<IntroGame, "duel" | "room">;
export type IntroGroup = "solo" | "friends";

export function groupOf(game: IntroGame): IntroGroup {
  return game === "ranked" || game === "practice" ? "solo" : "friends";
}

const MAPS: GameMode[] = ["turkey", "world"];
const WORLD_PROMPTS: WorldPrompt[] = ["name", "flag", "capital"];
const TURKEY_PROMPTS: TurkeyPrompt[] = ["name", "plate"];
// Eski sürümlerin kaydettiği "normal" ve "hard" geçersiz sayılır ve "all"a düşer; kıta seçimleri korunur.
const SCOPES: WorldScope[] = ["all", "africa", "america", "asia", "europe"];

/** Grubun ikinci adımı en son seçilen oyunla açılır; "Tek başına → Başla" yine iki dokunuştur. */
export const [useSoloGame, setSoloGame] = createPreference<SoloGame>(
  "harita-avcisi:intro-solo-game",
  (value): value is SoloGame => value === "ranked" || value === "practice",
  "ranked",
);

export const [useFriendsGame, setFriendsGame] = createPreference<FriendsGame>(
  "harita-avcisi:intro-friends-game",
  (value): value is FriendsGame => value === "duel" || value === "room",
  "duel",
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
  "all",
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
const DUEL_SETTINGS: string[] = ["turkey|normal", "turkey|plates", "world|normal", "world|hard", "world|flags", "world|capitals"].flatMap((mode) => [
  `${mode}|snatch`,
  `${mode}|shared`,
]);

export const [useDuelSettingsKey, setDuelSettingsKey] = createPreference<DuelSettingsKey>(
  "harita-avcisi:duel-settings",
  (value): value is DuelSettingsKey => DUEL_SETTINGS.includes(value),
  "turkey|normal|snatch",
);

/**
 * Bir kez gösterilen ekranların (tanıtım, dikeyde ilk oyunun ipuçları) görülüp görülmediği. Diğer seçimlerden farkı:
 * sunucuda ve depolama kapalıyken "görüldü" sayılır. Böylece sunucu bunları çizmez (geri dönen oyuncuda bir an belirip
 * kaybolmaz) ve depolaması kapalı tarayıcıda her açılışta tekrar gösterilmez.
 */
function createSeenFlag(key: string) {
  const listeners = new Set<() => void>();
  let isSeenInMemory = false;

  const read = (): boolean => {
    if (isSeenInMemory) return true;
    try {
      return localStorage.getItem(key) === "1";
    } catch {
      return true;
    }
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  const useSeen = () => useSyncExternalStore(subscribe, read, () => true);

  const setSeen = () => {
    isSeenInMemory = true;
    try {
      localStorage.setItem(key, "1");
    } catch {
      // Depolama kapalı; bu sayfa yaşamı boyunca yine de bir daha gösterilmez.
    }
    listeners.forEach((listener) => listener());
  };

  return [useSeen, setSeen, read] as const;
}

export const [useGuideSeen, setGuideSeen] = createSeenFlag("harita-avcisi:guide-seen");

/** Dikey telefonda ilk oyundan önce bir kez gösterilen ipuçları: yan çevir, iki parmakla yakınlaştır (PlayTips). */
export const [usePlayTipsSeen, setPlayTipsSeen, readPlayTipsSeen] = createSeenFlag("harita-avcisi:play-tips-seen");
