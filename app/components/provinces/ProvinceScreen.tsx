"use client";

import { useEffect, useMemo, useState } from "react";
import { DarkSystemBars } from "../NativeSystemBars";
import { REGION_STYLE } from "../districts/ProvincePicker";
import { MapPuzzle } from "../map-puzzle/MapPuzzle";
import { SetCard, SetPicker } from "../map-puzzle/SetPicker";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { messages } from "@/lib/i18n";
import { PROVINCE_SETS, provinceMapUrl, provincesOf, REGION_SHAPES_URL, type ProvinceSetId } from "@/lib/provinces-puzzle";

/**
 * /iller: önce harita seçilir (bütün Türkiye ya da bir coğrafi bölge), sonra o haritanın illeriyle "Haritayı tamamla"
 * oynanır. Tur kaydedilmez (İlçeler gibi).
 */
export function ProvinceScreen() {
  const [setId, setSetId] = useState<ProvinceSetId | null>(null);
  // Android geri tuşu turdan harita seçimine döner; seçimde sayfanın kendi geçmişi işler.
  useBackHandler(() => setSetId(null), BACK_PRIORITY.screen, setId !== null);

  return (
    <main className="safe-area sea-backdrop flex h-[100dvh] flex-col text-white">
      <DarkSystemBars />
      {setId === null ? <ProvinceSetPicker onPick={setSetId} /> : <ProvincePuzzle id={setId} key={setId} onBack={() => setSetId(null)} />}
    </main>
  );
}

function setName(id: ProvinceSetId) {
  const { provinces, mapPuzzle } = messages();
  return id === "all" ? provinces.all : mapPuzzle.regions[id];
}

/** Haritanın bütün illeriyle Haritayı tamamla. */
function ProvincePuzzle({ id, onBack }: { id: ProvinceSetId; onBack: () => void }) {
  const { provinces } = messages();
  const pieces = useMemo(() => provincesOf(id), [id]);
  const text = useMemo(() => ({ ...provinces, count: provinces.provinceCount }), [provinces]);
  return <MapPuzzle mapUrl={provinceMapUrl(id)} onBack={onBack} pieces={pieces} text={text} title={setName(id)} />;
}

type RegionShapes = { viewBox: string; outline: string; regions: Record<string, string> };
let shapesCache: RegionShapes | null = null;

/** Kart silüetleri tek dosyada (~17 KB); bir kez indirilir. Gelmezse kartlar silüetsiz görünür. */
function useRegionShapes() {
  const [shapes, setShapes] = useState<RegionShapes | null>(shapesCache);
  useEffect(() => {
    if (shapesCache) return;
    let isActive = true;
    fetch(REGION_SHAPES_URL)
      .then((response) => (response.ok ? (response.json() as Promise<RegionShapes>) : null))
      .then((loaded) => {
        if (!loaded) return;
        shapesCache = loaded;
        if (isActive) setShapes(loaded);
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, []);
  return shapes;
}

/** Harita seçimi: önce bütün Türkiye, sonra yedi bölge. Bölge kartında Türkiye soluk, bölge beyaz. */
function ProvinceSetPicker({ onPick }: { onPick: (id: ProvinceSetId) => void }) {
  const { provinces: text } = messages();
  const shapes = useRegionShapes();
  return (
    <SetPicker note={text.pickNote} title={text.title}>
      {PROVINCE_SETS.map((set) => {
        const style = set.id === "all" ? undefined : REGION_STYLE[set.id];
        return (
          <SetCard
            color={style?.color}
            count={text.provinceCount(set.plates.length)}
            key={set.id}
            name={setName(set.id)}
            onPick={() => onPick(set.id)}
            textClass={style?.text}
            viewBox={shapes?.viewBox}
          >
            {shapes && <path d={shapes.outline} fill="#fff" fillOpacity={set.id === "all" ? 0.9 : 0.18} fillRule="evenodd" />}
            {shapes && set.id !== "all" && <path d={shapes.regions[set.id]} fill="#fff" fillOpacity={0.92} fillRule="evenodd" />}
          </SetCard>
        );
      })}
    </SetPicker>
  );
}
