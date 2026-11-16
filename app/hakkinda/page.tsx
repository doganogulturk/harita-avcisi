import type { Metadata } from "next";
import { AboutScreen } from "../components/profile/AboutScreen";

export const metadata: Metadata = {
  title: "Hakkında · Harita Avcısı",
  description: "Harita Avcısı'nın sürümü, geliştiricisi ve sürüm geçmişi.",
};

export default function AboutPage() {
  return <AboutScreen />;
}
