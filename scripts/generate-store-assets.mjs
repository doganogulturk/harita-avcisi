// Google Play mağaza görsellerini store/google-play/ klasörüne yazar:
//
// - icon-512.png: mağaza ikonu (512x512, kare; köşeleri Google yuvarlar). Telefondaki uygulama ikonuyla aynı kaynak
//   (assets/icon-only.png, scripts/generate-app-assets.mjs).
// - feature-graphic-1024x500.png: tanıtım görseli. Paylaşım görseliyle (scripts/generate-og-image.mjs) aynı tasarım;
//   Google bu görseli kenarlardan kırpabildiği ve ortasına oynat düğmesi koyabildiği için yazılar kenarlardan uzak.
//   Başlık yazı tipi (Stack Sans Notch) Google Fonts'tan yüklenir, ekran görüntüsünü bilgisayardaki Chrome alır.
//
//   node scripts/generate-store-assets.mjs

import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "store/google-play");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const WIDTH = 1024;
const HEIGHT = 500;

await mkdir(OUT, { recursive: true });

// Mağaza ikonu: saydamlık olmadan (Google 32 bit PNG kabul ediyor ama zemin zaten dolu).
const icon = path.join(OUT, "icon-512.png");
await sharp(path.join(ROOT, "assets/icon-only.png")).resize(512, 512).flatten({ background: "#ecfeff" }).png().toFile(icon);
console.log(path.relative(ROOT, icon));

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
    position: relative; padding: 70px 64px;
    background: radial-gradient(circle at 82% 22%, #cffafe 0, transparent 48%), #f8fafc;
    font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif; color: #0f172a;
  }
  .logo { display: flex; align-items: center; gap: 18px; }
  .badge { display: flex; width: 72px; height: 72px; align-items: center; justify-content: center; border-radius: 22px; background: #ecfeff; color: #0e7490; }
  .title { font-family: "Stack Sans Notch", sans-serif; font-weight: 700; font-size: 68px; line-height: 1; letter-spacing: -0.03em; }
  .title span { color: #0e7490; }
  .tagline { margin-top: 26px; max-width: 430px; font-size: 30px; line-height: 1.28; font-weight: 600; color: #334155; }
  .modes { position: absolute; left: 64px; bottom: 70px; display: flex; gap: 10px; }
  .mode { padding: 8px 18px; border-radius: 999px; font-size: 21px; font-weight: 700; }
  .map { position: absolute; right: 48px; top: 150px; width: 450px; }
  .map svg { display: block; width: 100%; height: auto; }
  .map g[data-plakakodu] path { fill: #e2e8f0; stroke: #94a3b8; stroke-width: 0.75; vector-effect: non-scaling-stroke; }
  .map g[data-plakakodu="06"] path { fill: #34d399; stroke: #047857; }
  .chip {
    position: absolute; right: 190px; top: 88px; padding: 8px 20px; border-radius: 999px;
    background: #10b981; color: #fff; font-family: "Stack Sans Notch", sans-serif; font-size: 30px; box-shadow: 0 8px 24px rgb(16 185 129 / 0.3);
  }
</style>
</head>
<body>
  <div class="logo">
    <div class="badge">
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2">
        <circle cx="12" cy="12" r="7" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    </div>
    <p class="title">harita <span>avcısı</span></p>
  </div>
  <p class="tagline">Türkiye'yi ve dünyayı<br>ne kadar tanıyorsun?</p>
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

const dir = await mkdtemp(path.join(tmpdir(), "harita-avcisi-store-"));
const feature = path.join(OUT, "feature-graphic-1024x500.png");
try {
  const page = path.join(dir, "feature.html");
  await writeFile(page, html);
  const shot = path.join(dir, "feature.png");
  execFileSync(CHROME, [
    "--headless=new",
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${WIDTH},${HEIGHT}`,
    "--virtual-time-budget=8000",
    `--screenshot=${shot}`,
    `file://${page}`,
  ]);
  // Google tanıtım görselinde saydamlık kabul etmiyor; JPEG ya da saydamlıksız PNG istiyor.
  await sharp(shot).flatten({ background: "#f8fafc" }).png().toFile(feature);
} finally {
  await rm(dir, { recursive: true, force: true });
}
console.log(path.relative(ROOT, feature));
