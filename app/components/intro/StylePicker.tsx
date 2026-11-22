"use client";

import { messages } from "@/lib/i18n";
import {
  setAnswerStyle,
  setChooseStyleSeen,
  setNeighborsStyleSeen,
  useAnswerStyle,
  useChooseStyleSeen,
  useNeighborsStyleSeen,
  type AnswerStyle,
} from "@/lib/intro-preferences";

type StyleOption = { id: AnswerStyle; label: string; hint: string };

/** Her kartın küçük çizimi: dokunma, şıklar, komşular. Çizimler küçük ve durağandır; kartın anlamını bir bakışta verir. */
function StyleGlyph({ id }: { id: AnswerStyle }) {
  const common = { "aria-hidden": true, className: "h-7 w-7 lg:h-9 lg:w-9", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.8, viewBox: "0 0 24 24" } as const;
  if (id === "tap") {
    // Parmak işareti: haritaya dokunma
    return (
      <svg {...common}>
        <path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V11m0-.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-.5a6 6 0 0 1-4.7-2.3L4 15.5a1.5 1.5 0 0 1 2.3-1.9L9 16" />
      </svg>
    );
  }
  if (id === "choose") {
    // Dört şık: 2×2 kare, biri dolu
    return (
      <svg {...common}>
        <rect height="7" rx="1.6" width="7" x="3.5" y="3.5" />
        <rect fill="currentColor" height="7" rx="1.6" width="7" x="13.5" y="3.5" />
        <rect height="7" rx="1.6" width="7" x="3.5" y="13.5" />
        <rect height="7" rx="1.6" width="7" x="13.5" y="13.5" />
      </svg>
    );
  }
  // Komşuluk: ortada bir nokta ve çevresinde komşular
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <circle cx="12" cy="4.5" r="1.7" />
      <circle cx="19" cy="9" r="1.7" />
      <circle cx="17" cy="18.5" r="1.7" />
      <circle cx="7" cy="18.5" r="1.7" />
      <circle cx="5" cy="9" r="1.7" />
      <path d="M12 9V6.2M14.8 11l2.9-1.2M13.4 14.7l2.1 2.6M10.6 14.7l-2.1 2.6M9.2 11 6.3 9.8" />
    </svg>
  );
}

/**
 * Oyna ve Antrenman ayar ekranının en üstündeki soru biçimi seçicisi: üç büyük kart (Haritaya dokun, Şıklı, Komşuluk). Eskiden
 * küçük bir pil satırıydı ve ayar olduğu anlaşılmıyordu. Kartlar bir simge, başlık ve tek satır açıklama taşır; seçili olan oyunun
 * renginde doldurulur. Şıklı ve Komşuluk'ta, oyuncu o biçimi bir kez seçene kadar "YENİ" rozeti görünür (yalnızca cihazda bir bayrak).
 * Seçim hatırlanır (useAnswerStyle) ve bundan sonraki turlara taşınır.
 */
export function StylePicker({ selectedClass, isSaved }: { selectedClass: string; isSaved: boolean }) {
  const { setup } = messages();
  const style = useAnswerStyle();
  const isChooseSeen = useChooseStyleSeen();
  const isNeighborsSeen = useNeighborsStyleSeen();

  const options: StyleOption[] = [
    { id: "tap", label: setup.styleTap, hint: setup.styleTapShort },
    { id: "choose", label: setup.styleChoose, hint: setup.styleChooseShort },
    { id: "neighbors", label: setup.styleNeighbors, hint: setup.styleNeighborsShort },
  ];

  const pick = (id: AnswerStyle) => {
    setAnswerStyle(id);
    if (id === "choose") setChooseStyleSeen();
    if (id === "neighbors") setNeighborsStyleSeen();
  };

  return (
    <section aria-labelledby="style-picker" className="shrink-0">
      <h3 className="mb-2 text-sm font-bold text-cyan-100 lg:mb-3 lg:text-lg" id="style-picker">
        {setup.answerStyle}
      </h3>
      {/* Sütun sayısı kartın en küçük genişliğine (rem) göre belirlenir: normal yazıda üç sütun, telefonda büyük yazı ayarı açıkken iki ya da bir
          sütun. Kart başlığı böylece kelime ortasından bölünmez ve hiçbir yazı kırpılmaz. */}
      <div aria-labelledby="style-picker" className="grid grid-cols-[repeat(auto-fit,minmax(5.5rem,1fr))] gap-2 lg:gap-4" role="radiogroup">
        {options.map((option) => {
          const isSelected = style === option.id;
          const isNew = (option.id === "choose" && !isChooseSeen) || (option.id === "neighbors" && !isNeighborsSeen);
          return (
            <button
              aria-checked={isSelected}
              className={`relative flex min-w-0 cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 px-1.5 pt-3 pb-2.5 text-center transition focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:outline-none short:flex-row short:justify-center short:gap-2 short:px-2 short:py-1.5 lg:gap-2 lg:rounded-3xl lg:px-3 lg:pt-5 lg:pb-4 ${
                isSelected ? `${selectedClass} shadow-lg` : "border-white/20 bg-white/5 text-white/85 hover:border-white/50 hover:bg-white/10"
              }`}
              key={option.id}
              onClick={() => pick(option.id)}
              role="radio"
              type="button"
            >
              {isNew && (
                <span className="absolute -top-2 right-1.5 rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase shadow-sm lg:-top-2.5 lg:right-3 lg:text-xs">
                  {setup.styleNew}
                </span>
              )}
              <StyleGlyph id={option.id} />
              {/* Başlık kırpılmaz, gerekirse iki satıra iner ("Haritaya dokun"); kartlar aynı satırda eşit yükseklikte kalır. */}
              <span className="max-w-full font-display text-sm leading-tight font-bold break-words max-[22.5rem]:text-xs lg:text-xl">{option.label}</span>
              {/* Açıklama yalnızca yeterli yer varsa: dar telefonda başlık ve simge yeter, alçak ekranda tek satır. */}
              <span className="hidden max-w-full text-xs leading-snug opacity-80 min-[26rem]:block short:hidden lg:text-sm">{option.hint}</span>
            </button>
          );
        })}
      </div>
      {/* Kartlardaki kısa açıklama dar ekranda gizlidir; seçili biçimin açıklaması bu satırda görünür. Oyna'da komşuluk seçiliyken bu satır
          her ekranda durur: o turun kaydedilmediğini söyler (Oyna'nın öbür turları kaydedilir). */}
      <p className={`mt-2 text-xs text-cyan-100/70 lg:text-sm ${style === "neighbors" && isSaved ? "" : "min-[26rem]:hidden"}`}>
        {style === "neighbors" ? (isSaved ? setup.styleNeighborsRankedHint : setup.styleNeighborsHint) : style === "choose" ? setup.styleChooseHint : setup.styleTapHint}
      </p>
    </section>
  );
}
