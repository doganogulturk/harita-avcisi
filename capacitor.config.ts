import type { CapacitorConfig } from "@capacitor/cli";

// appId mağazaya ilk yüklemeden sonra değiştirilemez; alan adına (haritaavcisi.com) göre seçildi.
const config: CapacitorConfig = {
  appId: "com.haritaavcisi.app",
  appName: "Harita Avcısı",
  // next build'in statik çıktısı; uygulama bu dosyaları cihazın içinden sunar.
  webDir: "out",
  // Sayfa yüklenene kadar WebView'in zemini; açılış ekranından sonra bembeyaz bir an görünmesin (sayfa zemini, slate-50).
  backgroundColor: "#f8fafc",
};

export default config;
