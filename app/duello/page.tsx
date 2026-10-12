import type { Metadata } from "next";
import { Suspense } from "react";
import { DuelScreenFromQuery } from "../components/duel/DuelScreen";

export const metadata: Metadata = {
  title: "Düello · Harita Avcısı",
  description: "İki kişi, aynı sorular, aynı anda: haritada kim daha hızlı?",
};

// Kod adresin parçası değil sorgu dizgisi (/duello?kod=ABCD): site statik dışa aktarılıyor ve mobil uygulama
// aynı dosyaları taşıyor, dinamik rota derlemede üretilemez. Eski /duello/ABCD bağlantıları vercel.json'da yönlenir.
export default function DuelPage() {
  return (
    <Suspense>
      <DuelScreenFromQuery />
    </Suspense>
  );
}
