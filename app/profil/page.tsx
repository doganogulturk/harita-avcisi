import type { Metadata } from "next";
import { ProfileScreen } from "../components/profile/ProfileScreen";

export const metadata: Metadata = {
  title: "Profil · Harita Avcısı",
  description: "Yarış istatistiklerin, sıralamalardaki yerin ve en çok yanlış yaptığın yerler.",
  robots: { index: false },
};

export default function ProfilePage() {
  return <ProfileScreen />;
}
