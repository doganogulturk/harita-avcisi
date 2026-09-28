import { DUEL_QUESTION_MS, DUEL_QUESTIONS } from "@/lib/duel";
import { GAME_DURATION_SECONDS, QUESTIONS_PER_ROUND } from "@/lib/game";
import { type IntroGame } from "@/lib/intro-preferences";
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
  /** "Son oynadığın" kartının çerçevesi. */
  lastCard: string;
  badge: string;
  link: string;
  arrow: string;
  watermark: string;
  button: string;
  /** Kartın üzerinden süzülen ışığın rengi (globals.css, .card-sweep). */
  glow: string;
};

export type GameInfo = {
  id: IntroGame;
  title: string;
  description: string;
  facts: string[];
  action: string;
  theme: GameTheme;
};

const BUTTON_BASE =
  "flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-lg font-bold shadow-lg transition-all duration-200 hover:gap-3.5 active:scale-[0.98] focus-visible:ring-4 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 short:py-2.5 short:text-base lg:py-4";

export const formatMinutes = (minutes: number) => (minutes === 60 ? "1 saat" : `${minutes} dk`);

export const GAMES: GameInfo[] = [
  {
    id: "ranked",
    title: "Yarış",
    description: `${QUESTIONS_PER_ROUND} soru, ${GAME_DURATION_SECONDS} saniye. Eşit puanda hızlı olan önde; sonucun sıralamaya işlenir.`,
    facts: [`${QUESTIONS_PER_ROUND} soru`, `${GAME_DURATION_SECONDS} sn`, "Sıralamaya işlenir"],
    action: "Başla",
    theme: {
      surface: "bg-gradient-to-br from-cyan-50 via-white to-white",
      selected: "border-cyan-600 bg-cyan-600 text-white",
      tile: "bg-cyan-100 text-cyan-700",
      card: "hover:border-cyan-300 hover:shadow-cyan-900/10 focus-within:border-cyan-300",
      lastCard: "border-cyan-300",
      badge: "bg-cyan-600 text-white",
      link: "text-cyan-700 decoration-cyan-300 hover:text-cyan-800 hover:decoration-cyan-600",
      arrow: "group-hover:bg-cyan-600",
      watermark: "text-cyan-600",
      button: `${BUTTON_BASE} bg-cyan-600 text-white shadow-cyan-600/20 hover:bg-cyan-500 focus-visible:ring-cyan-200`,
      glow: "rgb(6 182 212 / 0.14)",
    },
  },
  {
    id: "practice",
    title: "Antrenman",
    description: "Giriş yok, süre yok. İstediğin kadar oyna, kıtaları tek tek çalış; hiçbir yere kaydedilmez.",
    facts: ["Sınırsız soru", "Süre yok", "Kaydedilmez"],
    action: "Başla",
    theme: {
      surface: "bg-gradient-to-br from-amber-50 via-white to-white",
      selected: "border-amber-400 bg-amber-400 text-amber-950",
      tile: "bg-amber-100 text-amber-700",
      card: "hover:border-amber-300 hover:shadow-amber-900/10 focus-within:border-amber-300",
      lastCard: "border-amber-300",
      badge: "bg-amber-400 text-amber-950",
      link: "text-amber-700 decoration-amber-300 hover:text-amber-800 hover:decoration-amber-600",
      arrow: "group-hover:bg-amber-400 group-hover:text-amber-950",
      watermark: "text-amber-500",
      button: `${BUTTON_BASE} bg-amber-400 text-amber-950 shadow-amber-400/30 hover:bg-amber-300 focus-visible:ring-amber-200`,
      glow: "rgb(245 158 11 / 0.16)",
    },
  },
  {
    id: "duel",
    title: "Düello",
    description: "Bir arkadaşınla aynı sorulara aynı anda cevap verin. Kodu gönder, kim daha hızlı görün.",
    facts: ["2 kişi", `${DUEL_QUESTIONS} soru · ${DUEL_QUESTION_MS / 1000} sn`, "Sıralamaya işlenmez"],
    action: "Düelloyu kur",
    theme: {
      surface: "bg-gradient-to-br from-orange-50 via-white to-white",
      selected: "border-orange-500 bg-orange-500 text-white",
      tile: "bg-orange-100 text-orange-600",
      card: "hover:border-orange-300 hover:shadow-orange-900/10 focus-within:border-orange-300",
      lastCard: "border-orange-300",
      badge: "bg-orange-500 text-white",
      link: "text-orange-600 decoration-orange-300 hover:text-orange-700 hover:decoration-orange-500",
      arrow: "group-hover:bg-orange-500",
      watermark: "text-orange-500",
      button: `${BUTTON_BASE} bg-orange-500 text-white shadow-orange-500/25 hover:bg-orange-400 focus-visible:ring-orange-200`,
      glow: "rgb(249 115 22 / 0.14)",
    },
  },
  {
    id: "room",
    title: "Oda",
    description: "Arkadaş grubunla aynı sorularla birkaç tur oynayın; oda sıralamasında kimin önde olduğunu görün.",
    facts: [
      `${ROOM_MIN_PLAYERS}–${ROOM_MAX_PLAYERS} kişi`,
      `${ROOM_ROUND_COUNTS[0]}–${ROOM_ROUND_COUNTS.at(-1)} tur`,
      `${formatMinutes(ROOM_DURATIONS[0])} – ${formatMinutes(ROOM_DURATIONS.at(-1) ?? 60)}`,
    ],
    action: "Odayı kur",
    theme: {
      surface: "bg-gradient-to-br from-violet-50 via-white to-white",
      selected: "border-violet-600 bg-violet-600 text-white",
      tile: "bg-violet-100 text-violet-700",
      card: "hover:border-violet-300 hover:shadow-violet-900/10 focus-within:border-violet-300",
      lastCard: "border-violet-300",
      badge: "bg-violet-600 text-white",
      link: "text-violet-700 decoration-violet-300 hover:text-violet-800 hover:decoration-violet-600",
      arrow: "group-hover:bg-violet-600",
      watermark: "text-violet-600",
      button: `${BUTTON_BASE} bg-violet-600 text-white shadow-violet-600/20 hover:bg-violet-500 focus-visible:ring-violet-200`,
      glow: "rgb(139 92 246 / 0.14)",
    },
  },
];

export const gameInfo = (id: IntroGame): GameInfo => GAMES.find((game) => game.id === id) ?? GAMES[0];

/** Kronometre, döngü oku, çapraz kılıçlar ve bir grup insan. */
export function GameIcon({ game, className = "h-7 w-7" }: { game: IntroGame; className?: string }) {
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
