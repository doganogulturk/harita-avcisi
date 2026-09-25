import { provinces, type Province } from "@/lib/turkish-plates";
import { continentInfo, countries, isContinentScope, type Continent, type Country, type WorldDifficulty, type WorldScope } from "@/lib/world-countries";

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

/**
 * Soruda ne gösterilir: yerin adı, ülkenin bayrağı ya da ilin plakası.
 * Bayrak yalnızca dünya haritasında, plaka yalnızca Türkiye haritasında kullanılır.
 */
export type QuestionPrompt = "name" | "flag" | "plate";
export type WorldPrompt = Extract<QuestionPrompt, "name" | "flag">;
export type TurkeyPrompt = Extract<QuestionPrompt, "name" | "plate">;

/**
 * Oyuncunun giriş ekranında seçtiği tur. Giriş gerekiyorsa giriş bitene kadar saklanır.
 * `continent` yalnızca dünya antrenmanında kullanılır; o kıtanın tüm ülkeleri sorulur.
 * `prompt` verilmezse soru ülke/il adıyla sorulur.
 */
export type PlayChoice = { kind: PlayKind; mode: GameMode; difficulty: WorldDifficulty; continent?: Continent; prompt?: QuestionPrompt };

export function isFlagChoice(choice: PlayChoice): boolean {
  return choice.mode === "world" && choice.prompt === "flag";
}

export function isPlateChoice(choice: PlayChoice): boolean {
  return choice.mode === "turkey" && choice.prompt === "plate";
}

export function choiceLabel(choice: PlayChoice): string {
  const { kind, mode, difficulty, continent } = choice;
  if (kind === "ranked" && isFlagChoice(choice)) return "Bayrak";
  if (kind === "ranked" && isPlateChoice(choice)) return "Plaka";
  const map =
    mode === "turkey" ? "Türkiye" : continent ? continentInfo(continent).label : difficulty === "hard" ? "Dünya · Zor" : "Dünya · Normal";
  const label = isFlagChoice(choice) ? `${map} · Bayrak` : isPlateChoice(choice) ? `${map} · Plaka` : map;
  return kind === "practice" ? `Antrenman · ${label}` : label;
}

export function flagUrl(countryCode: string): string {
  return `/flags/${countryCode}.svg`;
}

/** Plakalar tek haneli illerde de iki haneyle yazılır: 6 değil 06. */
export function formatPlate(plate: number): string {
  return String(plate).padStart(2, "0");
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

/**
 * Her oynanış türünün kendi sıralaması var; Zor turlar Normal'lerle, bayrak ve plaka turları
 * isimli turlarla yarışmaz.
 */
export type BoardId = "turkey" | "turkey-plates" | "world" | "world-hard" | "world-flags";

/** Veritabanındaki `variant` sütunu. Bayrak turları 179 ülkenin tamamından, plaka turları 81 ilden sorulur. */
export type BoardVariant = WorldDifficulty | "flags" | "plates";

export const BOARDS: { id: BoardId; label: string; mode: GameMode; variant: BoardVariant }[] = [
  { id: "turkey", label: "Türkiye", mode: "turkey", variant: "normal" },
  { id: "turkey-plates", label: "Plaka", mode: "turkey", variant: "plates" },
  { id: "world", label: "Dünya", mode: "world", variant: "normal" },
  { id: "world-hard", label: "Dünya · Zor", mode: "world", variant: "hard" },
  { id: "world-flags", label: "Bayrak", mode: "world", variant: "flags" },
];

export const FLAG_CHOICE: PlayChoice = { kind: "ranked", mode: "world", difficulty: "hard", prompt: "flag" };
export const PLATE_CHOICE: PlayChoice = { kind: "ranked", mode: "turkey", difficulty: "normal", prompt: "plate" };

export function choiceForBoard(board: { mode: GameMode; variant: BoardVariant }): PlayChoice {
  if (board.variant === "flags") return FLAG_CHOICE;
  if (board.variant === "plates") return PLATE_CHOICE;
  return { kind: "ranked", mode: board.mode, difficulty: board.variant };
}

/**
 * Giriş ekranındaki kapsam ve soru tipi seçimlerini bir tura çevirir.
 * Yarışta bayrak turu tek bir sıralamaya bağlıdır: 179 ülkenin tamamı, kıtasız.
 * Kıta yalnızca antrenmanda seçilebilir; kendi sıralaması olmadığı için yarışta yok sayılır.
 */
export function worldChoice(kind: PlayKind, scope: WorldScope, prompt: WorldPrompt): PlayChoice {
  if (kind === "ranked") {
    if (prompt === "flag") return FLAG_CHOICE;
    return { kind, mode: "world", difficulty: scope === "normal" ? "normal" : "hard" };
  }
  if (isContinentScope(scope)) return { kind, mode: "world", difficulty: "hard", continent: scope, prompt };
  return { kind, mode: "world", difficulty: scope, prompt };
}

/** Türkiye turları yalnızca 81 ilden sorulur; zorluk seçimi yoktur, soru tipi sıralamayı belirler. */
export function turkeyChoice(kind: PlayKind, prompt: TurkeyPrompt): PlayChoice {
  return prompt === "plate" ? { kind, mode: "turkey", difficulty: "normal", prompt } : { kind, mode: "turkey", difficulty: "normal" };
}

export function boardVariantFor(choice: PlayChoice): BoardVariant {
  if (isFlagChoice(choice)) return "flags";
  if (isPlateChoice(choice)) return "plates";
  return choice.difficulty;
}

export function boardIdFor(choice: PlayChoice): BoardId {
  if (choice.mode === "turkey") return isPlateChoice(choice) ? "turkey-plates" : "turkey";
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

/** Yarış turunda verilen bir cevap; sunucu puanı ve en uzun seriyi bu listeden hesaplar. */
export type AnswerRecord = { location: string; selected: string };

/** location_stats view'inin bir satırı: bir yerin o sıralamadaki yanlış cevap istatistiği. */
export type LocationStat = {
  location_id: string;
  asked: number;
  wrong: number;
  wrong_rate: number;
  most_confused_with: string;
  confused_count: number;
};

export const MOST_MISSED_LIMIT = 5;

/**
 * Türkiye haritasında plaka "06" diye yazılır, soruda ise 6'dır. Sunucuya ve istatistiğe her yer
 * tek biçimde gider: Türkiye'de başında sıfır olmayan plaka, dünyada ISO kodu.
 */
export function normalizeLocationId(mode: GameMode, locationId: string): string {
  return mode === "turkey" ? String(Number(locationId)) : locationId;
}

const PROVINCE_NAMES = new Map(provinces.map((province) => [String(province.plate), province.city]));
const COUNTRY_NAMES = new Map(countries.map((country) => [country.code, country.name]));

export function locationName(mode: GameMode, locationId: string): string {
  return (mode === "turkey" ? PROVINCE_NAMES : COUNTRY_NAMES).get(locationId) ?? locationId.toUpperCase();
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
