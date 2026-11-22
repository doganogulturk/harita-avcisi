import Image from "next/image";
import { flagUrl, formatPlate, isCapitalChoice, isFlagChoice, isPlateChoice, locationName, WEAK_SPOTS_MIN_PRACTICE, type PlayChoice, type WeakSpot } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { capitalOf } from "@/lib/world-capitals";

type WeakSpotsProps = {
  choice: PlayChoice;
  /** `undefined`: yükleniyor, `null`: yüklenemedi ya da giriş yok (bölüm gösterilmez), dizi: oyuncunun zayıf yerleri. */
  spots: WeakSpot[] | null | undefined;
  /** Kartın çerçevesi; sonuç ekranı kendi kart stilini verir. */
  className?: string;
  /** "Bunları çalış": antrenmanı bu yerlerle başlatır. */
  onPractice: (locationIds: string[]) => void;
};

/**
 * Sonuç ekranında oyuncunun kendi zayıf yerleri (my_weak_spots): bu modda en çok yanlış yaptığı yerler, her birinin
 * altında en çok neyle karıştırdığı. Altında "Bunları çalış" tuşu antrenmanı yalnızca bu yerlerle başlatır. Giriş yoksa ya
 * da liste yüklenemezse hiçbir şey çizilmez. Herkesin "en çok yanlış yapılanlar" listesinden ayrıdır: o, tüm oyuncuların.
 */
export function WeakSpots({ choice, spots, className = "", onPractice }: WeakSpotsProps) {
  // Giriş yok ya da liste yüklenemedi: bölüm hiç gösterilmez, turun sonucu bundan etkilenmez.
  if (spots === null) return null;

  const text = messages().weakSpots;
  const { mode } = choice;
  const showPlate = isPlateChoice(choice);
  const showFlag = isFlagChoice(choice);
  // Başkent turunda sorulan, başkenttir; yanında ülkesi.
  const askedName = (locationId: string) => {
    const capital = isCapitalChoice(choice) ? capitalOf(locationId) : undefined;
    return capital ? `${capital} · ${locationName(mode, locationId)}` : locationName(mode, locationId);
  };

  return (
    <section className={`flex flex-col ${className}`}>
      <p className="text-xs font-semibold tracking-[0.2em] text-rose-700 uppercase">{text.title}</p>
      <p className="mt-1.5 text-sm text-slate-500">{text.description}</p>

      {spots === undefined ? (
        <p className="py-6 text-center text-sm text-slate-500">{text.loading}</p>
      ) : spots.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{text.empty}</p>
      ) : (
        <>
          <ol className="mt-3 space-y-1.5">
            {spots.map((spot, index) => (
              <li className="flex items-center gap-3 rounded-xl bg-rose-50/70 px-3 py-2 sm:px-4" key={spot.location_id}>
                <span className="w-5 shrink-0 text-sm font-bold text-rose-300 tabular-nums">{index + 1}</span>
                {showFlag && (
                  <Image alt="" className="h-5 w-auto shrink-0 rounded-[3px] border border-slate-200" height={20} src={flagUrl(spot.location_id)} unoptimized width={27} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex min-w-0 items-center gap-2 font-bold text-slate-900">
                    {showPlate && <span className="font-mono text-cyan-700 tabular-nums">{formatPlate(Number(spot.location_id))}</span>}
                    <span className="truncate">{askedName(spot.location_id)}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">{text.confused(locationName(mode, spot.most_confused_with))}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-rose-600 tabular-nums">{text.wrongOf(spot.wrong, spot.asked)}</span>
              </li>
            ))}
          </ol>

          {spots.length >= WEAK_SPOTS_MIN_PRACTICE && (
            <button
              className="press press-sm mt-4 flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-amber-200/70 bg-amber-400 px-4 py-2.5 text-amber-950 [--press-edge:#b45309] focus-visible:ring-4 focus-visible:ring-amber-100 focus-visible:outline-none"
              onClick={() => onPractice(spots.map((spot) => spot.location_id))}
              type="button"
            >
              <span className="font-display text-lg leading-tight font-bold">{text.practice}</span>
              <span className="text-xs font-semibold opacity-80">{text.practiceNote(spots.length)}</span>
            </button>
          )}
        </>
      )}
    </section>
  );
}
