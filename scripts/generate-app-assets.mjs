// Mobil uygulamanın ikonunu ve açılış ekranını üretir. Nişangah, sitedeki logoyla (app/components/Logo.tsx)
// aynı 24 birimlik çizimdir.
//
// - iOS: ikon (1024 px, tek boyut yeter) ve açılış ekranının ortasındaki rozet doğrudan Assets.xcassets'e yazılır.
//   Açılış ekranı LaunchScreen.storyboard'da düz zemin + bu rozet; tam ekran bir resim değil, çünkü iOS bellekte
//   25 MB'ı aşan açılış görselini hiç çizmez (2732 px kare bir görsel @3x'te bunu aşar).
// - Android: kaynaklar assets/ klasörüne yazılır, bütün boyutları capacitor-assets üretir.
//
//   node scripts/generate-app-assets.mjs && npx capacitor-assets generate --android --iconBackgroundColor '#ecfeff' --splashBackgroundColor '#f8fafc'

import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const INK = "#0e7490"; // cyan-700, logodaki nişangah
const BADGE = "#ecfeff"; // cyan-50, logodaki rozet zemini
const PAGE = "#f8fafc"; // slate-50, sayfa ve açılış perdesi zemini

/** Logo.tsx'teki nişangah: 24x24 birim, `size` piksele ölçeklenip (cx, cy) merkezine oturtulur. */
function crosshair(cx, cy, size) {
  const scale = size / 24;
  return `
    <g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${scale})" fill="none" stroke="${INK}" stroke-linecap="round" stroke-width="2">
      <circle cx="12" cy="12" r="7" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="1.5" fill="${INK}" stroke="none" />
    </g>`;
}

const svg = (width, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;

const assets = {
  // iOS ve eski Android ikonu: kare ve saydamlıksız; köşeleri sistem yuvarlar.
  "icon-only.png": svg(1024, 1024, `<rect width="1024" height="1024" fill="${BADGE}" />${crosshair(512, 512, 680)}`),
  // Android uyarlanabilir ikon katmanları. capacitor-assets ön katmanı kendisi güvenli alana (ortadaki %66)
  // küçülttüğü için nişangah burada icon-only ile aynı oranda çizilir.
  "icon-foreground.png": svg(1024, 1024, crosshair(512, 512, 680)),
  "icon-background.png": svg(1024, 1024, `<rect width="1024" height="1024" fill="${BADGE}" />`),
  // Android 11 ve öncesinin açılış ekranı: sayfa zemininde logodaki rozet. Ekran oranına göre kenarlardan
  // kırpılır, ortası her cihazda görünür. Android 12 ve sonrası ikonu gösterir (styles.xml).
  "splash.png": svg(
    2732,
    2732,
    `<rect width="2732" height="2732" fill="${PAGE}" />
     <rect x="1126" y="1126" width="480" height="480" rx="128" fill="${BADGE}" />
     ${crosshair(1366, 1366, 288)}`,
  ),
};

async function writePng(path, source) {
  await sharp(Buffer.from(source)).png().toFile(path);
  console.log(path);
}

await mkdir("assets", { recursive: true });
for (const [name, source] of Object.entries(assets)) await writePng(`assets/${name}`, source);

// iOS
const catalog = "ios/App/App/Assets.xcassets";
await writePng(`${catalog}/AppIcon.appiconset/AppIcon-512@2x.png`, assets["icon-only.png"]);

// Açılış rozeti: storyboard'da 160x160 pt; logodaki rozetle aynı oranlarda.
const SPLASH_LOGO_PT = 160;
const splashLogo = `${catalog}/SplashLogo.imageset`;
await mkdir(splashLogo, { recursive: true });
const images = [];
for (const scale of [1, 2, 3]) {
  const size = SPLASH_LOGO_PT * scale;
  const filename = `splash-logo@${scale}x.png`;
  await writePng(
    `${splashLogo}/${filename}`,
    svg(size, size, `<rect width="${size}" height="${size}" rx="${size * 0.27}" fill="${BADGE}" />${crosshair(size / 2, size / 2, size * 0.6)}`),
  );
  images.push({ idiom: "universal", filename, scale: `${scale}x` });
}
await writeFile(`${splashLogo}/Contents.json`, JSON.stringify({ images, info: { author: "xcode", version: 1 } }, null, 2) + "\n");
