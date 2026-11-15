// Mağaza ekran görüntülerini çeker: node scripts/capture-store-screenshots.mjs (önce npm run build)
//
// Derlenmiş site (out/) yerelde sunulur ve bilgisayardaki Chrome (puppeteer-core) ile gezilir. Sahte bir oyuncu oturumu
// açılır; Supabase'e giden bütün istekler uydurma verilerle yanıtlanır, dış adreslere giden istekler kesilir: canlı
// veritabanına hiçbir şey yazılmaz, gerçek oyuncuların adı ve fotoğrafı görünmez.
//
// Çıktılar (depoya girmez):
//   release/screenshots/{tr,en}/          Google Play, 1080 × 1920 dikey
//   release/app-store/iphone/{tr,en}/     iPhone 6.3", 1206 × 2622 dikey; oyun ekranları 2622 × 1206 yatay
//   release/app-store/ipad/{tr,en}/       iPad 13", 2752 × 2064 yatay
//
// Sıra: 01 ana ekran, 02 mod seçimi, 03 başkent sorusu, 04 seri ve doğru cevap, 05 sonuç, 06 il kartları,
// 07 ilçe oyunu, 08 sıralama.

import { createServer } from "node:http";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIR = path.join(ROOT, "out");
const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

const env = await readFile(path.join(ROOT, ".env.local"), "utf8");
const SUPABASE_URL = env.match(/NEXT_PUBLIC_SUPABASE_URL=(\S+)/)?.[1];
if (!SUPABASE_URL) throw new Error(".env.local içinde NEXT_PUBLIC_SUPABASE_URL yok.");
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split(".")[0];

const DEVICES = {
  play: { dir: "release/screenshots", portrait: { width: 360, height: 640, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, landscapeGame: false },
  iphone: { dir: "release/app-store/iphone", portrait: { width: 402, height: 874, deviceScaleFactor: 3, isMobile: true, hasTouch: true }, landscapeGame: true },
  ipad: { dir: "release/app-store/ipad", portrait: { width: 1376, height: 1032, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, landscapeGame: false },
};

const PLAYER = { tr: "Ayşe", en: "Emma" };
const RIVALS = ["Deniz K.", "Ece Y.", "Mert A.", "Zeynep", "Kaan T.", "Elif S.", "Arda", "Selin B.", "Can", "Derin"];
const PLAYER_ID = "00000000-0000-4000-8000-000000000001";
/** Başkent turunun soruları sırayla (ülke kodu); cevaplar bunlarla verilir. */
const CAPITAL_QUESTIONS = ["jp", "au", "br", "fr", "eg", "ca", "in", "it", "ar", "tr"];

const LABELS = {
  tr: { play: "Oyna", capitals: "Başkentler", leaderboard: "Sıralamayı gör", closeHint: "İpucunu kapat", ankara: "Ankara" },
  en: { play: "Play", capitals: "Capitals", leaderboard: "Leaderboard", closeHint: "Close tip", ankara: "Ankara" },
};

// --- Yerel sunucu: out/ klasörü, uzantısız adresler .html'e gider (Vercel'deki gibi). ---
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".woff2": "font/woff2", ".txt": "text/plain", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json" };
async function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split("?")[0]);
  for (const candidate of [clean, `${clean}.html`, path.join(clean, "index.html")]) {
    const file = path.join(OUT_DIR, candidate);
    if (!file.startsWith(OUT_DIR)) return null;
    try {
      if ((await stat(file)).isFile()) return file;
    } catch {
      // sıradaki aday
    }
  }
  return null;
}
const server = createServer(async (request, response) => {
  const file = await resolveFile(request.url ?? "/");
  if (!file) {
    response.writeHead(404).end();
    return;
  }
  response.writeHead(200, { "Content-Type": TYPES[path.extname(file)] ?? "application/octet-stream" });
  response.end(await readFile(file));
});
await new Promise((resolve) => server.listen(PORT, resolve));

// --- Uydurma sunucu yanıtları ---
function leaderboard(locale, seed) {
  const names = [...RIVALS.slice(seed % 3), ...RIVALS.slice(0, seed % 3)];
  const rows = names.slice(0, 9).map((name, index) => ({
    user_id: `00000000-0000-4000-8000-0000000001${String(index).padStart(2, "0")}`,
    display_name: name,
    avatar_url: null,
    score: index < 3 ? 10 : index < 6 ? 9 : 8,
    duration_ms: 38000 + index * 4100 + seed * 900,
    best_streak: 10 - Math.min(index, 4),
  }));
  rows.splice(3, 0, { user_id: PLAYER_ID, display_name: PLAYER[locale], avatar_url: null, score: 10, duration_ms: 51000, best_streak: 10 });
  return rows;
}
const LOCATION_STATS = [
  { location_id: "sk", asked: 420, wrong: 214, wrong_rate: 0.51, most_confused_with: "si", confused_count: 61 },
  { location_id: "si", asked: 398, wrong: 176, wrong_rate: 0.44, most_confused_with: "sk", confused_count: 52 },
  { location_id: "mk", asked: 377, wrong: 151, wrong_rate: 0.4, most_confused_with: "al", confused_count: 33 },
];

