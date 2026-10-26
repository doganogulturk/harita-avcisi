/** Sekmenin ve (giriş kartlarında) onun yer tutucusunun ortak ölçüleri; ikisi aynı boyda olsun diye tek yerde. */
export const CORNER_TAB_SIZE = "gap-1.5 py-2 pr-4 pl-4 text-sm short:py-1.5 short:pr-3 short:pl-3.5 lg:py-3 lg:pr-6 lg:pl-6 lg:text-base";

/** Büyük sekme: giriş kartlarındaki oyun sekmeleri (Yarış, Antrenman...); simge, oyun yazı tipiyle ad ve ok. */
const CORNER_TAB_SIZE_LG =
  "gap-2 py-2.5 pr-5 pl-4 font-display text-lg short:py-1.5 short:pr-4 short:pl-3 short:text-base max-[25rem]:gap-1.5 max-[25rem]:pr-3.5 max-[25rem]:pl-3 max-[25rem]:text-base lg:gap-2.5 lg:py-3.5 lg:pr-7 lg:pl-6 lg:text-2xl";

/** Küçük sekme: kartın ikincil işi (Sıralamayı gör, Kodla katıl). Dokunmatikte dokunma alanı dikeyde 44 piksele genişler. */
const CORNER_TAB_SIZE_SM = "hit-area-y gap-1 py-1.5 pr-3.5 pl-3 text-xs lg:gap-1.5 lg:py-2 lg:pr-5 lg:pl-4 lg:text-sm";

/**
 * Köşeye göre sekmenin içe bakan köşesinin yuvarlaklığı ve iki içbükey kıvrımın yeri. Sağ üstte kıvrımlar sekmenin
 * solunda (üst kenarda) ve altında (sağ kenarda); sol altta üstünde (sol kenarda) ve sağında (alt kenarda); sağ altta
 * üstünde (sağ kenarda) ve solunda (alt kenarda) durur.
 */
const CORNERS = {
  "top-right": {
    md: "rounded-bl-2xl lg:rounded-bl-3xl",
    lg: "rounded-bl-2xl lg:rounded-bl-3xl",
    sm: "rounded-bl-xl lg:rounded-bl-2xl",
    fillets: ["top-0 right-full", "top-full right-0"],
    filletClass: "",
  },
  "bottom-left": {
    md: "rounded-tr-2xl lg:rounded-tr-3xl",
    lg: "rounded-tr-2xl lg:rounded-tr-3xl",
    sm: "rounded-tr-xl lg:rounded-tr-2xl",
    fillets: ["bottom-full left-0", "bottom-0 left-full"],
    filletClass: "corner-fillet-bl",
  },
  "bottom-right": {
    md: "rounded-tl-2xl lg:rounded-tl-3xl",
    lg: "rounded-tl-2xl lg:rounded-tl-3xl",
    sm: "rounded-tl-xl lg:rounded-tl-2xl",
    fillets: ["bottom-full right-0", "bottom-0 right-full"],
    filletClass: "corner-fillet-br",
  },
};

type CornerTabProps = {
  label: string;
  /** Zemin ve yazı rengi (oyunun `theme.badge` ya da `theme.soft` sınıfı). */
  colorClass: string;
  /** İçbükey kıvrımların dolgusu, zeminle aynı renk (`theme.badgeFill` / `theme.softFill`). */
  fillClass: string;
  onClick: () => void;
  /** Sekmenin oturduğu köşe; asıl iş sağ üstte, ikincil iş sol altta. Giriş kartlarında iki oyun alt köşelerdedir. */
  corner?: keyof typeof CORNERS;
  size?: "md" | "sm" | "lg";
  /** Yazının solundaki simge; verilmezse yazının sağında ileri oku durur (büyük sekmede ikisi birlikte). */
  icon?: React.ReactNode;
  disabled?: boolean;
  /**
   * Aynı işi yapan başka bir tuşun görünen yüzüyse (giriş kartında kartın tamamı tuştur) klavye ve ekran okuyucudan
   * gizlenir.
   */
  isDecorative?: boolean;
  /**
   * Sekme kabın kenarı boyunca uzar (giriş kartlarında iki oyun sekmesi kartın ortasında buluşur): yazı dış köşede durur,
   * kabın içine bakan kenardaki kıvrım çizilmez.
   */
  stretch?: boolean;
};

