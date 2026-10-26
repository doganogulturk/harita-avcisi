import { DUEL_QUESTION_MS, DUEL_QUESTIONS } from "@/lib/duel";
import { GAME_DURATION_SECONDS, QUESTIONS_PER_ROUND } from "@/lib/game";
import { type IntroGame, type IntroGroup } from "@/lib/intro-preferences";
import { messages } from "@/lib/i18n";
import { ROOM_DURATIONS, ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS, ROOM_ROUND_COUNTS } from "@/lib/room";

/**
 * Giriş ekranındaki dört oyunun kimliği: her birinin kendi rengi ve simgesi var, kart da ikinci
 * adım da aynı rengi taşır. Tailwind sınıfları tam yazılır; parça parça birleştirilen sınıflar
 * derlemede bulunamaz.
 */
export type GameTheme = {
  /** Simgenin durduğu karo. */
  tile: string;
  /** Kartın zemini: köşeden soluk bir renk geçişi. */
  surface: string;
  /** İkinci adımdaki seçicilerde seçili seçenek. */
  selected: string;
  /** Kartın çerçevesi ve gölgesi (fareyle üzerine gelince). */
  card: string;
  badge: string;
  /** Kartın sol altındaki ikincil sekme (Sıralamayı gör, Kodla katıl): asıl sekmenin soluk tonu. */
  soft: string;
  /**
   * Köşe sekmelerinin ve karonun içbükey kıvrımlarının (SVG) dolgu rengi; sırasıyla badge, soft ve tile zeminiyle aynı.
   * Tailwind sınıfları tam yazılır diye ayrı alanlar.
   */
  badgeFill: string;
  softFill: string;
  tileFill: string;
  /** Kod alanının çerçeve ve odak rengi. */
  outline: string;
  watermark: string;
  /** Kartın üzerinden süzülen ışığın rengi (globals.css, .card-sweep). */
  glow: string;
};

export type GameInfo = {
  id: IntroGame;
  readonly title: string;
  readonly description: string;
  readonly facts: string[];
  readonly action: string;
  theme: GameTheme;
};

export const formatMinutes = (minutes: number) => messages().common.minutes(minutes);

export const GAMES: GameInfo[] = [
  {
    id: "ranked",
    get title() { return messages().games.ranked.title; },
    get description() { return messages().games.ranked.description(QUESTIONS_PER_ROUND, GAME_DURATION_SECONDS); },
    get facts() { return messages().games.ranked.facts(QUESTIONS_PER_ROUND, GAME_DURATION_SECONDS); },
    get action() { return messages().games.ranked.action; },
    theme: {
      surface: "bg-gradient-to-br from-cyan-50 via-white to-white",
      selected: "border-cyan-600 bg-cyan-600 text-white",
      tile: "bg-cyan-100 text-cyan-700",
      card: "hover:border-cyan-300 hover:shadow-cyan-900/10 focus-within:border-cyan-300",
      badge: "bg-cyan-600 text-white",
      soft: "bg-cyan-100 text-cyan-800",
      badgeFill: "fill-cyan-600",
      softFill: "fill-cyan-100",
      tileFill: "fill-cyan-100",
      outline: "border-cyan-300 text-cyan-700 hover:border-cyan-500 hover:bg-cyan-50 focus-visible:ring-cyan-200 focus:border-cyan-500 focus:ring-cyan-100",
      watermark: "text-cyan-600",
      glow: "rgb(6 182 212 / 0.14)",
    },
  },
  {
    id: "practice",
    get title() { return messages().games.practice.title; },
    get description() { return messages().games.practice.description; },
    get facts() { return messages().games.practice.facts; },
    get action() { return messages().games.practice.action; },
    theme: {
      surface: "bg-gradient-to-br from-amber-50 via-white to-white",
      selected: "border-amber-400 bg-amber-400 text-amber-950",
      tile: "bg-amber-100 text-amber-700",
      card: "hover:border-amber-300 hover:shadow-amber-900/10 focus-within:border-amber-300",
      badge: "bg-amber-400 text-amber-950",
      soft: "bg-amber-100 text-amber-900",
      badgeFill: "fill-amber-400",
      softFill: "fill-amber-100",
      tileFill: "fill-amber-100",
      outline: "border-amber-300 text-amber-800 hover:border-amber-500 hover:bg-amber-50 focus-visible:ring-amber-200 focus:border-amber-500 focus:ring-amber-100",
      watermark: "text-amber-500",
      glow: "rgb(245 158 11 / 0.16)",
    },
  },
  {
    id: "duel",
    get title() { return messages().games.duel.title; },
    get description() { return messages().games.duel.description; },
    get facts() { return messages().games.duel.facts(DUEL_QUESTIONS, DUEL_QUESTION_MS / 1000); },
    get action() { return messages().games.duel.action; },
    theme: {
      surface: "bg-gradient-to-br from-orange-50 via-white to-white",
      selected: "border-orange-500 bg-orange-500 text-white",
      tile: "bg-orange-100 text-orange-600",
      card: "hover:border-orange-300 hover:shadow-orange-900/10 focus-within:border-orange-300",
      badge: "bg-orange-500 text-white",
      soft: "bg-orange-100 text-orange-700",
      badgeFill: "fill-orange-500",
      softFill: "fill-orange-100",
      tileFill: "fill-orange-100",
      outline: "border-orange-300 text-orange-600 hover:border-orange-500 hover:bg-orange-50 focus-visible:ring-orange-200 focus:border-orange-500 focus:ring-orange-100",
      watermark: "text-orange-500",
      glow: "rgb(249 115 22 / 0.14)",
    },
  },
  {
    id: "room",
    get title() { return messages().games.room.title; },
    get description() { return messages().games.room.description; },
    get facts() {
      const { common } = messages();
      return [
        common.players(ROOM_MIN_PLAYERS, ROOM_MAX_PLAYERS),
        common.rounds(ROOM_ROUND_COUNTS[0], ROOM_ROUND_COUNTS.at(-1) ?? 5),
        `${formatMinutes(ROOM_DURATIONS[0])} – ${formatMinutes(ROOM_DURATIONS.at(-1) ?? 60)}`,
      ];
    },
    get action() { return messages().games.room.action; },
    theme: {
      surface: "bg-gradient-to-br from-violet-50 via-white to-white",
      selected: "border-violet-600 bg-violet-600 text-white",
      tile: "bg-violet-100 text-violet-700",
      card: "hover:border-violet-300 hover:shadow-violet-900/10 focus-within:border-violet-300",
      badge: "bg-violet-600 text-white",
      soft: "bg-violet-100 text-violet-700",
      badgeFill: "fill-violet-600",
      softFill: "fill-violet-100",
      tileFill: "fill-violet-100",
      outline: "border-violet-300 text-violet-700 hover:border-violet-500 hover:bg-violet-50 focus-visible:ring-violet-200 focus:border-violet-500 focus:ring-violet-100",
      watermark: "text-violet-600",
      glow: "rgb(139 92 246 / 0.14)",
    },
  },
];

