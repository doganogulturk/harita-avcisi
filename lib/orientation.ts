import { Capacitor } from "@capacitor/core";
import { ScreenOrientation } from "@capacitor/screen-orientation";

/**
 * Mobil uygulamada oyun sırasında ekranı yataya kilitlemek için. Telefonun yön kilidi açık olsa bile ekran döner;
 * oyuncu dikeyde oynarken haritanın altındaki "Yan çevir" ipucuna dokununca kullanılır. Oyun haritası kapanınca kilit
 * kalkar ve menüler yine telefonun tutuluşuna göre döner. Haritalar ekranlar arasında geçerken bir an kaldırılıp yeniden
 * çizilebilir; kilit o yüzden hemen değil, kısa bir süre sonra ve bu arada yeni harita çizilmediyse açılır.
 */
let isLandscapeLocked = false;
let pendingUnlock: number | undefined;
const UNLOCK_DELAY_MS = 400;

/** Yataya kilitleme yalnızca mobil uygulamada güvenilir; tarayıcıda oyuncu telefonu kendisi çevirir. */
export const canLockLandscape = () => Capacitor.isNativePlatform();

export async function lockLandscape() {
  if (!canLockLandscape()) return;
  try {
    await ScreenOrientation.lock({ orientation: "landscape" });
    isLandscapeLocked = true;
  } catch {
    // Kilitlenemezse oyuncu telefonu kendisi çevirir.
  }
}

/** Oyun haritası çizildiğinde: bekleyen kilit açma iptal edilir, kilit yeni haritada sürer. */
export function keepLandscapeLock() {
  window.clearTimeout(pendingUnlock);
}

/** Oyun haritası kaldırıldığında: kilit varsa kısa bir süre sonra açılır. */
export function releaseLandscapeLock() {
  if (!isLandscapeLocked) return;
  pendingUnlock = window.setTimeout(() => {
    isLandscapeLocked = false;
    void ScreenOrientation.unlock().catch(() => {});
  }, UNLOCK_DELAY_MS);
}
