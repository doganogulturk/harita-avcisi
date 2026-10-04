import type { MetadataRoute } from "next";

/**
 * Ana ekrana eklenebilir uygulama tanımı. Simgeler logodaki nişangahtır (public/icons). Oyun yatay
 * düzen için tasarlandığı için yüklü uygulama yatay açılır; telefonu çevir uyarısına gerek kalmaz.
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
    orientation: "landscape",
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
