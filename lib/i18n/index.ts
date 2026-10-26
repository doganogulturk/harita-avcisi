import { useSyncExternalStore } from "react";
import { en } from "./en";
import { tr, type Messages } from "./tr";

/**
 * Arayüz dili: Türkçe ya da İngilizce. İlk açılışta cihazın / tarayıcının dili (Türkçeyse Türkçe, değilse İngilizce),
 * hesap menüsünden değiştirilirse o seçim hatırlanır. Metinler iki sözlüktedir (tr.ts, en.ts); İngilizce sözlük
 * Türkçeyle aynı yapıda olmak zorunda olduğu için eksik çeviri derlemede yakalanır.
 *
 * Dil değişince bütün sayfa o dilde yeniden kurulur (LocaleRoot); bu yüzden bileşenler ve saf fonksiyonlar (choiceLabel
 * gibi) metni doğrudan `messages()`tan okur, abonelik gerekmez. Sunucuda ve ilk istemci çiziminde Türkçe çizilir,
 * hidrasyon uyuşmazlığı olmaz.
 */
export type Locale = "tr" | "en";
export type { Messages };

const STORAGE_KEY = "harita-avcisi:locale";
const DICTIONARIES: Record<Locale, Messages> = { tr, en };

/** Şu an çizilen dil; LocaleRoot her çizimde günceller. Testlerde ve sunucuda Türkçe. */
let current: Locale = "tr";
let chosen: Locale | null = null;
const listeners = new Set<() => void>();

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "tr" || stored === "en") return stored;
  } catch {
    // Depolama kapalı; cihaz diline bakılır.
  }
  const language = (navigator.languages?.[0] ?? navigator.language ?? "tr").toLowerCase();
  return language.startsWith("tr") ? "tr" : "en";
}

function readLocale(): Locale {
  chosen ??= detectLocale();
  return chosen;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLocale(): Locale {
  return useSyncExternalStore(subscribe, readLocale, () => "tr");
}

export function setLocale(locale: Locale) {
  chosen = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Depolama kapalı; seçim bu sayfa yaşamı boyunca geçerli.
  }
  listeners.forEach((listener) => listener());
}

/** LocaleRoot çizerken çağırır; altındaki her şey bu dilde çizilir. */
export function applyLocale(locale: Locale) {
  current = locale;
}

export function currentLocale(): Locale {
  return current;
}

/** Şu anki dilin metinleri. */
export function messages(): Messages {
  return DICTIONARIES[current];
}

/** Tarih ve sayı biçimleri için dil etiketi. */
export function localeTag(): string {
  return current === "en" ? "en-GB" : "tr-TR";
}