/**
 * Uygulamanın eylem tuşu: kartın ya da panelin köşesinden içeri kıvrılan sekme. Köşesi yuvarlak ve taşmayı kırpan bir
 * kabın köşesine konur; kabın yuvarlaklığı sekmenin dış köşesini kırpar, iki yanındaki içbükey kıvrımlar
 * (globals.css, .corner-fillet) sekmeyi kabın iki kenarına bağlar.
 */
export function CornerTab({ label, colorClass, fillClass, onClick, corner = "top-right", size = "md", icon, disabled = false, isDecorative = false, stretch = false }: CornerTabProps) {
  const shape = CORNERS[corner];
  const filletClass = `corner-fillet ${size === "sm" ? "corner-fillet-sm" : ""} ${shape.filletClass} ${fillClass}`;
  return (
    <div className={`relative z-10 shrink-0 transition-opacity ${disabled ? "opacity-50" : ""} ${stretch ? "w-full" : ""}`}>
      <button
        aria-hidden={isDecorative || undefined}
        className={`group/action pill-shine relative flex cursor-pointer items-center font-bold whitespace-nowrap transition duration-200 hover:brightness-110 focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none focus-visible:ring-inset active:brightness-95 disabled:cursor-wait disabled:hover:brightness-100 ${
          icon ? "" : "group-hover:gap-2.5 hover:gap-2.5 disabled:hover:gap-1.5"
        } ${shape[size]} ${size === "sm" ? CORNER_TAB_SIZE_SM : size === "lg" ? CORNER_TAB_SIZE_LG : CORNER_TAB_SIZE} ${
          stretch ? `w-full ${corner.endsWith("right") ? "justify-end" : "justify-start"}` : ""
        } ${colorClass}`}
        disabled={disabled}
        onClick={onClick}
        tabIndex={isDecorative ? -1 : undefined}
        type="button"
      >
        {icon}
        {label}
        {(!icon || size === "lg") && !disabled && (
          <svg
            aria-hidden="true"
            className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover/action:translate-x-1 lg:h-5 lg:w-5 ${size === "lg" ? "max-[22.5rem]:hidden" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      <Fillet className={`${filletClass} ${shape.fillets[0]}`} />
      {!stretch && <Fillet className={`${filletClass} ${shape.fillets[1]}`} />}
    </div>
  );
}

/**
 * Köşeye yapışık süs (giriş kartlarındaki oyun simgesi): sekmelerle aynı biçimde sol üst köşeden içeri kıvrılır ama tuş
 * değildir; tıklama alttaki kart tuşuna geçer. Boyu kabın `--tile` değişkeninden gelir; içerik onun yanından akar.
 */
export function CornerTile({ colorClass, fillClass, children }: { colorClass: string; fillClass: string; children: React.ReactNode }) {
  const filletClass = `corner-fillet corner-fillet-tl ${fillClass}`;
  return (
    <div aria-hidden="true" className="pointer-events-none relative">
      <div className={`flex h-(--tile) w-(--tile) items-center justify-center rounded-br-2xl lg:rounded-br-3xl ${colorClass}`}>{children}</div>
      <Fillet className={`${filletClass} top-0 left-full`} />
      <Fillet className={`${filletClass} top-full left-0`} />
    </div>
  );
}

/**
 * İçbükey kıvrım: kenarları çeyrek daireyle oyulmuş küçük kare; dolu kalan köşe sağ üst. Diğer köşeler için CSS'te
 * döndürülür (globals.css, .corner-fillet-bl / -tl). SVG ile çizilir: aynı şekil maske (radial-gradient) ile
 * çizildiğinde Safari karenin kenarında ince bir çizgi bırakıyordu.
 */
function Fillet({ className }: { className: string }) {
  return (
    <svg aria-hidden="true" className={className} preserveAspectRatio="none" viewBox="0 0 16 16">
      <path d="M0 0H16V16A16 16 0 0 0 0 0Z" />
    </svg>
  );
}
