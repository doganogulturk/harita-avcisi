"use client";

import { useMemo, useState } from "react";
import { DarkSystemBars } from "../NativeSystemBars";
import { MapPuzzle } from "../map-puzzle/MapPuzzle";
import { ProvincePicker } from "./ProvincePicker";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { messages } from "@/lib/i18n";
import { DISTRICT_PROVINCES, districtMapUrl, districtsOf } from "@/lib/districts";

/**
 * /ilceler: önce il seçilir, sonra o ilin ilçeleriyle "Haritayı tamamla" oynanır. Tur kaydedilmez (antrenman gibi);
 * kişisel rekorlar ve il koleksiyonu sonraki adımda.
 */
export function DistrictScreen() {
  const [plate, setPlate] = useState<number | null>(null);
  // Android geri tuşu turdan il seçimine döner; il seçiminde sayfanın kendi geçmişi işler.
  useBackHandler(() => setPlate(null), BACK_PRIORITY.screen, plate !== null);

  return (
    <main className="safe-area sea-backdrop flex h-[100dvh] flex-col text-white">
      <DarkSystemBars />
      {plate === null ? <ProvincePicker onPick={setPlate} /> : <DistrictPuzzle key={plate} onBack={() => setPlate(null)} plate={plate} />}
    </main>
  );
}

/** İlin bütün ilçeleriyle Haritayı tamamla. */
function DistrictPuzzle({ plate, onBack }: { plate: number; onBack: () => void }) {
  const { districts } = messages();
  const province = DISTRICT_PROVINCES.find((candidate) => candidate.plate === plate);
  const pieces = useMemo(() => districtsOf(plate), [plate]);
  const text = useMemo(() => ({ ...districts, other: districts.otherProvince, count: districts.districtCount }), [districts]);
  return <MapPuzzle mapUrl={districtMapUrl(plate)} onBack={onBack} pieces={pieces} text={text} title={province?.name ?? ""} />;
}
