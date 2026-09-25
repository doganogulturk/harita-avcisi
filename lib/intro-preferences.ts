"use client";

import { useSyncExternalStore } from "react";
import { type PlayKind, type TurkeyPrompt, type WorldPrompt } from "@/lib/game";
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

const KINDS: PlayKind[] = ["ranked", "practice"];
const WORLD_PROMPTS: WorldPrompt[] = ["name", "flag"];
const TURKEY_PROMPTS: TurkeyPrompt[] = ["name", "plate"];
const SCOPES: WorldScope[] = ["normal", "hard", "africa", "america", "asia", "europe"];

export const [usePlayKind, setPlayKind] = createPreference<PlayKind>(
  "harita-avcisi:intro-kind",
  (value): value is PlayKind => (KINDS as string[]).includes(value),
  "ranked",
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
