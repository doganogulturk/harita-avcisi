import { Capacitor } from "@capacitor/core";
import { Haptics, NotificationType } from "@capacitor/haptics";

/**
 * Cevaba kısa bir titreşimle tepki.
 *
 * - Mobil uygulamada (iOS ve Android) cihazın titreşim motoru kullanılır (@capacitor/haptics): doğru cevapta
 *   "başarılı", yanlışta "hata" bildirimi; iPhone'da bunlar birbirinden ayırt edilen kısa dokunuşlardır.
 * - Sitede tarayıcının titreşim API'si kullanılır; Android tarayıcılarında çalışır, iPhone Safari ve masaüstü
 *   desteklemez (çağrı sessizce bir şey yapmaz). Tarayıcı titreşimi yalnızca dokunuştan hemen sonra izin verdiği için
 *   cevap anında çağrılır.
 */
const WEB_PATTERNS = {
  correct: 18,
  incorrect: [35, 50, 35],
} satisfies Record<string, VibratePattern>;

export function vibrate(kind: keyof typeof WEB_PATTERNS) {
  if (Capacitor.isNativePlatform()) {
    void Haptics.notification({ type: kind === "correct" ? NotificationType.Success : NotificationType.Error }).catch(() => {});
    return;
  }
  try {
    navigator.vibrate?.(WEB_PATTERNS[kind]);
  } catch {
    // Bazı tarayıcılar (ör. kullanıcı etkileşimi olmadan) hata fırlatır; titreşim isteğe bağlı bir süs.
  }
}
