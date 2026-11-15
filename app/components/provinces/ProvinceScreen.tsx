"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DarkSystemBars } from "../NativeSystemBars";
import { CornerLabel, LABEL_COLOR, REGION_STYLE } from "../districts/ProvincePicker";
import { BackArrow, MapPuzzle, ROUND_BUTTON } from "../map-puzzle/MapPuzzle";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { messages } from "@/lib/i18n";
import { PROVINCE_SETS, provinceMapUrl, provincesOf, REGION_SHAPES_URL, type ProvinceSet, type ProvinceSetId } from "@/lib/provinces-puzzle";

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

/**
 * Harita kartı: saydam, ortada Türkiye silüeti. Bölge kartında Türkiye soluk, bölge beyaz (yeri bir bakışta görünür);
 * bütün Türkiye kartında ülkenin tamamı beyaz. Sol altta adı (bölgenin renginde), sağ altta il sayısı.
 */
function ProvinceSetCard({ set, shapes, onPick }: { set: ProvinceSet; shapes: RegionShapes | null; onPick: (id: ProvinceSetId) => void }) {
  const { provinces: text } = messages();
  const name = setName(set.id);
  const style = set.id === "all" ? { color: LABEL_COLOR, text: "text-white" } : REGION_STYLE[set.id];
  return (
    <button
      aria-label={`${name}, ${text.provinceCount(set.plates.length)}`}
      className="relative block h-36 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-white/15 bg-white/[0.07] text-left text-white transition hover:bg-white/[0.12] active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none sm:h-40 lg:h-44"
      onClick={() => onPick(set.id)}
      type="button"
    >
      {shapes && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-x-[8%] top-[10%] h-[62%] w-[84%] drop-shadow-[0_2px_0_rgb(0_0_0/0.18)]" preserveAspectRatio="xMidYMid meet" viewBox={shapes.viewBox}>
          <path d={shapes.outline} fill="#fff" fillOpacity={set.id === "all" ? 0.9 : 0.18} fillRule="evenodd" />
          {set.id !== "all" && <path d={shapes.regions[set.id]} fill="#fff" fillOpacity={0.92} fillRule="evenodd" />}
        </svg>
      )}
      <CornerLabel className={`max-w-[78%] px-3 pt-1.5 pb-1 font-display leading-tight font-bold ${name.length > 13 ? "text-base tracking-tight" : "text-lg lg:text-xl"} ${style.text}`} color={style.color} corner="bl">
        <span className="truncate">{name}</span>
      </CornerLabel>
      <CornerLabel className="px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white tabular-nums" color={LABEL_COLOR} corner="br">
        {text.provinceCount(set.plates.length)}
      </CornerLabel>
    </button>
  );
}

/** Harita seçimi: önce bütün Türkiye, sonra yedi bölge; her biri bir oyun kartı (telefonda tek sütun). */
function ProvinceSetPicker({ onPick }: { onPick: (id: ProvinceSetId) => void }) {
  const { provinces: text, mapPuzzle: common } = messages();
  const shapes = useRegionShapes();
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 short:gap-2 lg:px-8 lg:pt-5">
      <div className="flex shrink-0 items-center gap-3">
        <Link aria-label={common.home} className={ROUND_BUTTON} href="/" title={common.home}>
          <BackArrow />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none font-bold lg:text-5xl">{text.title}</h1>
          <p className="mt-1 text-xs font-semibold text-cyan-100/75 short:hidden lg:text-base">{text.pickNote}</p>
        </div>
      </div>
      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-6">
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
          {PROVINCE_SETS.map((set) => (
            <li key={set.id}>
              <ProvinceSetCard onPick={onPick} set={set} shapes={shapes} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
