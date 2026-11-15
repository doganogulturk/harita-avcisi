import type { Metadata } from "next";
import { DistrictScreen } from "../components/districts/DistrictScreen";

export const metadata: Metadata = {
  title: "İlçeler · Harita Avcısı",
  description: "Bir il seç, bütün ilçelerini haritadaki yerine yerleştir.",
};

export default function DistrictsPage() {
  return <DistrictScreen />;
}
