import type { CapacitorConfig } from "@capacitor/cli";

// appId mağazaya ilk yüklemeden sonra değiştirilemez; alan adı kesinleşince güncellenecek geçici değer.
const config: CapacitorConfig = {
  appId: "com.haritaavcisi.app",
  appName: "Harita Avcısı",
  // next build'in statik çıktısı; uygulama bu dosyaları cihazın içinden sunar.
  webDir: "out",
};

export default config;
