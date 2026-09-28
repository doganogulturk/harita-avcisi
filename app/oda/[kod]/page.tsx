import type { Metadata } from "next";
import { RoomScreen } from "../../components/room/RoomScreen";

export const metadata: Metadata = {
  title: "Oda · Harita Avcısı",
  description: "Arkadaşlarınla aynı sorularla yarış: oda sıralamasında kim önde?",
};

export default async function RoomPage({ params }: PageProps<"/oda/[kod]">) {
  const { kod } = await params;
  return <RoomScreen code={kod.toUpperCase()} />;
}
