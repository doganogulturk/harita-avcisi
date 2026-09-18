export type PlayButtonTone = "green" | "red";

const BASE =
  "sweep inline-flex items-center gap-1.5 rounded-full py-2 pr-3 pl-4 text-sm font-bold lg:py-2.5 lg:pr-4 lg:pl-5 lg:text-base text-slate-800 shadow-sm transition-all duration-200 hover:gap-3 hover:shadow-md active:scale-95 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-50 disabled:hover:gap-1.5 disabled:hover:shadow-sm";

const TONE: Record<PlayButtonTone, string> = {
  green: "sweep-green hover:text-emerald-700 hover:shadow-emerald-500/20 focus-visible:ring-emerald-300",
  red: "sweep-red hover:text-rose-700 hover:shadow-rose-500/20 focus-visible:ring-rose-300",
};

const BADGE_TONE: Record<PlayButtonTone, string> = {
  green: "bg-emerald-500",
  red: "bg-rose-500",
};

type PlayButtonProps = {
  label: string;
  /**
   * Tuşun sağ üst köşesindeki rozet: sayı verilirse bildirim sayısı gibi renkli bir hap,
   * başka bir öğe (ör. bayrak) verilirse olduğu gibi çizilir.
   */
  badge?: number | React.ReactNode;
  /** Rozetin ekran okuyucuya okunan karşılığı, ör. "58 ülke". */
  badgeLabel?: string;
  tone?: PlayButtonTone;
  disabled?: boolean;
  onClick: () => void;
};

export function PlayButton({ label, badge, badgeLabel, tone = "green", disabled = false, onClick }: PlayButtonProps) {
  return (
    // Tuş, dönen ışık için taşanı kestiğinden rozet tuşun içine değil yanına, ortak kapsayıcıya konur.
    <span className="relative inline-flex">
      <button className={`${BASE} ${TONE[tone]}`} disabled={disabled} onClick={onClick} type="button">
        {label}
        {badgeLabel && <span className="sr-only">, {badgeLabel}</span>}
        <svg aria-hidden="true" className="h-4 w-4 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {badge !== undefined && (
        <span aria-hidden="true" className={`pointer-events-none absolute -top-2 -right-1.5 ${disabled ? "opacity-50" : ""}`}>
          {typeof badge === "number" ? (
            <span
              className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold text-white tabular-nums shadow-sm ring-2 ring-white ${BADGE_TONE[tone]}`}
            >
              {badge}
            </span>
          ) : (
            badge
          )}
        </span>
      )}
    </span>
  );
}
