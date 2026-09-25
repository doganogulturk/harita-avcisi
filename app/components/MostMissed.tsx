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
      <p className="mt-1.5 text-sm text-slate-500">Tüm oyuncuların yarış turlarından, yanlış oranına göre (yanlış / sorulma).</p>

      {stats === undefined ? (
        <p className="py-10 text-center text-sm text-slate-500">Yükleniyor...</p>
      ) : stats.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Bu modda henüz yanlış cevap yok.</p>
      ) : (
        <ol className="mt-4 space-y-1.5">
          {stats.map((stat, index) => (
            // Tek satır: yer ve rozet solda, en çok karıştırıldığı yer ortada, oran sağda.
            // Dar ekranda ortadaki bilgi kısalır, yerin adı ve oran kesilmez.
            <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 sm:px-4" key={stat.location_id}>
              <span className="w-5 shrink-0 text-sm font-bold text-slate-400 tabular-nums">{index + 1}</span>
              {showFlag && (
                <Image
                  alt=""
                  className="h-5 w-auto shrink-0 rounded-[3px] border border-slate-200"
                  height={20}
                  src={flagUrl(stat.location_id)}
                  unoptimized
                  width={27}
                />
              )}
              <span className="flex shrink-0 items-center gap-2 font-bold text-slate-900">
                {showPlate && <span className="font-mono text-cyan-700 tabular-nums">{formatPlate(Number(stat.location_id))}</span>}
                {locationName(mode, stat.location_id)}
                {missedLocationIds.includes(stat.location_id) && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">Sen de</span>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-right text-xs text-slate-500">
                En çok karıştırılan: <span className="font-semibold text-slate-700">{locationName(mode, stat.most_confused_with)}</span>
                {stat.confused_count > 1 && ` (${stat.confused_count} kez)`}
              </span>
              <span className="w-24 shrink-0 text-right tabular-nums">
                <span className="text-base font-bold text-rose-600">%{Math.round(Number(stat.wrong_rate) * 100)}</span>
                <span className="ml-1.5 text-xs text-slate-500">
                  {stat.wrong}/{stat.asked}
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
