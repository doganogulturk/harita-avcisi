import type { MetadataRoute } from "next";

// Statik dışa aktarımda manifest derleme sırasında dosyaya yazılır.
export const dynamic = "force-static";

/**
 * Ana ekrana eklenebilir uygulama tanımı. Simgeler logodaki nişangahtır (public/icons). Yüklü uygulama telefonun
 * tutuluşuna göre açılır; süreli oyunlarda yatay önerilir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Harita Avcısı",
    short_name: "Harita Avcısı",
    description: "Türkiye şehirleri ve dünya ülkeleri için hızlı harita bulma oyunu.",
    lang: "tr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Tüm ekranlar ve oyunlar dikeyde de kullanılır; yatayda harita büyür.
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#f8fafc",
    categories: ["games", "education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
