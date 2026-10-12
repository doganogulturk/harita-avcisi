import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomScreenFromQuery } from "../components/room/RoomScreen";

export const metadata: Metadata = {
  title: "Oda · Harita Avcısı",
  description: "Arkadaşlarınla aynı sorularla yarış: oda sıralamasında kim önde?",
};

// Kod sorgu dizgisinde (/oda?kod=ABCD); nedeni app/duello/page.tsx'te.
export default function RoomPage() {
  return (
    <Suspense>
      <RoomScreenFromQuery />
    </Suspense>
  );
}
