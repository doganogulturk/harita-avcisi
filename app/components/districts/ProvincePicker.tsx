"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { compareTr, DISTRICT_PROVINCES, PROVINCE_SHAPES_URL, type DistrictProvince } from "@/lib/districts";
import { currentLocale, messages } from "@/lib/i18n";
import { REGIONS, type RegionId } from "@/lib/turkish-regions";

type SortId = "name" | "plate" | "region" | "difficulty";
const SORTS: SortId[] = ["name", "plate", "region", "difficulty"];
const SORT_KEY = "harita-avcisi:district-sort";

/**
 * Bölgenin rengi: kartın sağ üstündeki bölge etiketinde ve bölge sıralamasındaki başlığın noktasında. Kartın kendisi
 * saydamdır; renk yalnızca bölgeyi söyler.
 */
const REGION_STYLE: Record<RegionId, { color: string; text: string; dot: string }> = {
  marmara: { color: "#0ea5e9", text: "text-white", dot: "bg-sky-500" },
  ege: { color: "#6366f1", text: "text-white", dot: "bg-indigo-500" },
  akdeniz: { color: "#f97316", text: "text-white", dot: "bg-orange-500" },
  icAnadolu: { color: "#fbbf24", text: "text-amber-950", dot: "bg-amber-400" },
  karadeniz: { color: "#059669", text: "text-white", dot: "bg-emerald-600" },
  doguAnadolu: { color: "#7c3aed", text: "text-white", dot: "bg-violet-600" },
  guneydogu: { color: "#f43f5e", text: "text-white", dot: "bg-rose-500" },
};

/** Plaka, ad ve ilçe sayısı etiketlerinin rengi: denizin koyu tonu; saydam kartın üstünde okunur. */
const LABEL_COLOR = "#072a42";

type Shapes = Record<string, [viewBox: string, d: string]>;
let shapesCache: Shapes | null = null;

