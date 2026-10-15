/** Sekmenin ve (giriş kartlarında) onun yer tutucusunun ortak ölçüleri; ikisi aynı boyda olsun diye tek yerde. */
export const CORNER_TAB_SIZE = "gap-1.5 py-2 pr-4 pl-4 text-sm short:py-1.5 short:pr-3 short:pl-3.5 lg:py-3 lg:pr-6 lg:pl-6 lg:text-base";

type CornerTabProps = {
  label: string;
  /** Zemin ve yazı rengi (oyunun `theme.badge` sınıfı); içbükey kıvrımlar da aynı zemini alır. */
  colorClass: string;
  onClick: () => void;
  disabled?: boolean;
  /**
   * Aynı işi yapan başka bir tuşun görünen yüzüyse (giriş kartında kartın tamamı tuştur) klavye ve ekran okuyucudan
   * gizlenir.
   */
  isDecorative?: boolean;
};

/**
 * Uygulamanın eylem tuşu: kartın ya da panelin sağ üst köşesinden içeri kıvrılan sekme. Köşesi yuvarlak ve
 * `overflow-hidden` bir kabın sağ üstüne konur; kabın yuvarlaklığı sekmenin dış köşesini kırpar, iki yanındaki içbükey
 * kıvrımlar (globals.css, .corner-fillet) sekmeyi kabın üst ve sağ kenarına bağlar.
 */
export function CornerTab({ label, colorClass, onClick, disabled = false, isDecorative = false }: CornerTabProps) {
  return (
    <div className={`relative z-10 shrink-0 transition-opacity ${disabled ? "opacity-50" : ""}`}>
      <button
        aria-hidden={isDecorative || undefined}
        className={`group/action pill-shine relative flex cursor-pointer items-center rounded-bl-2xl font-bold transition duration-200 group-hover:gap-2.5 hover:gap-2.5 hover:brightness-110 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none focus-visible:ring-inset active:brightness-95 disabled:cursor-wait disabled:hover:gap-1.5 disabled:hover:brightness-100 lg:rounded-bl-3xl ${CORNER_TAB_SIZE} ${colorClass}`}
        disabled={disabled}
        onClick={onClick}
        tabIndex={isDecorative ? -1 : undefined}
        type="button"
      >
        {label}
        {!disabled && (
          <svg
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover/action:translate-x-1 lg:h-5 lg:w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <span aria-hidden="true" className={`corner-fillet top-0 right-full ${colorClass}`} />
      <span aria-hidden="true" className={`corner-fillet top-full right-0 ${colorClass}`} />
    </div>
  );
}
