"use client";

import { useSyncExternalStore } from "react";

/**
 * Oyunun kısa ses efektleri. Ses dosyası yok: her efekt Web Audio ile birkaç notadan o an üretilir; uygulama boyutu
 * büyümez, ağ isteği olmaz. Ses hesap menüsünden kapatılabilir; seçim tarayıcıda hatırlanır.
 *
 * Tarayıcılar (özellikle iOS) sesi ancak bir dokunuşun içinde açılan ya da sürdürülen bir AudioContext ile çalar.
 * Cevap sesi dokunuştan sonraki çizimde çalındığı için bağlam, ilk dokunuşta (primeSound) önceden açılır.
 */

export type SoundEffect = "correct" | "incorrect" | "streak" | "tick" | "finish" | "perfect" | "tap";

const STORAGE_KEY = "harita-avcisi:sound";

const listeners = new Set<() => void>();
let inMemoryEnabled = true;

function readEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return stored !== "off";
  } catch {
    // Depolama kapalı; bellekteki değer kullanılır.
  }
  return inMemoryEnabled;
}

export function setSoundEnabled(enabled: boolean) {
  inMemoryEnabled = enabled;
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // Depolama kapalı; seçim bu sayfa yaşamı boyunca bellekte kalır.
  }
  listeners.forEach((listener) => listener());
  if (enabled) playSound("tap");
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useSoundEnabled() {
  return useSyncExternalStore(subscribe, readEnabled, () => true);
}

let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Constructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return null;
    try {
      context = new Constructor();
    } catch {
      return null;
    }
  }
  if (context.state === "suspended") void context.resume().catch(() => {});
  return context;
}

let isPrimed = false;

/** İlk dokunuşta ses bağlamını açar (iOS ve Chrome'un otomatik oynatma kuralı). Birden çok çağrı zararsızdır. */
export function primeSound() {
  if (isPrimed || typeof document === "undefined") return;
  isPrimed = true;
  const unlock = () => {
    if (readEnabled()) audioContext();
  };
  document.addEventListener("pointerdown", unlock, { capture: true, passive: true });
  document.addEventListener("keydown", unlock, { capture: true });
}

type Note = {
  /** Frekans (Hz); `to` verilirse nota boyunca ona kayar. */
  freq: number;
  to?: number;
  /** Başlangıç, efektin başından saniye. */
  at: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
};

const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.5;

const EFFECTS: Record<SoundEffect, Note[]> = {
  correct: [
    { freq: E5, at: 0, duration: 0.09, type: "triangle", volume: 0.22 },
    { freq: C6, at: 0.07, duration: 0.16, type: "triangle", volume: 0.22 },
  ],
  incorrect: [
    { freq: 220, to: 150, at: 0, duration: 0.22, type: "sawtooth", volume: 0.07 },
    { freq: 165, to: 110, at: 0.02, duration: 0.24, type: "square", volume: 0.04 },
  ],
  streak: [
    { freq: C5, at: 0, duration: 0.08, type: "square", volume: 0.07 },
    { freq: E5, at: 0.07, duration: 0.08, type: "square", volume: 0.07 },
    { freq: G5, at: 0.14, duration: 0.08, type: "square", volume: 0.07 },
    { freq: C6, at: 0.21, duration: 0.2, type: "square", volume: 0.07 },
  ],
  tick: [{ freq: 1400, at: 0, duration: 0.035, type: "sine", volume: 0.1 }],
  tap: [{ freq: 880, at: 0, duration: 0.05, type: "triangle", volume: 0.12 }],
  finish: [
    { freq: G5, at: 0, duration: 0.12, type: "triangle", volume: 0.2 },
    { freq: C6, at: 0.12, duration: 0.3, type: "triangle", volume: 0.2 },
  ],
  perfect: [
    { freq: C5, at: 0, duration: 0.1, type: "triangle", volume: 0.2 },
    { freq: E5, at: 0.1, duration: 0.1, type: "triangle", volume: 0.2 },
    { freq: G5, at: 0.2, duration: 0.1, type: "triangle", volume: 0.2 },
    { freq: C6, at: 0.3, duration: 0.14, type: "triangle", volume: 0.2 },
    { freq: E6, at: 0.44, duration: 0.4, type: "triangle", volume: 0.18 },
  ],
};

/** Efekti çalar; ses kapalıysa ya da tarayıcı desteklemiyorsa sessizce hiçbir şey yapmaz. */
export function playSound(effect: SoundEffect) {
  if (!readEnabled()) return;
  const audio = audioContext();
  if (!audio) return;
  const start = audio.currentTime + 0.01;
  for (const note of EFFECTS[effect]) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const noteStart = start + note.at;
    const noteEnd = noteStart + note.duration;
    oscillator.type = note.type ?? "sine";
    oscillator.frequency.setValueAtTime(note.freq, noteStart);
    if (note.to) oscillator.frequency.exponentialRampToValueAtTime(note.to, noteEnd);
    // Tık sesi olmasın diye ses kısa bir yükselişle girer, üstel olarak söner.
    gain.gain.setValueAtTime(0.0001, noteStart);
    gain.gain.exponentialRampToValueAtTime(note.volume ?? 0.15, noteStart + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(noteStart);
    oscillator.stop(noteEnd + 0.02);
  }
}