function mockSupabase(locale, requestUrl, method) {
  const url = new URL(requestUrl);
  const route = url.pathname;
  if (route === "/auth/v1/user") return { id: PLAYER_ID, aud: "authenticated", role: "authenticated", app_metadata: { provider: "anonymous" }, user_metadata: { display_name: PLAYER[locale] } };
  if (route.endsWith("/rpc/start_ranked_round")) return { round_id: "00000000-0000-4000-8000-0000000000aa", questions: CAPITAL_QUESTIONS };
  if (route.endsWith("/rpc/my_daily")) return { day: "2026-11-16", streak: 6, started: [], results: [] };
  if (route.endsWith("/rpc/my_badges")) return [];
  if (route.includes("/rpc/")) return null;
  if (route.endsWith("/leaderboard") || route.endsWith("/daily_leaderboard")) return leaderboard(locale, (url.searchParams.get("variant") ?? "").length);
  if (route.endsWith("/location_stats")) return LOCATION_STATS;
  if (method === "GET") return [];
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openPage(browser, locale, viewport) {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith(BASE)) return request.continue();
    if (url.startsWith(SUPABASE_URL)) {
      if (request.method() === "OPTIONS") return request.respond({ status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "*" } });
      return request.respond({
        status: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Content-Type": "application/json" },
        body: JSON.stringify(mockSupabase(locale, url, request.method())),
      });
    }
    return request.abort();
  });
  const session = {
    access_token: "screenshot.session.token",
    refresh_token: "screenshot-refresh",
    token_type: "bearer",
    expires_in: 3600 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    user: { id: PLAYER_ID, aud: "authenticated", role: "authenticated", app_metadata: { provider: "anonymous" }, user_metadata: { display_name: PLAYER[locale] } },
  };
  await page.evaluateOnNewDocument(
    (values) => {
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
    },
    {
      "harita-avcisi:locale": locale,
      "harita-avcisi:guide-seen": "1",
      "harita-avcisi:play-tips-seen": "1",
      "harita-avcisi:district-sort": "name",
      [`sb-${PROJECT_REF}-auth-token`]: JSON.stringify(session),
    },
  );
  return page;
}

/** Görünür metni ya da ekran okuyucu adı verilen metinle başlayan tuşa basar. */
async function clickText(page, text) {
  const clicked = await page.evaluate((wanted) => {
    const target = [...document.querySelectorAll("button, a")].find((element) => {
      const label = (element.getAttribute("aria-label") ?? element.textContent ?? "").replace(/^[^\p{L}\p{N}]+/u, "").trim();
      return label.toLocaleLowerCase("tr").startsWith(wanted.toLocaleLowerCase("tr"));
    });
    target?.click();
    return Boolean(target);
  }, text);
  if (!clicked) throw new Error(`"${text}" tuşu bulunamadı.`);
}

async function shot(page, dir, name) {
  await page.screenshot({ path: path.join(dir, `${name}.png`) });
  console.log(`  ${path.relative(ROOT, path.join(dir, `${name}.png`))}`);
}

/** Haritada bir yere klavyeyle (odak + Enter) cevap verir; dokunmatik ölçümlerden bağımsız. */
async function answer(page, selector) {
  await page.evaluate((query) => document.querySelector(query)?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })), selector);
}

async function closeRotateHint(page, label) {
  await page.evaluate((text) => document.querySelector(`button[aria-label="${text}"]`)?.click(), label);
}

async function captureDevice(browser, deviceId, locale) {
  const device = DEVICES[deviceId];
  const dir = path.join(ROOT, device.dir, locale);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const labels = LABELS[locale];
  const portrait = device.portrait;
  const landscape = { ...portrait, width: portrait.height, height: portrait.width };
  console.log(`${deviceId} / ${locale}`);

  const page = await openPage(browser, locale, portrait);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await sleep(3200); // açılış animasyonu
  await shot(page, dir, "01-ana-ekran");

  await clickText(page, labels.play);
  await sleep(900);
  await shot(page, dir, "02-mod-secimi");

  await clickText(page, labels.capitals);
  if (device.landscapeGame) await page.setViewport(landscape);
  await page.waitForSelector("#game-map svg");
  await sleep(1200);
  await closeRotateHint(page, labels.closeHint);
  await sleep(300);
  await shot(page, dir, "03-baskent-sorusu");

  for (let index = 0; index < CAPITAL_QUESTIONS.length; index += 1) {
    await answer(page, `#game-map [data-country-code="${CAPITAL_QUESTIONS[index]}"]`);
    if (index === 2) {
      await sleep(450);
      await shot(page, dir, "04-seri");
    }
    await sleep(3400);
  }
  if (device.landscapeGame) await page.setViewport(portrait);
  await sleep(1300);
  await shot(page, dir, "05-sonuc");

  await page.goto(`${BASE}/ilceler`, { waitUntil: "networkidle0" });
  await sleep(1200);
  await shot(page, dir, "06-il-kartlari");

  await clickText(page, labels.ankara);
  await page.waitForSelector(".district-map svg");
  await sleep(800);
  const ankara = (await readFile(path.join(ROOT, "lib/districts-data.ts"), "utf8")).match(/^ {2}6: \[(.*)\],$/m)?.[1] ?? "";
  const districts = [...ankara.matchAll(/\["(TUR\d+)", "([^"]+)"\]/g)].map(([, id, name]) => ({ id, name }));
  for (const { id, name } of districts.filter((_, index) => index % 2 === 0).slice(0, 11)) {
    await answer(page, `.district-map path[id="${id}"]`);
    await sleep(60);
    await page.evaluate((wanted) => [...document.querySelectorAll("section button")].find((button) => button.textContent?.trim() === wanted)?.click(), name);
    await sleep(140);
  }
  await sleep(700);
  await shot(page, dir, "07-ilce-oyunu");

  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await sleep(3200);
  await clickText(page, labels.leaderboard);
  await sleep(1200);
  await shot(page, dir, "08-siralama");
  await page.close();
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--lang=tr-TR", "--hide-scrollbars"] });
try {
  const only = process.argv[2];
  for (const deviceId of Object.keys(DEVICES)) {
    if (only && only !== deviceId) continue;
    for (const locale of ["tr", "en"]) await captureDevice(browser, deviceId, locale);
  }
} finally {
  await browser.close();
  server.close();
}
