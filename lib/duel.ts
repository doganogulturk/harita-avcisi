import { messages } from "@/lib/i18n";
import { choiceForBoard, formatPlate, type BoardVariant, type GameMode, type PlayChoice, type Question } from "@/lib/game";
import { provinces } from "@/lib/turkish-plates";
import { capitalOf } from "@/lib/world-capitals";
import { countries, countryName } from "@/lib/world-countries";

/**
 * Düello: iki oyuncu aynı sorularla aynı anda yarışır. Hakem sunucudur (supabase/schema.sql, duel_*):
 * soruları seçer, süreyi tutar, kimin önce bildiğini belirler. Tarayıcı durumu düzenli aralıklarla
 * sorar ve gördüğünü çizer. Düellolar genel sıralamaya işlenmez.
 */

/** "snatch": ilk doğru bilen kapar. "shared": doğru bilen herkes puan alır, hızlı olana +1. */
export type DuelRule = "snatch" | "shared";

export const DUEL_QUESTIONS = 10;
export const DUEL_QUESTION_MS = 15000;
export const DUEL_REVEAL_MS = 3000;

export const DUEL_RULES: Record<DuelRule, { icon: string; readonly label: string; readonly summary: string }> = {
  snatch: { icon: "⚡", get label() { return messages().duelRules.snatch.label; }, get summary() { return messages().duelRules.snatch.summary; } },
  shared: { icon: "🎯", get label() { return messages().duelRules.shared.label; }, get summary() { return messages().duelRules.shared.summary; } },
};

/** Düelloda seçilebilen modlar; her biri genel sıralamadaki bir tura karşılık gelir. Adları arayüz dilindedir. */
export const DUEL_MODES: { mode: GameMode; readonly title: string; options: { variant: BoardVariant; readonly label: string }[] }[] = [
  {
    mode: "turkey",
    get title() { return messages().boards.turkey; },
    options: [
      { variant: "normal", get label() { return messages().duelModes.city; } },
      { variant: "plates", get label() { return messages().boards.plates; } },
    ],
  },
  {
    mode: "world",
    get title() { return messages().boards.world; },
    options: [
      { variant: "hard", get label() { return messages().duelModes.country; } },
      { variant: "flags", get label() { return messages().boards.flags; } },
      { variant: "capitals", get label() { return messages().boards.capitals; } },
    ],
  },
];

export type DuelSettings = { mode: GameMode; variant: BoardVariant; rule: DuelRule };

/**
 * Kaldırılan dünya "normal" modunda (58 tanınmış ülke) kurulmuş eski düello ve odaların etiketi. Sunucu bu modu
 * güncellenmemiş uygulamalar için hâlâ kabul eder; seçeneklerde yoktur.
 */
const legacyModeLabel = (mode: GameMode, variant: BoardVariant) => (mode === "world" && variant === "normal" ? messages().boards.legacyWorldShort : undefined);

export function duelModeLabel(mode: GameMode, variant: BoardVariant): string {
  const group = DUEL_MODES.find((candidate) => candidate.mode === mode);
  const option = group?.options.find((candidate) => candidate.variant === variant);
  return `${group?.title ?? mode} · ${option?.label ?? legacyModeLabel(mode, variant) ?? variant}`;
}

/**
 * Seçilen haritada geçerli modu döndürür; başka haritada kalmış ya da kaldırılmış bir mod (eski dünya "normal") o
 * haritanın ilk moduna düşer. Eski bir düellonun rövanşı da böylece güncel modla kurulur.
 */
export function variantFor(map: GameMode, variant: string): BoardVariant {
  const options = DUEL_MODES.find((group) => group.mode === map)?.options ?? [];
  return options.find((option) => option.variant === variant)?.variant ?? options[0]?.variant ?? "normal";
}

/** Soru gösterimi (isim, plaka, bayrak) tek oyunculu oyunla aynı kurallara bağlı olsun diye düellonun turu. */
export function duelChoice(mode: GameMode, variant: BoardVariant): PlayChoice {
  return choiceForBoard({ mode, variant });
}

const PROVINCES_BY_PLATE = new Map(provinces.map((province) => [String(province.plate), province]));
const COUNTRIES_BY_CODE = new Map(countries.map((country) => [country.code, country]));

/** Sunucunun verdiği yer kimliğinden (plaka ya da ISO kodu) soruyu bulur. */
export function questionForLocation(mode: GameMode, locationId: string): Question | undefined {
  return mode === "turkey" ? PROVINCES_BY_PLATE.get(locationId) : COUNTRIES_BY_CODE.get(locationId);
}

export function locationLabel(mode: GameMode, variant: BoardVariant, locationId: string): string {
  const question = questionForLocation(mode, locationId);
  if (!question) return locationId.toUpperCase();
  if ("city" in question) return variant === "plates" ? `${formatPlate(question.plate)} ${question.city}` : question.city;
  const capital = variant === "capitals" ? capitalOf(question.code) : undefined;
  return capital ? `${capital} · ${countryName(question)}` : countryName(question);
}

export type DuelPlayer = { id: string; name: string; avatar: string | null; ready: boolean; score: number; online: boolean };

/** Rakibin açık sorudaki cevabı, oyuncu cevap verene ya da soru bitene kadar `selected: null` gelir. */
export type DuelAnswer = {
  position: number;
  user_id: string;
  selected: string | null;
  correct: boolean | null;
  response_ms: number | null;
  points: number | null;
};

export type DuelState = {
  code: string;
  status: "lobby" | "playing" | "finished";
  game_mode: GameMode;
  variant: BoardVariant;
  rule: DuelRule;
  server_now: string;
  me: "host" | "guest" | null;
  host: DuelPlayer;
  guest: DuelPlayer | null;
  question_index: number;
  question_started_at: string | null;
  question_ended_at: string | null;
  questions: { position: number; location: string }[];
  answers: DuelAnswer[];
  winner_id: string | null;
  finish_reason: "completed" | "forfeit" | null;
  rematch: { code: string; by: string; declined: boolean; game_mode: GameMode; variant: BoardVariant; rule: DuelRule } | null;
  series: { host_wins: number; guest_wins: number };
};

/** Oyuncunun kendisi ve rakibi, sunucunun ev sahibi / misafir ayrımından bağımsız. */
export function duelSides(state: DuelState): { me: DuelPlayer | null; opponent: DuelPlayer | null; myWins: number; opponentWins: number } {
  const isGuest = state.me === "guest";
  return {
    me: isGuest ? state.guest : state.host,
    opponent: isGuest ? state.host : state.guest,
    myWins: isGuest ? state.series.guest_wins : state.series.host_wins,
    opponentWins: isGuest ? state.series.host_wins : state.series.guest_wins,
  };
}

export function answerOf(state: DuelState, position: number, userId: string | undefined): DuelAnswer | undefined {
  return state.answers.find((answer) => answer.position === position && answer.user_id === userId);
}

export function duelPath(code: string): string {
  return `/duello?kod=${encodeURIComponent(code)}`;
}
