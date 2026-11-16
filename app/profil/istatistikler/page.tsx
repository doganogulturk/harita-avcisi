import type { Metadata } from "next";
import { ProfileScreen } from "../../components/profile/ProfileScreen";

export const metadata: Metadata = {
  title: "İstatistikler · Harita Avcısı",
  description: "Yarış istatistiklerin, düellolar, sıralamalardaki yerin, son turlar ve rozetler.",
  robots: { index: false },
};

export default function ProfileStatsPage() {
  return <ProfileScreen />;
}
