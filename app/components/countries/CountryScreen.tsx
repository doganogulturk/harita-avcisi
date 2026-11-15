"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DarkSystemBars } from "../NativeSystemBars";
import { MapPuzzle } from "../map-puzzle/MapPuzzle";
import { SetCard, SetPicker } from "../map-puzzle/SetPicker";
import { COUNTRY_SETS, countriesOf, countryMapMarkup, WORLD_MAP_URL, type CountrySetId } from "@/lib/countries-puzzle";
import { BACK_PRIORITY, useBackHandler } from "@/lib/hooks/useBackHandler";
import { messages } from "@/lib/i18n";
import { type Continent } from "@/lib/world-countries";

/**
 * /ulkeler: önce harita seçilir (bütün dünya ya da bir kıta), sonra o haritanın ülkeleriyle "Haritayı tamamla"
 * oynanır. Tur kaydedilmez (İller ve İlçeler gibi).
 */
export function CountryScreen() {
  const [setId, setSetId] = useState<CountrySetId | null>(null);
  // Android geri tuşu turdan harita seçimine döner; seçimde sayfanın kendi geçmişi işler.
  useBackHandler(() => setSetId(null), BACK_PRIORITY.screen, setId !== null);

  return (
    <main className="safe-area sea-backdrop flex h-[100dvh] flex-col text-white">
      <DarkSystemBars />
      {setId === null ? <CountrySetPicker onPick={setSetId} /> : <CountryPuzzle id={setId} key={setId} onBack={() => setSetId(null)} />}
    </main>
  );
}

function setName(id: CountrySetId) {
  const { countries, continents } = messages();
  return id === "all" ? countries.all : continents[id];
}

/** Haritanın bütün ülkeleriyle Haritayı tamamla; harita dünya haritasından tarayıcıda çıkarılır. */
function CountryPuzzle({ id, onBack }: { id: CountrySetId; onBack: () => void }) {
  const { countries } = messages();
  const pieces = useMemo(() => countriesOf(id), [id]);
  const text = useMemo(() => ({ ...countries, count: countries.countryCount }), [countries]);
  const transformMap = useCallback((svg: string) => countryMapMarkup(svg, id), [id]);
  return <MapPuzzle mapUrl={WORLD_MAP_URL} onBack={onBack} pieces={pieces} text={text} title={setName(id)} transformMap={transformMap} />;
}

/** Kıtanın etiket rengi; kart silüetinde kıta beyaz, dünyanın geri kalanı soluk. */
const CONTINENT_STYLE: Record<Continent, { color: string; text: string }> = {
  europe: { color: "#6366f1", text: "text-white" },
  asia: { color: "#f43f5e", text: "text-white" },
  africa: { color: "#f97316", text: "text-white" },
  america: { color: "#059669", text: "text-white" },
};

type WorldShapes = { viewBox: string; paths: [code: string, d: string][] };
let shapesCache: WorldShapes | null = null;

/** Kart silüetleri oyunun dünya haritasından (zaten önbellekte olabilir); gelmezse kartlar silüetsiz görünür. */
function useWorldShapes() {
  const [shapes, setShapes] = useState<WorldShapes | null>(shapesCache);
  useEffect(() => {
    if (shapesCache) return;
    let isActive = true;
    fetch(WORLD_MAP_URL)
      .then((response) => (response.ok ? response.text() : null))
      .then((svg) => {
        if (!svg) return;
        const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? "0 0 1000 500";
        // Parçalı ülkelerin <g id> içindeki yolları ülkenin kodunu alır.
        const paths: [string, string][] = [];
        const body = svg.replace(/<g id="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g, (_, code: string, inner: string) => {
          for (const [, d] of inner.matchAll(/ d="([^"]+)"/g)) paths.push([code, d]);
          return "";
        });
        for (const [, code, d] of body.matchAll(/<path id="([^"]+)" d="([^"]+)"/g)) paths.push([code, d]);
        shapesCache = { viewBox, paths };
        if (isActive) setShapes(shapesCache);
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, []);
  return shapes;
}

/** Harita seçimi: önce bütün dünya, sonra kıtalar. */
function CountrySetPicker({ onPick }: { onPick: (id: CountrySetId) => void }) {
  const { countries: text } = messages();
  const shapes = useWorldShapes();
  return (
    <SetPicker note={text.pickNote} title={text.title}>
      {COUNTRY_SETS.map((set) => {
        const style = set.id === "all" ? undefined : CONTINENT_STYLE[set.id];
        return (
          <SetCard
            color={style?.color}
            count={text.countryCount(set.codes.size)}
            key={set.id}
            name={setName(set.id)}
            onPick={() => onPick(set.id)}
            textClass={style?.text}
            viewBox={shapes?.viewBox}
          >
            {shapes?.paths.map(([code, d], index) => (
              <path d={d} fill="#fff" fillOpacity={set.id === "all" || set.codes.has(code) ? 0.92 : 0.18} key={index} />
            ))}
          </SetCard>
        );
      })}
    </SetPicker>
  );
}
