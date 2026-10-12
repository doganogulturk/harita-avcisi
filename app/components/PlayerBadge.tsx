import Image from "next/image";
import { type Player } from "@/lib/game";

type PlayerBadgeProps = {
  player: Player | null;
  onSignOut: () => void;
  /** Verilirse "Çıkış yap"ın yanında "Hesabı sil" de çıkar; yalnızca ana menüde, oyun sırasında değil. */
  onDeleteAccount?: () => void;
  /** "right": ad solda, avatar sağda (ekran başlıkları). "left": avatar solda (oyun üst barı). */
  align?: "left" | "right";
  size?: "sm" | "md";
};

const AVATAR_SIZE = {
  sm: "h-7 w-7 lg:h-9 lg:w-9",
  md: "h-10 w-10",
};

const INITIAL_SIZE = {
  sm: "text-xs lg:text-sm",
  md: "text-base",
};

export function PlayerBadge({ player, onSignOut, onDeleteAccount, align = "right", size = "md" }: PlayerBadgeProps) {
  if (!player) return null;

  const avatar = player.avatarUrl ? (
    <Image
      alt=""
      className={`${AVATAR_SIZE[size]} shrink-0 rounded-full border border-cyan-200 object-cover`}
      height={40}
      referrerPolicy="no-referrer"
      src={player.avatarUrl}
      unoptimized
      width={40}
    />
  ) : (
    <span className={`${AVATAR_SIZE[size]} ${INITIAL_SIZE[size]} flex shrink-0 items-center justify-center rounded-full bg-cyan-100 font-bold text-cyan-700`}>
      {player.name.slice(0, 1).toUpperCase()}
    </span>
  );

  const linkClass = `font-semibold text-slate-400 underline-offset-2 transition hover:underline ${size === "sm" ? "text-[10px] lg:text-xs" : "text-xs"}`;

  const details = (
    <div className={`hidden min-w-0 sm:block ${align === "right" ? "text-right" : ""}`}>
      <p className={`max-w-[12rem] truncate font-bold text-slate-700 ${size === "sm" ? "text-xs lg:text-sm" : "text-sm"}`} title={player.name}>
        {player.name}
      </p>
      <button className={`${linkClass} hover:text-slate-600`} onClick={onSignOut} type="button">
        Çıkış yap
      </button>
      {onDeleteAccount && (
        <>
          <span aria-hidden="true" className={`text-slate-300 ${size === "sm" ? "text-[10px] lg:text-xs" : "text-xs"}`}>
            {" · "}
          </span>
          <button className={`${linkClass} hover:text-rose-600`} onClick={onDeleteAccount} type="button">
            Hesabı sil
          </button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex shrink-0 items-center gap-2 lg:gap-3">
      {align === "right" ? (
        <>
          {details}
          {avatar}
        </>
      ) : (
        <>
          {avatar}
          {details}
        </>
      )}
    </div>
  );
}
