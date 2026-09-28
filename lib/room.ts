import { type BoardVariant, type GameMode } from "@/lib/game";

/**
 * Oda: bir grup aynı sorularla kendi içinde yarışır. Hakem sunucudur (supabase/schema.sql, *_room*):
 * her turun sorularını seçer, turların sırayla ve birer kez oynanmasını sağlar. Her tur normal bir yarış
 * turudur ve genel sıralamaya da işlenir.
 */

export const ROOM_ROUND_COUNTS = [1, 3, 5] as const;
export const ROOM_DURATIONS = [15, 30, 60] as const;
export const ROOM_PLAYER_PRESETS = [5, 10, 20, 50] as const;
export const ROOM_MIN_PLAYERS = 2;
export const ROOM_MAX_PLAYERS = 50;
export const ROOM_NAME_MAX = 30;

export type RoomSettings = {
  name: string;
  mode: GameMode;
  variant: BoardVariant;
  roundCount: (typeof ROOM_ROUND_COUNTS)[number];
  durationMinutes: (typeof ROOM_DURATIONS)[number];
  maxPlayers: number;
};

/** Oyuncunun odadaki bir turu. "abandoned": başlatılıp süresinde bitirilmemiş tur, 0 sayılır. */
export type RoomRoundResult = { round: number; status: "done" | "playing" | "abandoned"; score: number; duration_ms: number };

export type RoomPlayer = {
  id: string;
  name: string;
  avatar: string | null;
  joined_at: string;
  rounds: RoomRoundResult[];
  total_score: number;
  total_duration_ms: number;
};

export type RoomState = {
  code: string;
  name: string;
  game_mode: GameMode;
  variant: BoardVariant;
  round_count: number;
  duration_minutes: number;
  max_players: number;
  status: "lobby" | "playing" | "finished";
  started_at: string | null;
  ends_at: string | null;
  server_now: string;
  host_id: string;
  is_member: boolean;
  /** Katılamama nedeni (oda başladı / dolu); bağlantıyı açan yine de sıralamayı görür. */
  join_error: string | null;
  /** Toplam puana, eşitlikte toplam süreye göre sıralı. */
  players: RoomPlayer[];
};

export function roomPath(code: string): string {
  return `/oda/${code}`;
}

/** Oyuncunun sıradaki turu; hepsini oynadıysa null. */
export function nextRoundOf(state: RoomState, playerId: string | undefined): number | null {
  const player = state.players.find((candidate) => candidate.id === playerId);
  const played = player?.rounds.length ?? 0;
  return played < state.round_count ? played + 1 : null;
}
