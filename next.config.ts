import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site sunucusuz, düz dosyalar olarak derlenir (out/). Aynı dosyalar Capacitor ile iOS ve Android uygulamasına
  // girer; bu yüzden sunucu gerektiren özellikler (dinamik rota, görsel optimizasyonu, rewrites) kullanılmaz.
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