/** İl silüetleri tek dosyada (~23 KB); bir kez indirilir. Gelmezse kartlar silüetsiz görünür. */
function useProvinceShapes() {
  const [shapes, setShapes] = useState<Shapes | null>(shapesCache);
  useEffect(() => {
    if (shapesCache) return;
    let isActive = true;
    fetch(PROVINCE_SHAPES_URL)
      .then((response) => (response.ok ? (response.json() as Promise<Shapes>) : null))
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

function sortProvinces(list: DistrictProvince[], sort: SortId) {
  const byName = (a: DistrictProvince, b: DistrictProvince) => compareTr(a.name, b.name);
  if (sort === "plate") return [...list].sort((a, b) => a.plate - b.plate);
  if (sort === "difficulty") return [...list].sort((a, b) => a.count - b.count || byName(a, b));
  return [...list].sort(byName);
}

/** Kartta ilin adının boyu: kısa adlar büyük, uzun adlar (Kahramanmaraş, Afyonkarahisar) kademeli küçük. */
function nameSize(name: string) {
  if (name.length <= 8) return "text-xl lg:text-2xl";
  if (name.length <= 11) return "text-lg lg:text-xl";
  return "text-base tracking-tight";
}

type Corner = "tl" | "tr" | "bl" | "br";

/** İçbükey kıvrımın dolu köşesi sağ üstte çizilir; diğer köşeler için aynalanır ya da döndürülür. */
const FILLET_TRANSFORM: Record<Corner, string> = { tr: "none", tl: "scaleX(-1)", br: "scaleY(-1)", bl: "rotate(180deg)" };

/** Etiketin iki yanındaki kıvrımların yeri (kartın iki kenarı boyunca) ve etiketin yuvarlak iç köşesi. */
const CORNER_LAYOUT: Record<Corner, { place: string; radius: string; fillets: [string, string] }> = {
  tl: { place: "top-0 left-0", radius: "rounded-br-[14px]", fillets: ["top-0 left-full", "top-full left-0"] },
  tr: { place: "top-0 right-0", radius: "rounded-bl-[14px]", fillets: ["top-0 right-full", "top-full right-0"] },
  bl: { place: "bottom-0 left-0", radius: "rounded-tr-[14px]", fillets: ["bottom-0 left-full", "bottom-full left-0"] },
  br: { place: "bottom-0 right-0", radius: "rounded-tl-[14px]", fillets: ["bottom-0 right-full", "bottom-full right-0"] },
};

/**
 * Kartın köşesine oturan etiket: bölgenin koyu tonunda, iç köşesi yuvarlak; iki yanındaki içbükey kıvrımlar onu kartın
 * kenarlarına bağlar (oyun kartlarındaki köşe sekmeleri gibi). Kartın yuvarlak dış köşesi etiketin dış köşesini kırpar.
 */
function CornerLabel({ corner, color, className = "", children }: { corner: Corner; color: string; className?: string; children: React.ReactNode }) {
  const layout = CORNER_LAYOUT[corner];
  return (
    <span className={`absolute z-10 flex items-center ${layout.place} ${layout.radius} ${className}`} style={{ backgroundColor: color }}>
      {children}
      {layout.fillets.map((place) => (
        <svg aria-hidden="true" className={`pointer-events-none absolute h-3.5 w-3.5 ${place}`} key={place} preserveAspectRatio="none" style={{ transform: FILLET_TRANSFORM[corner] }} viewBox="0 0 16 16">
          <path d="M16 0V16A16 16 0 0 0 0 0Z" fill={color} />
        </svg>
      ))}
    </span>
  );
}

/**
 * Bir il kartı: saydam, denizin üstünde cam gibi; ortada ilin beyaz silüeti. Dört köşede içbükey etiketler: sol üstte
 * plaka, sağ üstte bölgenin renginde coğrafi bölge, sol altta ilin adı, sağ altta ilçe sayısı.
 */
function ProvinceCard({
  province,
  shape,
  showRegion,
  onPick,
}: {
  province: DistrictProvince;
  shape?: [string, string];
  /** Bölge sıralamasında bölge zaten başlıkta yazar; kartta gösterilmez. */
  showRegion: boolean;
  onPick: (plate: number) => void;
}) {
  const { districts: text } = messages();
  const style = REGION_STYLE[province.region];
  return (
    <button
      aria-label={`${province.name}, ${text.regions[province.region]}, ${text.districtCount(province.count)}`}
      className="relative block h-36 w-full cursor-pointer overflow-hidden rounded-2xl border-2 border-white/15 bg-white/[0.07] text-left text-white transition hover:bg-white/[0.12] active:scale-[0.98] focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none sm:h-40 lg:h-44"
      onClick={() => onPick(province.plate)}
      type="button"
    >
      {/* İlin silüeti kartın ortasında; köşe etiketlerine değmez. */}
      {shape && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-x-[16%] top-[17%] bottom-[22%] h-[61%] w-[68%] drop-shadow-[0_2px_0_rgb(0_0_0/0.18)]" preserveAspectRatio="xMidYMid meet" viewBox={shape[0]}>
          <path d={shape[1]} fill="#fff" fillOpacity={0.9} fillRule="evenodd" />
        </svg>
      )}
      <CornerLabel className="px-3 py-1 font-mono text-sm font-bold text-white tabular-nums" color={LABEL_COLOR} corner="tl">
        {String(province.plate).padStart(2, "0")}
      </CornerLabel>
      {showRegion && (
        <CornerLabel className={`px-3 py-1 text-[11px] font-bold tracking-wide uppercase lg:text-xs ${style.text}`} color={style.color} corner="tr">
          {text.regions[province.region]}
        </CornerLabel>
      )}
      <CornerLabel className={`max-w-[68%] px-3 pt-1.5 pb-1 font-display leading-tight font-bold text-white ${nameSize(province.name)}`} color={LABEL_COLOR} corner="bl">
        <span className="truncate">{province.name}</span>
      </CornerLabel>
      <CornerLabel className="px-3 py-1.5 text-sm font-bold whitespace-nowrap text-white tabular-nums" color={LABEL_COLOR} corner="br">
        {text.districtCount(province.count)}
      </CornerLabel>
    </button>
  );
}

/**
 * İl seçimi: her il bir oyun kartı (telefonda tek sütun). Üstte arama ve sıralama: A–Z, plaka, bölge (bölge
 * başlıklarıyla gruplu) ve ilçe sayısı (azdan çoğa). Seçilen sıralama
 * tarayıcıda hatırlanır.
 */
export function ProvincePicker({ onPick }: { onPick: (plate: number) => void }) {
  const { districts: text } = messages();
  const shapes = useProvinceShapes();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortId>("name");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SORT_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- tarayıcı belleği yalnızca çizimden sonra okunabilir.
      if (stored && (SORTS as string[]).includes(stored)) setSort(stored as SortId);
    } catch {
      // Depolama kapalı; varsayılan sıra.
    }
  }, []);

  const chooseSort = (next: SortId) => {
    setSort(next);
    try {
      localStorage.setItem(SORT_KEY, next);
    } catch {
      // Depolama kapalı; seçim bu sayfa açık kaldıkça geçerli.
    }
  };

  const search = query.trim().toLocaleLowerCase("tr");
  const matching = DISTRICT_PROVINCES.filter((province) => province.name.toLocaleLowerCase("tr").includes(search) || String(province.plate) === search);
  const sorted = sortProvinces(matching, sort);
  const groups =
    sort === "region"
      ? // Bölgeler arayüz dilindeki adlarına göre alfabetik (Türkçede Akdeniz başta, Marmara sonda).
        [...REGIONS]
          .sort((a, b) => text.regions[a.id].localeCompare(text.regions[b.id], currentLocale()))
          .map((region) => ({ id: region.id as RegionId | null, items: sorted.filter((province) => province.region === region.id) }))
          .filter((group) => group.items.length > 0)
      : [{ id: null as RegionId | null, items: sorted }];

  const grid = (items: DistrictProvince[]) => (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-4 xl:grid-cols-5">
      {items.map((province) => (
        <li key={province.plate}>
          <ProvinceCard onPick={onPick} province={province} shape={shapes?.[province.plate]} showRegion={sort !== "region"} />
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 short:gap-2 lg:px-8 lg:pt-5">
      <div className="flex shrink-0 items-center gap-3">
        <Link
          aria-label={text.home}
          className="hit-area flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/25 text-white/85 transition hover:border-white/60 hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none"
          href="/"
          title={text.home}
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-none font-bold lg:text-5xl">{text.title}</h1>
          <p className="mt-1 text-xs font-semibold text-cyan-100/75 short:hidden lg:text-base">{text.pickProvinceNote}</p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
        <input
          aria-label={text.searchProvince}
          autoComplete="off"
          className="h-11 w-full shrink-0 rounded-2xl border-2 border-white/20 bg-white/10 px-4 text-base font-semibold text-white placeholder:text-white/50 focus:border-cyan-300 focus:outline-none short:h-9 sm:max-w-xs"
          enterKeyHint="search"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={text.searchProvince}
          type="search"
          value={query}
        />
        <div aria-label={text.sortBy} className="no-scrollbar flex gap-1.5 overflow-x-auto" role="radiogroup">
          {SORTS.map((id) => (
            <button
              aria-checked={sort === id}
              className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:outline-none short:py-1 short:text-xs ${
                sort === id ? "border-amber-300 bg-amber-400 text-amber-950" : "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
              }`}
              key={id}
              onClick={() => chooseSort(id)}
              role="radio"
              type="button"
            >
              {text.sorts[id]}
            </button>
          ))}
        </div>
      </div>

      <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-6">
        {matching.length === 0 && <p className="py-6 text-center text-sm font-semibold text-cyan-100/70">{text.noProvince}</p>}
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section aria-label={group.id ? text.regions[group.id] : undefined} key={group.id ?? "all"}>
              {group.id && (
                <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold lg:text-2xl">
                  <span aria-hidden="true" className={`h-3 w-3 rounded-full ring-2 ring-white/40 ${REGION_STYLE[group.id].dot}`} />
                  {text.regions[group.id]}
                  <span aria-hidden="true" className="h-px flex-1 bg-white/15" />
                  <span className="shrink-0 text-cyan-100/70">{text.provinceCount(group.items.length)}</span>
                </h2>
              )}
              {grid(group.items)}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
