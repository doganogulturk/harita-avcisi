const LOGO_SIZES = {
  header: {
    row: "gap-2.5 lg:gap-3.5",
    badge: "h-10 w-10 rounded-2xl short:h-9 short:w-9 short:rounded-xl lg:h-12 lg:w-12",
    icon: "h-6 w-6 lg:h-7 lg:w-7",
    text: "text-3xl short:text-2xl lg:text-4xl",
  },
  curtain: {
    row: "gap-4 lg:gap-6",
    badge: "h-16 w-16 rounded-3xl short:h-12 short:w-12 short:rounded-2xl lg:h-24 lg:w-24",
    icon: "h-10 w-10 short:h-8 short:w-8 lg:h-14 lg:w-14",
    text: "text-5xl short:text-3xl lg:text-7xl",
  },
};

/**
 * Oyunun adı ve nişangah rozeti. Giriş ekranında açılış animasyonuyla belirir; animasyon sınıfları
 * yalnızca data-intro taşıyan bir kapsayıcının içinde çalıştığı için başka ekranlarda durağandır.
 */
export function Logo({ size = "header", isHeading = true }: { size?: keyof typeof LOGO_SIZES; isHeading?: boolean }) {
  const style = LOGO_SIZES[size];
  const Tag = isHeading ? "h1" : "p";
  return (
    <Tag className={`flex items-center ${style.row}`}>
      <span
        aria-hidden="true"
        className={`intro-lock flex shrink-0 items-center justify-center bg-cyan-50 text-cyan-700 ${style.badge}`}
      >
        {/* Nişangah: "avcı" ve haritada bir yeri hedefleme. */}
        <svg className={style.icon} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7" />
          <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
          <circle cx="12" cy="12" fill="currentColor" r="1.5" stroke="none" />
        </svg>
      </span>
      <span className={`intro-reveal font-display leading-none font-bold tracking-[-0.03em] text-slate-900 ${style.text}`}>
        harita <span className="text-cyan-700">avcısı</span>
      </span>
    </Tag>
  );
}
