import type { Metadata, Viewport } from "next";
import { Stack_Sans_Notch } from "next/font/google";
import "./globals.css";

// Yalnızca logo başlığında kullanılır; next/font derleme sırasında indirip siteyle birlikte sunar.
const displayFont = Stack_Sans_Notch({
  subsets: ["latin", "latin-ext"],
  weight: "700",
  variable: "--font-stack-notch",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Harita Avcısı",
  description: "Türkiye şehirleri ve dünya ülkeleri için hızlı harita bulma oyunu.",
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
      <body>{children}</body>
    </html>
  );
}
