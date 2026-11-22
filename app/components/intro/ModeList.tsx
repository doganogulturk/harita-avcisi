"use client";

import Image from "next/image";
import { PlateBadge } from "../GameTopBar";
import { BOARDS, flagUrl, type BoardId, type GameMode } from "@/lib/game";
import { messages } from "@/lib/i18n";
import { type ModeBoard } from "./ModeTiles";

/**
 * Bir grubun tek rengi: Türkiye kırmızı, Dünya mavi. Eskiden her mod kendi renkli karosunu taşıyordu ve beş ayrı renk göz
 * yoruyordu. Artık renk yalnızca grubu söyler; modlar görselleriyle (bayrak, plaka, dünya, başkent) ayrışır.
 */
const GROUP_TONE: Record<GameMode, { surface: string; icon: string; button: string; edge: string; header: string }> = {
  turkey: {
    surface: "border-rose-300/40 bg-rose-950/40",
    icon: "bg-rose-500/90",
    button: "bg-rose-500 text-white",
    edge: "#9f1239",
    header: "text-rose-200",
  },
  world: {
    surface: "border-sky-300/40 bg-sky-950/40",
    icon: "bg-sky-500/90",
    button: "bg-sky-500 text-white",
    edge: "#075985",
    header: "text-sky-200",
  },
};

/** Satırdaki görsel: Türk bayrağı, plaka, dünya, bayrak destesi ya da başkent binası. */
function RowVisual({ id }: { id: BoardId }) {
  if (id === "turkey") return <Image alt="" className="h-5 w-auto rounded-[3px] shadow-sm ring-1 ring-white/40" height={32} src={flagUrl("tr")} unoptimized width={48} />;
  if (id === "turkey-plates") return <PlateBadge plate={34} size="sm" />;
  if (id === "world-flags") {
    return (
      <span className="flex -space-x-2.5">
        {["br", "jp", "fr"].map((code, index) => (
          <Image
            alt=""
            className="h-[18px] w-auto rounded-[3px] shadow-sm ring-1 ring-white/50"
            height={32}
            key={code}
            src={flagUrl(code)}
            style={{ rotate: `${(index - 1) * 8}deg` }}
            unoptimized
            width={48}
          />
        ))}
      </span>
    );
  }
  if (id === "world-capitals") {
    return (
      <span aria-hidden="true" className="text-xl leading-none">
        🏛️
      </span>
    );
  }
  return (
    <svg aria-hidden="true" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  );
}

type ModeListProps = {
  map: GameMode;
  /** Gösterilecek modlar, sırayla; verilmeyen mod hiç çizilmez (ör. komşuluk seçiliyken Plakalar). */
  ids: BoardId[];
  /** Kaç yerden sorulduğu (satırın alt satırı). */
  countFor?: (id: BoardId) => number;
  /** Satır kullanılamıyorsa (harita yükleniyor) yazan neden; satır soluk ve kapalıdır. */
  disabledReasonFor?: (id: BoardId) => string | null;
  onPick: (board: ModeBoard) => void;
  /** Başlığın bir alt satırındaki eklenti (Dünya için kıta seçimi). Yan yana olunca dar ekranda taşıp kayıyordu; alt satırda sarmalanır. */
  belowTitle?: React.ReactNode;
  title: React.ReactNode;
};

/**
 * Oyna ve Antrenman'ın mod listesi: iPhone Ayarlar gibi tek bir kapta, ince çizgilerle ayrılmış satırlar. Her satırda solda
 * modun görseli, ortada adı ve kaç yerden sorulduğu, sağda **Başla** tuşu durur; satırın tamamı da dokunmayla başlatır
 * (küçük tuş tek hedef olsaydı dokunma alanı daralırdı). Grubun rengi tektir (Türkiye kırmızı, Dünya mavi).
 */
export function ModeList({ map, ids, countFor, disabledReasonFor, onPick, belowTitle, title }: ModeListProps) {
  const { setup } = messages();
  const tone = GROUP_TONE[map];
  const boards = BOARDS.filter((board) => ids.includes(board.id));

  return (
    <section aria-label={setup.maps[map]} className="flex min-w-0 flex-col gap-2 short:gap-1.5 lg:gap-3">
      <div className={`min-w-0 ${tone.header}`}>{title}</div>
      {belowTitle}
      <ul className={`overflow-hidden rounded-2xl border ${tone.surface} lg:rounded-3xl`} role="list">
        {boards.map((board, index) => {
          const reason = disabledReasonFor?.(board.id) ?? null;
          const count = countFor?.(board.id);
          return (
            <li className={index > 0 ? "border-t border-white/10" : ""} key={board.id}>
              <button
                className="group flex min-h-16 w-full min-w-0 cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-white transition hover:bg-white/5 focus-visible:bg-white/10 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55 short:min-h-12 short:py-1.5 lg:min-h-20 lg:gap-4 lg:px-5 lg:py-3"
                disabled={reason !== null}
                onClick={() => onPick(board)}
                type="button"
              >
                <span className={`flex h-11 w-16 shrink-0 items-center justify-center rounded-xl text-white short:h-9 short:w-16 lg:h-14 lg:w-20 ${tone.icon}`}>
                  <RowVisual id={board.id} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center">
                  <span className="truncate font-display text-lg leading-tight font-bold short:text-base lg:text-2xl">{setup.tiles[board.id]}</span>
                  {count !== undefined && <span className="truncate text-xs font-semibold text-white/65 lg:text-sm">{setup.tileCounts[board.id](count)}</span>}
                </span>
                {reason ? (
                  <span className="shrink-0 truncate rounded-lg bg-black/25 px-2 py-1 text-xs font-semibold lg:text-sm">{reason}</span>
                ) : (
                  <span
                    aria-hidden="true"
                    className={`press press-sm flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold max-[22.5rem]:px-2.5 lg:px-5 lg:py-2.5 lg:text-base ${tone.button}`}
                    style={{ "--press-edge": tone.edge } as React.CSSProperties}
                  >
                    <svg className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2Z" />
                    </svg>
                    <span className="max-[22.5rem]:hidden">{setup.start}</span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
