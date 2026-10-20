// Google Play'e yüklenecek imzalı Android paketini (AAB) üretir: npm run android:release
//
// 1. android/app/build.gradle'daki versionCode'u bir artırır, versionName'i package.json'daki sürümden alır.
//    Play Console aynı versionCode'u ikinci kez kabul etmez; kullanıcıya görünen sürüm versionName'dir.
// 2. Siteyi derler (next build), Android projesine kopyalar (cap sync) ve bundleRelease ile imzalar.
// 3. Paketi release/ klasörüne sürüm adıyla kopyalar (depoya girmez).
//
// Derleme başarısız olursa build.gradle eski hâline döner. Başarılı olursa sürüm değişikliğini commit edin.
// Yükleme anahtarı depoda değil; yeri android/app/build.gradle'ın başında anlatılıyor.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const GRADLE_FILE = "android/app/build.gradle";
const AAB = "android/app/build/outputs/bundle/release/app-release.aab";
const KEYSTORE = process.env.HARITA_AVCISI_KEYSTORE ?? join(homedir(), ".android-anahtarlar/harita-avcisi/keystore.properties");
// Gradle 8 Java 21 ister; JAVA_HOME tanımlı değilse Homebrew'daki openjdk@21 denenir.
const JDK21 = "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home";

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

if (!existsSync(KEYSTORE)) fail(`Yükleme anahtarı bulunamadı: ${KEYSTORE}`);

const { version } = JSON.parse(readFileSync("package.json", "utf8"));
const original = readFileSync(GRADLE_FILE, "utf8");
const codeMatch = original.match(/versionCode (\d+)/);
if (!codeMatch) fail(`${GRADLE_FILE} içinde versionCode bulunamadı.`);
const versionCode = Number(codeMatch[1]) + 1;

writeFileSync(
  GRADLE_FILE,
  original.replace(/versionCode \d+/, `versionCode ${versionCode}`).replace(/versionName "[^"]*"/, `versionName "${version}"`),
);
console.log(`Sürüm ${version} (versionCode ${versionCode}) derleniyor…\n`);

const env = { ...process.env };
if (!env.JAVA_HOME && existsSync(JDK21)) env.JAVA_HOME = JDK21;
const run = (command, args, cwd = ".") => execFileSync(command, args, { cwd, env, stdio: "inherit" });

try {
  run("npm", ["run", "build"]);
  run("npx", ["cap", "sync", "android"]);
  run("./gradlew", ["bundleRelease", "--console=plain"], "android");
} catch {
  writeFileSync(GRADLE_FILE, original);
  fail(`Derleme başarısız; ${GRADLE_FILE} eski hâline döndürüldü.`);
}

mkdirSync("release", { recursive: true });
const target = `release/harita-avcisi-${version}-${versionCode}.aab`;
copyFileSync(AAB, target);
console.log(`\n✓ ${target}`);
console.log(`  Sürüm değişikliğini commit edin: git commit -am "Android ${version} (${versionCode})"`);
