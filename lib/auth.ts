import { messages } from "@/lib/i18n";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { getSupabaseClient } from "@/lib/supabase";
import { type Player } from "@/lib/game";


/**
 * Mobil uygulamada Google girişinden dönülen adres. Şema capacitor.config.ts'teki appId'dir; iOS'ta Info.plist'te,
 * Android'de AndroidManifest.xml'de kayıtlı. Supabase'in Authentication > URL Configuration > Redirect URLs
 * listesinde de bulunmalı, yoksa Supabase siteye döner.
 */
export const NATIVE_AUTH_REDIRECT = "com.haritaavcisi.app://auth/callback";

/** Google girişine yönlendirir; giriş bitince `redirectTo` adresine dönülür. Başlatılamazsa hata metni döner. */
export async function startGoogleSignIn(redirectTo: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return messages().errors.notConfigured;
  if (Capacitor.isNativePlatform()) return startNativeGoogleSignIn(supabase);
  const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  return error ? messages().errors.googleFailed : null;
}

/**
 * Google, uygulamanın kendi WebView'inde girişe izin vermez; giriş sistem tarayıcısında (iOS'ta Safari, Android'de
 * Chrome penceresi) açılır ve NATIVE_AUTH_REDIRECT ile uygulamaya dönülür. Dönüşteki kod oturuma çevrilir ve sayfa
 * yeniden yüklenir: sitedeki akışta olduğu gibi usePlayer açık oturumu bulur, bekleyen tur seçimi kaldığı yerden sürer.
 * Kullanıcı pencereyi kapatırsa ya da giriş başarısız olursa hata metni döner.
 */
async function startNativeGoogleSignIn(supabase: NonNullable<ReturnType<typeof getSupabaseClient>>): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: NATIVE_AUTH_REDIRECT, skipBrowserRedirect: true },
  });
  if (error || !data.url) return messages().errors.googleFailed;
  const authUrl = data.url;

  return new Promise((resolve) => {
    const listeners: Promise<PluginListenerHandle>[] = [];
    let isReturning = false;
    let isDone = false;
    const finish = (message: string) => {
      if (isDone) return;
      isDone = true;
      for (const listener of listeners) void listener.then((handle) => handle.remove());
      resolve(message);
    };

    listeners.push(
      App.addListener("appUrlOpen", async ({ url }) => {
        if (!url.startsWith(NATIVE_AUTH_REDIRECT)) return;
        isReturning = true;
        void Browser.close().catch(() => {});
        const params = new URL(url).searchParams;
        const code = params.get("code");
        if (!code) return finish(params.get("error_description") ?? messages().errors.googleReturnFailed);
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) return finish(messages().errors.googleReturnFailed);
        window.location.reload();
      }),
    );
    listeners.push(
      Browser.addListener("browserFinished", () => {
        // Android'de uygulamaya dönüş de pencereyi kapatır ve dönüş adresi bu olaydan biraz sonra gelebilir;
        // hemen "vazgeçti" sayılmaz.
        setTimeout(() => {
          if (!isReturning) finish(messages().errors.googleNotCompleted);
        }, 1500);
      }),
    );

    Browser.open({ url: authUrl }).catch(() => finish(messages().errors.googleFailed));
  });
}

/** Misafir oturumu açar; ad sıralamada ve düelloda görünür. */
export async function signInAsGuest(rawName: string): Promise<{ player: Player } | { error: string }> {
  const name = rawName.trim();
  if (!name) return { error: messages().errors.guestNameRequired };
  const supabase = getSupabaseClient();
  if (!supabase) return { error: messages().errors.notConfigured };
  const { data, error } = await supabase.auth.signInAnonymously({ options: { data: { display_name: name } } });
  if (error || !data.user) return { error: messages().errors.guestFailed(error?.message ?? messages().errors.guestNoUser) };
  return { player: { id: data.user.id, name, avatarUrl: null } };
}

/**
 * Oturumdaki hesabı ve oyuncunun bütün verisini kalıcı olarak siler (supabase/schema.sql → delete_my_account),
 * ardından bu cihazdaki oturumu kapatır. Silinemezse hata metni döner.
 */
export async function deleteMyAccount(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return messages().errors.notConfigured;
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return messages().errors.deleteFailed;
  // Hesap sunucuda yok artık; yalnızca bu cihazda kalan oturum bilgisi temizlenir.
  await supabase.auth.signOut({ scope: "local" });
  return null;
}
