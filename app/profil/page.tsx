import type { Metadata } from "next";
import { ProfileHub } from "../components/profile/ProfileHub";

export const metadata: Metadata = {
  title: "Profil · Harita Avcısı",
  description: "Hesabın, istatistiklerinin özeti, dil ve ses ayarları, Hakkında ve yasal sayfalar.",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileHub />;
}
