// Bağlantı önizleme görselini (Open Graph, 1200x630) üretir: LinkedIn, WhatsApp, X gibi yerlerde haritaavcisi.com
// paylaşılınca çıkan kartın resmi. Next.js görseli app/opengraph-image.png'den okur ve sayfaya meta etiketini kendisi ekler.
//
// Görsel derlemede değil burada, bir kez üretilir: logodaki başlık yazı tipi (Stack Sans Notch) next/og'nin
// çizebildiği yazı tipleri arasında yok. Sayfa düz bir HTML olarak yazılır, yazı tipi Google Fonts'tan yüklenir ve
// bilgisayardaki Chrome ekran görüntüsünü alır. Logo, harita ya da tanıtım cümlesi değişirse yeniden çalıştırılır.
//
//   node scripts/generate-og-image.mjs

import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUTPUT = path.join(ROOT, "app/opengraph-image.png");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIDTH = 1200;
const HEIGHT = 630;

/** Haritada yeşil yanan il (Ankara) ve sorulan ilin etiketi; tanıtımdaki ilk soruyla aynı. */
const HIGHLIGHTED_PLATE = "06";

const turkey = await readFile(path.join(ROOT, "public/maps/turkey.svg"), "utf8");

const html = `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Stack+Sans+Notch:wght@700&display=block">
<style>
  * { box-sizing: border-box; margin: 0; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    display: flex; flex-direction: column; justify-content: space-between; padding: 64px 72px;
    background: radial-gradient(circle at 85% 20%, #cffafe 0, transparent 45%), #f8fafc;
    font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif; color: #0f172a;
  }
  .logo { display: flex; align-items: center; gap: 22px; }
  .badge { display: flex; width: 88px; height: 88px; align-items: center; justify-content: center; border-radius: 26px; background: #ecfeff; color: #0e7490; }
  .title { font-family: "Stack Sans Notch", sans-serif; font-weight: 700; font-size: 84px; line-height: 1; letter-spacing: -0.03em; }
  .title span { color: #0e7490; }
  .tagline { margin-top: 28px; max-width: 500px; font-size: 32px; line-height: 1.3; font-weight: 600; color: #334155; }
  .modes { display: flex; gap: 12px; }
  .mode { padding: 10px 20px; border-radius: 999px; font-size: 24px; font-weight: 700; }
  .map { position: absolute; right: 40px; bottom: 110px; width: 540px; }
  .map svg { display: block; width: 100%; height: auto; }
  .map g[data-plakakodu] path, .map path[id^="_"], .map #guney-kibris path, .map #kuzey-kibris path {
    fill: #e2e8f0; stroke: #94a3b8; stroke-width: 0.75; vector-effect: non-scaling-stroke;
  }
  .map g[data-plakakodu="${HIGHLIGHTED_PLATE}"] path { fill: #34d399; stroke: #047857; }
  .chip {
    position: absolute; right: 210px; top: 160px; padding: 10px 22px; border-radius: 999px;
    background: #10b981; color: #fff; font-family: "Stack Sans Notch", sans-serif; font-size: 34px; box-shadow: 0 8px 24px rgb(16 185 129 / 0.3);
  }
</style>
</head>
<body>
  <div>
    <div class="logo">
      <div class="badge">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2">
          <circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <p class="title">harita <span>avcısı</span></p>
    </div>
    <p class="tagline">Türkiye'nin 81 ilini ve dünyanın 179 ülkesini haritada ne kadar hızlı bulursun?</p>
  </div>
  <div class="modes">
    <span class="mode" style="background:#0891b2;color:#fff">Yarış</span>
    <span class="mode" style="background:#fbbf24;color:#451a03">Antrenman</span>
    <span class="mode" style="background:#f97316;color:#fff">Düello</span>
    <span class="mode" style="background:#7c3aed;color:#fff">Oda</span>
  </div>
  <div class="map">${turkey}</div>
  <p class="chip">✓ Ankara</p>
</body>
</html>`;

const dir = await mkdtemp(path.join(tmpdir(), "harita-avcisi-og-"));
try {
  const page = path.join(dir, "og.html");
  await writeFile(page, html);
  execFileSync(CHROME, [
    "--headless=new",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${WIDTH},${HEIGHT}`,
    // Yazı tipinin yüklenmesine zaman tanır; display=block yüklenene kadar yazıyı çizmez.
    "--virtual-time-budget=8000",
    `--screenshot=${OUTPUT}`,
    `file://${page}`,
  ]);
} finally {
  await rm(dir, { recursive: true, force: true });
}

const { size } = await stat(OUTPUT);
console.log(`${path.relative(ROOT, OUTPUT)} yazıldı (${Math.round(size / 1024)} KB)`);
