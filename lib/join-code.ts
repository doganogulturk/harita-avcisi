import { duelPath } from "@/lib/duel";
import { roomPath } from "@/lib/room";
import { getSupabaseClient } from "@/lib/supabase";

/**
 * Ana ekrandaki tek kod alanı: düello ve oda kodları aynı biçimdedir (6 karakter, aynı alfabe), hangisi olduğunu sunucu
 * söyler (code_kind). Kod yoksa null. Sunucuya sorulamazsa (bağlantı yok, fonksiyon henüz eklenmemiş) düello sayfası
 * açılır; kod yanlışsa orada söylenir.
 */
export async function joinPathFor(code: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return duelPath(code);
  try {
    const { data, error } = await supabase.rpc("code_kind", { p_code: code });
    if (error) return duelPath(code);
    if (data === "room") return roomPath(code);
    if (data === "duel") return duelPath(code);
    return null;
  } catch {
    return duelPath(code);
  }
}
