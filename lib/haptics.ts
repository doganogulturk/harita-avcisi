/**
 * Cevaba kısa bir titreşimle tepki. Titreşim API'si Android tarayıcılarında ve Android uygulamasında (WebView,
 * AndroidManifest.xml'deki VIBRATE izniyle) çalışır; iPhone Safari ve masaüstü desteklemez, çağrı sessizce bir şey
 * yapmaz. Tarayıcı titreşimi yalnızca kullanıcının dokunuşundan hemen sonra izin verdiği için cevap anında çağrılır.
 */
const PATTERNS = {
  correct: 18,
  incorrect: [35, 50, 35],
} satisfies Record<string, VibratePattern>;

export function vibrate(kind: keyof typeof PATTERNS) {
  try {
    navigator.vibrate?.(PATTERNS[kind]);
  } catch {
    // Bazı tarayıcılar (ör. kullanıcı etkileşimi olmadan) hata fırlatır; titreşim isteğe bağlı bir süs.
  }
}
