import { getSupabaseClient } from "@/lib/supabase";
import { type Player } from "@/lib/game";

const NOT_CONFIGURED = "Supabase bağlantısı yapılandırılmalıdır.";

/** Google girişine yönlendirir; giriş bitince `redirectTo` adresine dönülür. Başlatılamazsa hata metni döner. */
export async function startGoogleSignIn(redirectTo: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return NOT_CONFIGURED;
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  return error ? "Google ile giriş başlatılamadı. Lütfen tekrar deneyin." : null;
}

/** Misafir oturumu açar; ad sıralamada ve düelloda görünür. */
export async function signInAsGuest(rawName: string): Promise<{ player: Player } | { error: string }> {
  const name = rawName.trim();
  if (!name) return { error: "Sıralamada görünmek için bir ad yazın." };
  const supabase = getSupabaseClient();
  if (!supabase) return { error: NOT_CONFIGURED };
  const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { display_name: name } } });
  if (error || !data.user) return { error: `Misafir oturumu başlatılamadı: ${error?.message ?? "Supabase kullanıcı oluşturmadı."}` };
  return { player: { id: data.user.id, name, avatarUrl: null } };
}
