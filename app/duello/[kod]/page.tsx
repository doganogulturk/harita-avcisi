import type { Metadata } from "next";
import { DuelScreen } from "../../components/duel/DuelScreen";

export const metadata: Metadata = {
  title: "Düello · Harita Avcısı",
  description: "İki kişi, aynı sorular, aynı anda: haritada kim daha hızlı?",
};

export default async function DuelPage({ params }: PageProps<"/duello/[kod]">) {
  const { kod } = await params;
  return <DuelScreen code={kod.toUpperCase()} />;
}
