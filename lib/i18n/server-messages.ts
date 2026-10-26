import { currentLocale } from "./index";

/**
 * Sunucunun (supabase/schema.sql) ürettiği hata mesajları Türkçedir; oyuncu İngilizce arayüzdeyse burada karşılığı
 * gösterilir. Türkçe arayüzde mesaj olduğu gibi kalır. Tanınmayan bir mesaj İngilizcede genel bir hata metnine düşer.
 * Sunucuya yeni bir mesaj eklenince buraya da eklenmeli (tests/i18n.test.ts listeyi schema.sql ile karşılaştırır).
 */
export const SERVER_MESSAGES_EN: Readonly<Record<string, string>> = {
  "Başlatmak için en az 2 oyuncu gerekir.": "You need at least 2 players to start.",
  "Bu düello dolu.": "This duel is full.",
  "Bu düellonun oyuncusu değilsin.": "You're not a player in this duel.",
  "Bu odanın oyuncusu değilsin.": "You're not a player in this room.",
  "Bu rövanş başka bir oyuncuya ait.": "This rematch belongs to another player.",
  "Bu turun sonucu zaten kaydedildi.": "This round's result has already been saved.",
  "Bugünün meydan okumasını oynadın.": "You already played today's challenge.",
  "Düello bitmeden rövanş istenemez.": "You can't ask for a rematch before the duel ends.",
  "Düello bulunamadı.": "Duel not found.",
  "Düello için giriş gerekir.": "You need to sign in for duels.",
  "Düello kurmak için giriş gerekir.": "You need to sign in to create a duel.",
  "Düelloya katılmak için giriş gerekir.": "You need to sign in to join a duel.",
  "Geçersiz düello ayarı.": "Invalid duel settings.",
  "Geçersiz oda ayarı.": "Invalid room settings.",
  "Geçersiz sonuç.": "Invalid result.",
  "Geçersiz tur.": "Invalid round.",
  "Günlük meydan okuma için giriş gerekir.": "You need to sign in for the daily challenge.",
  "Hesabı silmek için giriş gerekir.": "You need to sign in to delete your account.",
  "Oda bulunamadı.": "Room not found.",
  "Oda için giriş gerekir.": "You need to sign in for rooms.",
  "Oda kurmak için giriş gerekir.": "You need to sign in to create a room.",
  "Oda zaten başladı.": "The room has already started.",
  "Oda şu an oynanmıyor.": "The room isn't being played right now.",
  "Odayı yalnızca oda sahibi başlatabilir.": "Only the room owner can start the room.",
  "Profil için giriş gerekir.": "You need to sign in to see your profile.",
  "Rozetler için giriş gerekir.": "You need to sign in to see badges.",
  "Sonuç kaydetmek için giriş gerekir.": "You need to sign in to save results.",
  "Tur başlatmak için giriş gerekir.": "You need to sign in to start a round.",
  "Tur bitmeden sonuç kaydedilemez.": "A result can't be saved before the round ends.",
  "Tur bu kadar kısa sürede bitirilemez.": "A round can't be finished that fast.",
  "Tur bulunamadı.": "Round not found.",
  "Turlar sırayla ve birer kez oynanır.": "Rounds are played in order, once each.",
  "Turun süresi çoktan doldu.": "This round's time is already up.",
  "Oda başladı; yeni oyuncu katılamaz.": "The room has started; new players can't join.",
  "Oda dolu.": "The room is full.",
};

/** Sayı ya da tür içeren sunucu mesajları ("Aynı anda en fazla 3 açık odan olabilir."). */
const PATTERNS_EN: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^Aynı anda en fazla (\d+) açık odan olabilir\.$/, (match) => `You can have at most ${match[1]} open rooms at a time.`],
  [/^Geçersiz meydan okuma: /, () => "Invalid challenge."],
  [/^Geçersiz tur: /, () => "Invalid round."],
];

const GENERIC_EN = "Something went wrong. Please try again.";

export function serverMessage(message: string): string {
  if (currentLocale() === "tr") return message;
  const exact = SERVER_MESSAGES_EN[message];
  if (exact) return exact;
  for (const [pattern, translate] of PATTERNS_EN) {
    const match = message.match(pattern);
    if (match) return translate(match);
  }
  return GENERIC_EN;
}
