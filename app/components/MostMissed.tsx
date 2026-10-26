import Image from "next/image";
import { flagUrl, formatPlate, isCapitalChoice, isFlagChoice, isPlateChoice, locationName, type LocationStat, type PlayChoice } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { capitalOf } from "@/lib/world-capitals";

type MostMissedProps = {
  choice: PlayChoice;
  /** `undefined`: yükleniyor, `null`: yüklenemedi. */
  stats: LocationStat[] | null | undefined;
  /** Oyuncunun bu turda yanlış cevapladığı yerler; listede işaretlenir. */
  missedLocationIds: readonly string[];
  /** Kartın çerçevesi; sonuç ekranı kendi kart stilini verir. */
  className?: string;
  /** Listenin hangi moda ait olduğu (ör. "Bayrak"); sıralamada sekme değişince başlıkta görünür. */
  modeLabel?: string;
};

/** Sonuç ekranında, tüm oyuncuların yarış turlarında o modda en çok yanlış yaptığı yerler. */
export function MostMissed({ choice, stats, missedLocationIds, className = "", modeLabel }: MostMissedProps) {
  // İstatistik yüklenemezse bölüm hiç gösterilmez; turun sonucu bundan etkilenmez.
  if (stats === null) return null;

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
      <p className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-[0.2em] text-cyan-700 uppercase">
        {messages().mostMissed.title}
        {modeLabel && <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 tracking-normal normal-case">{modeLabel}</span>}
      </p>
      <p className="mt-1.5 text-sm text-slate-500">
        {messages().mostMissed.description}
      </p>

      {stats === undefined ? (
        <p className="py-10 text-center text-sm text-slate-500">{messages().mostMissed.loading}</p>
      ) : stats.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{messages().mostMissed.empty}</p>
      ) : (
        <ol className="mt-4 space-y-1.5">
          {stats.map((stat, index) => (
            // Solda sıra ve yer, yerin altında en çok neyle karıştırıldığı; sağda oran. Telefonda da tek satıra sığar.
            <li className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2 sm:px-4" key={stat.location_id}>
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
              <div className="min-w-0 flex-1">
                <p className="flex min-w-0 items-center gap-2 font-bold text-slate-900">
                  {showPlate && <span className="font-mono text-cyan-700 tabular-nums">{formatPlate(Number(stat.location_id))}</span>}
                  <span className="truncate">{askedName(stat.location_id)}</span>
                  {missedLocationIds.includes(stat.location_id) && (
                    <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">{messages().mostMissed.you}</span>
                  )}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {messages().mostMissed.confusedBefore}
                  <span className="font-semibold text-slate-700">{locationName(mode, stat.most_confused_with)}</span>
                  {messages().mostMissed.confusedAfter}
                </p>
              </div>
              <span className="shrink-0 text-right tabular-nums">
                <span className="text-base font-bold text-rose-600">{messages().result.percent(Math.round(Number(stat.wrong_rate) * 100))}</span>
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
