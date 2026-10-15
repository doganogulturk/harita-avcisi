import type { Metadata, Viewport } from "next";
import { Stack_Sans_Notch } from "next/font/google";
import "./globals.css";
import { ConnectionBanner } from "./components/ConnectionBanner";
import { KeyboardFocus } from "./components/KeyboardFocus";
import { NativeBackButton } from "./components/NativeBackButton";
import { NativeSystemBars } from "./components/NativeSystemBars";
import { SITE_URL } from "@/lib/site";

// Yalnızca logo başlığında kullanılır; next/font derleme sırasında indirip siteyle birlikte sunar.
const displayFont = Stack_Sans_Notch({
  subsets: ["latin", "latin-ext"],
  weight: "700",
  variable: "--font-stack-notch",
  display: "swap",
});

const DESCRIPTION = "Türkiye'nin 81 ilini ve dünyanın 179 ülkesini haritada ne kadar hızlı bulursun? Yarış, antrenman, düello ve oda.";

export const metadata: Metadata = {
  // Paylaşım görseli (app/opengraph-image.png, scripts/generate-og-image.mjs) tam adresle verilsin diye.
  metadataBase: new URL(SITE_URL),
  title: "Harita Avcısı",
  description: DESCRIPTION,
  // Bağlantı LinkedIn, WhatsApp ya da X'te paylaşılınca çıkan kart. Görseli Next.js opengraph-image.png'den ekler.
  openGraph: { type: "website", siteName: "Harita Avcısı", locale: "tr_TR", title: "Harita Avcısı", description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: "Harita Avcısı", description: DESCRIPTION },
  applicationName: "Harita Avcısı",
  // iOS'ta "Ana Ekrana Ekle" ile eklenen uygulamanın adı ve tam ekran açılması; simge app/apple-icon.png.
  appleWebApp: { capable: true, title: "Harita Avcısı", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html className={displayFont.variable} lang="tr">
      <body>
        {children}
        <ConnectionBanner />
        <KeyboardFocus />
        <NativeBackButton />
        <NativeSystemBars />
      </body>
    </html>
  );
}
