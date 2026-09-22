import { type Province } from "@/lib/turkish-plates";
import { continentInfo, isContinentScope, type Continent, type Country, type WorldDifficulty, type WorldScope } from "@/lib/world-countries";

export type AnswerState = "correct" | "incorrect" | null;
export type GameMode = "turkey" | "world";
export type GamePhase = "ready" | "playing" | "finished";
export type Question = Province | Country;
export type Player = { id: string; name: string; avatarUrl: string | null };
export type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  score: number;
  duration_ms: number;
  best_streak: number;
};

/**
 * "ranked": 10 soruluk, süreli, sıralamaya kaydedilen tur; giriş gerektirir.
 * "practice": girişsiz, süresiz, oyuncu bitirene kadar süren ve kaydedilmeyen antrenman.
 */
export type PlayKind = "ranked" | "practice";

/** Soruda ülkenin adı mı yoksa bayrağı mı gösterilir. Bayrak yalnızca dünya haritasında kullanılır. */
export type QuestionPrompt = "name" | "flag";

/**
 * Oyuncunun giriş ekranında seçtiği tur. Giriş gerekiyorsa giriş bitene kadar saklanır.
 * `continent` yalnızca dünya antrenmanında kullanılır; o kıtanın tüm ülkeleri sorulur.
 * `prompt` verilmezse soru ülke/il adıyla sorulur.
 */
export type PlayChoice = { kind: PlayKind; mode: GameMode; difficulty: WorldDifficulty; continent?: Continent; prompt?: QuestionPrompt };

export function isFlagChoice(choice: PlayChoice): boolean {
  return choice.mode === "world" && choice.prompt === "flag";
}

export function choiceLabel(choice: PlayChoice): string {
  const { kind, mode, difficulty, continent } = choice;
  if (kind === "ranked" && isFlagChoice(choice)) return "Bayrak";
  const map =
    mode === "turkey" ? "Türkiye" : continent ? continentInfo(continent).label : difficulty === "hard" ? "Dünya · Zor" : "Dünya · Normal";
  const label = isFlagChoice(choice) ? `${map} · Bayrak` : map;
  return kind === "practice" ? `Antrenman · ${label}` : label;
}

export function flagUrl(countryCode: string): string {
  return `/flags/${countryCode}.svg`;
}

export const GAME_DURATION_MS = 120000;
export const GAME_DURATION_SECONDS = GAME_DURATION_MS / 1000;
export const QUESTION_TRANSITION_MS = 3000;
export const LEADERBOARD_LIMIT = 50;
export const QUESTIONS_PER_ROUND = 10;

export const MAP_URLS: Record<GameMode, string> = {
  turkey: "/maps/turkey.svg",
  world: "/maps/world.svg",
};

export const MAP_LABELS: Record<GameMode, string> = {
  turkey: "Türkiye il haritası",
  world: "Dünya ülkeleri haritası",
};

export const GAME_MODES: GameMode[] = ["turkey", "world"];

/** Her oynanış türünün kendi sıralaması var; Zor turlar Normal'lerle, bayrak turları isimli turlarla yarışmaz. */
export type BoardId = "turkey" | "world" | "world-hard" | "world-flags";

/** Veritabanındaki `variant` sütunu. Bayrak turları 179 ülkenin tamamından sorulur. */
export type BoardVariant = WorldDifficulty | "flags";

export const BOARDS: { id: BoardId; label: string; mode: GameMode; variant: BoardVariant }[] = [
  { id: "turkey", label: "Türkiye", mode: "turkey", variant: "normal" },
  { id: "world", label: "Dünya", mode: "world", variant: "normal" },
  { id: "world-hard", label: "Dünya · Zor", mode: "world", variant: "hard" },
  { id: "world-flags", label: "Bayrak", mode: "world", variant: "flags" },
];

export const FLAG_CHOICE: PlayChoice = { kind: "ranked", mode: "world", difficulty: "hard", prompt: "flag" };

export function choiceForBoard(board: { mode: GameMode; variant: BoardVariant }): PlayChoice {
  if (board.variant === "flags") return FLAG_CHOICE;
  return { kind: "ranked", mode: board.mode, difficulty: board.variant };
}

/**
 * Giriş ekranındaki kapsam ve soru tipi seçimlerini bir tura çevirir.
 * Yarışta bayrak turu tek bir sıralamaya bağlıdır: 179 ülkenin tamamı, kıtasız.
 * Kıta yalnızca antrenmanda seçilebilir; kendi sıralaması olmadığı için yarışta yok sayılır.
 */
export function worldChoice(kind: PlayKind, scope: WorldScope, prompt: QuestionPrompt): PlayChoice {
  if (kind === "ranked") {
    if (prompt === "flag") return FLAG_CHOICE;
    return { kind, mode: "world", difficulty: scope === "normal" ? "normal" : "hard" };
  }
  if (isContinentScope(scope)) return { kind, mode: "world", difficulty: "hard", continent: scope, prompt };
  return { kind, mode: "world", difficulty: scope, prompt };
}

export function boardVariantFor(choice: PlayChoice): BoardVariant {
  return isFlagChoice(choice) ? "flags" : choice.difficulty;
}

export function boardIdFor(choice: PlayChoice): BoardId {
  if (choice.mode === "turkey") return "turkey";
  if (isFlagChoice(choice)) return "world-flags";
  return choice.difficulty === "hard" ? "world-hard" : "world";
}

export const LOCATION_SELECTOR: Record<GameMode, string> = {
  turkey: "g[data-plakakodu]",
  world: "[data-country-code]",
};

export function questionName(question: Question): string {
  return "city" in question ? question.city : question.name;
}

export function correctLocationId(question: Question): string {
  return "city" in question ? String(question.plate) : question.code;
}

export function locationIdOf(element: SVGElement | null | undefined, mode: GameMode): string | undefined {
  return mode === "turkey" ? element?.dataset.plakakodu : element?.dataset.countryCode;
}

export function isSameLocation(mode: GameMode, first: string | null | undefined, second: string | null | undefined): boolean {
  if (first == null || second == null) return false;
  return mode === "turkey" ? Number(first) === Number(second) : first === second;
}

export function formatTime(seconds: number): string {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function playerFromUser(user: { id: string; email?: string; user_metadata: Record<string, unknown> }): Player {
  const { full_name: fullName, name, avatar_url: avatar, picture, display_name: guestName } = user.user_metadata;
  const displayName = [fullName, name, guestName, user.email].find((value): value is string => typeof value === "string" && value.trim().length > 0) ?? "Oyuncu";
  const avatarUrl = [avatar, picture].find((value): value is string => typeof value === "string" && value.length > 0) ?? null;
  return { id: user.id, name: displayName.trim(), avatarUrl };
}