export const gameInfo = (id: IntroGame): GameInfo => GAMES.find((game) => game.id === id) ?? GAMES[0];

export type GroupInfo = {
  id: IntroGroup;
  readonly title: string;
  readonly description: string;
  /** İkinci adımın en üstündeki seçicide, bu sırayla. */
  games: [IntroGame, IntroGame];
  /** Kart, grubun ilk oyununun rengini taşır (Yarış camgöbeği, Düello turuncu). */
  theme: GameTheme;
};

/** Giriş ekranının ilk adımındaki iki kart; her kartın altında grubun iki oyununun tuşu durur. */
export const GROUPS: GroupInfo[] = [
  {
    id: "solo",
    get title() { return messages().groups.solo.title; },
    get description() { return messages().groups.solo.description(QUESTIONS_PER_ROUND, GAME_DURATION_SECONDS); },
    games: ["ranked", "practice"],
    theme: gameInfo("ranked").theme,
  },
  {
    id: "friends",
    get title() { return messages().groups.friends.title; },
    get description() { return messages().groups.friends.description; },
    games: ["duel", "room"],
    theme: gameInfo("duel").theme,
  },
];

export const groupInfo = (id: IntroGroup): GroupInfo => GROUPS.find((group) => group.id === id) ?? GROUPS[0];

/** Kronometre, döngü oku, çapraz kılıçlar ve bir grup insan; gruplar için tek kişi ve iki kişi. */
export function GameIcon({ game, className = "h-7 w-7" }: { game: IntroGame | IntroGroup; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      {game === "ranked" && (
        <>
          <circle cx="12" cy="13" r="8" />
          <path d="M12 9v4l2.5 2M9 2h6" />
        </>
      )}
      {game === "practice" && <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3v4.5h-4.5" />}
      {game === "duel" && (
        <>
          <path d="M14.5 17.5 3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" />
          <path d="M14.5 6.5 18 3h3v3l-3.5 3.5M5 14l4 4M7 17l-3 3M3 19l2 2" />
        </>
      )}
      {game === "solo" && (
        <>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
        </>
      )}
      {game === "friends" && (
        <>
          <circle cx="8" cy="9" r="3.2" />
          <circle cx="16.5" cy="7.5" r="3.2" />
          <path d="M2 20.5a6 6 0 0 1 12 0M13.5 13.6a6 6 0 0 1 8.5 5.4" />
        </>
      )}
      {game === "room" && (
        <>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14a6.5 6.5 0 0 1 3.5 6" />
        </>
      )}
    </svg>
  );
}
