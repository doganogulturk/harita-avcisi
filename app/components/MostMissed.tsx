import Image from "next/image";
import { flagUrl, formatPlate, isFlagChoice, isPlateChoice, locationName, type LocationStat, type PlayChoice } from "@/lib/game";

type MostMissedProps = {
  choice: PlayChoice;
  /** `undefined`: yükleniyor, `null`: yüklenemedi. */
  stats: LocationStat[] | null | undefined;
  /** Oyuncunun bu turda yanlış cevapladığı yerler; listede işaretlenir. */
  missedLocationIds: readonly string[];
  /** Kartın çerçevesi; sonuç ekranı kendi kart stilini verir. */
  className?: string;
};

/** Sonuç ekranında, tüm oyuncuların yarış turlarında o modda en çok yanlış yaptığı yerler. */
export function MostMissed({ choice, stats, missedLocationIds, className = "" }: MostMissedProps) {
  // İstatistik yüklenemezse bölüm hiç gösterilmez; turun sonucu bundan etkilenmez.
  if (stats === null) return null;

  const { mode } = choice;
  const showPlate = isPlateChoice(choice);
  const showFlag = isFlagChoice(choice);

  return (
    <section className={`flex flex-col ${className}`}>
      <p className="text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">En çok yanlış yapılanlar</p>
      <p className="mt-1.5 text-sm text-slate-500">Tüm oyuncuların yarış turlarından, yanlış oranına göre.</p>

      {stats === undefined ? (
        <p className="py-10 text-center text-sm text-slate-500">Yükleniyor...</p>
      ) : stats.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Bu modda henüz yanlış cevap yok.</p>
      ) : (
        <ol className="mt-4 min-h-0 space-y-2 overflow-y-auto pr-1">
          {stats.map((stat, index) => (
            <li className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3" key={stat.location_id}>
              <span className="w-5 shrink-0 text-sm font-bold text-slate-400 tabular-nums">{index + 1}</span>
              {showFlag && (
                <Image
                  alt=""
                  className="h-6 w-auto shrink-0 rounded-[3px] border border-slate-200"
                  height={24}
                  src={flagUrl(stat.location_id)}
                  unoptimized
                  width={32}
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-bold text-slate-900">
                  {showPlate && <span className="font-mono text-cyan-700 tabular-nums">{formatPlate(Number(stat.location_id))}</span>}
                  <span className="truncate">{locationName(mode, stat.location_id)}</span>
                  {missedLocationIds.includes(stat.location_id) && (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Sen de</span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  En çok karıştırılan: {locationName(mode, stat.most_confused_with)}
                  {stat.confused_count > 1 && ` (${stat.confused_count} kez)`}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xl font-bold text-rose-600 tabular-nums">%{Math.round(Number(stat.wrong_rate) * 100)}</p>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {stat.wrong}/{stat.asked} yanlış
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
