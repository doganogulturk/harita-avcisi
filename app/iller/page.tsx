import type { Metadata } from "next";
import { ProvinceScreen } from "../components/provinces/ProvinceScreen";

export const metadata: Metadata = {
  title: "İller · Harita Avcısı",
  description: "Bütün Türkiye'yi ya da bir bölgeyi seç, illeri haritadaki yerine yerleştir.",
};

export default function ProvincesPage() {
  return <ProvinceScreen />;
}
