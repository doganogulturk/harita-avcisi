"use client";

import Image from "next/image";
import { PlateBadge } from "../GameTopBar";
import { BOARDS, flagUrl, type BoardId, type BoardVariant, type GameMode } from "@/lib/game";
import { messages } from "@/lib/i18n";

export type ModeBoard = { id: BoardId; mode: GameMode; variant: BoardVariant };

/** Her modun karo rengi ve basılınca inen kenarın rengi (globals.css, .press). */
const TILE_STYLE: Record<BoardId, { color: string; edge: string }> = {
  turkey: { color: "bg-rose-500 border-rose-300/60", edge: "#9f1239" },
  "turkey-plates": { color: "bg-blue-600 border-blue-300/50", edge: "#1e3a8a" },
  "world-hard": { color: "bg-sky-500 border-sky-200/60", edge: "#075985" },
  "world-flags": { color: "bg-teal-500 border-teal-200/60", edge: "#115e59" },
  "world-capitals": { color: "bg-indigo-500 border-indigo-200/60", edge: "#3730a3" },
};

/** Dikeyde Türkiye'nin iki modu bir satırda, dünyanın üç modu altında; alçak ve geniş ekranda beşi tek satırda. */
const TILE_SPAN: Record<GameMode, string> = {
  turkey: "col-span-3 short:col-span-1 lg:col-span-1",
  world: "col-span-2 short:col-span-1 lg:col-span-1",
};

/** Karonun sağ üstündeki görsel: Türk bayrağı, plaka, dünya, bayrak destesi ya da başkent binası. */
function TileVisual({ id, isCompact, isRow = false }: { id: BoardId; isCompact: boolean; isRow?: boolean }) {
  const flagSize = isCompact ? "h-4" : isRow ? "h-[18px]" : "h-6 lg:h-8";
  if (id === "turkey") return <Image alt="" className={`${flagSize} w-auto rounded-[3px] shadow-sm ring-1 ring-white/40`} height={32} src={flagUrl("tr")} unoptimized width={48} />;
  if (id === "turkey-plates") return isCompact ? <span className="rounded bg-white px-1 font-mono text-[10px] font-bold text-slate-900">34</span> : <PlateBadge plate={34} size="sm" />;
  if (id === "world-flags") {
    return (
      <span className={`flex ${isRow ? "-space-x-3" : "-space-x-2"}`}>
        {["br", "jp", "fr"].map((code, index) => (
          <Image
            alt=""
            className={`${flagSize} w-auto rounded-[3px] shadow-sm ring-1 ring-white/50`}
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
      <span aria-hidden="true" className={isCompact ? "text-base leading-none" : "text-2xl leading-none lg:text-4xl"}>
        🏛️
      </span>
    );
  }
  return (
    <svg aria-hidden="true" className={isCompact ? "h-4 w-4" : "h-7 w-7 lg:h-10 lg:w-10"} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z" />
    </svg>
  );
}

/** Sıralamanın birincisi; yarışta karonun üzerinde iki satır: ad, altında puan ve süre. */
export type TileLeader = { name: string; score: string; time: string };

type ModeTilesProps = {
  /** Karoya dokununca; tek başına oyunda tur başlar, düello ve odada mod seçilir. */
  onPick: (board: ModeBoard) => void;
  /** Gösterilecek modlar (Türkiye ya da Dünya bölümü); verilmezse beşi. */
  ids?: BoardId[];
  /** Büyük karoların ızgarası (sütun sayısı); bölüme göre değişir. */
  gridClass?: string;
  /** Kaç yerden sorulduğu (karonun alt satırı); verilmezse yazılmaz. */
  countFor?: (id: BoardId) => number;
  /** Sıralamanın birincisi (yarış); verilmezse ya da yoksa yazılmaz. */
  leaderFor?: (id: BoardId) => TileLeader | null;
  /** Seçili mod (düello ve oda); verilirse seçili olmayanlar soluk görünür. */
  selected?: BoardId;
  /** Karo kullanılamıyorsa (harita yükleniyor, bağlantı yok) üzerinde yazan neden. */
  disabledReasonFor?: (id: BoardId) => string | null;
  /** Ayar ekranının kartı içinde küçük karolar (düello ve oda). */
  isCompact?: boolean;
};

/**
 * Modlar renkli karolar olarak: İller, Plakalar (Türkiye), Ülkeler, Bayraklar, Başkentler (Dünya). Harita ve soru tipini
 * ayrı ayrı seçmek yerine tek dokunuş. Her karo kendi renginde, basılabilir bir oyun tuşudur. Büyük karolar (yarış ve
 * antrenman) dikey telefonda tam genişlikte satırlardır (solda görsel, ortada ad, sağda birinci); alçak ve geniş ekranda
 * kart olur. Küçük karolar (düello ve oda kartı) beşi bir arada, her ekranda kart biçimindedir.
 */
export function ModeTiles({ onPick, ids, gridClass, countFor, leaderFor, selected, disabledReasonFor, isCompact = false }: ModeTilesProps) {
  const { setup } = messages();
  const boards = ids ? BOARDS.filter((board) => ids.includes(board.id)) : BOARDS;
  return (
    <div
      aria-label={setup.pickModeFor}
      className={`grid ${isCompact ? "grid-cols-6 gap-1.5 short:grid-cols-5 lg:grid-cols-5 lg:gap-2" : `gap-3 short:gap-2 lg:gap-4 ${gridClass ?? "grid-cols-1"}`}`}
      role={selected ? "radiogroup" : undefined}
    >
      {boards.map((board) => {
        const style = TILE_STYLE[board.id];
        const disabledReason = disabledReasonFor?.(board.id) ?? null;
        const isSelected = selected === board.id;
        const isDimmed = selected !== undefined && !isSelected;
        const leader = disabledReason ? null : (leaderFor?.(board.id) ?? null);
        const count = countFor?.(board.id);
        const common = `press relative flex min-w-0 cursor-pointer overflow-hidden border-2 text-left text-white transition focus-visible:ring-4 focus-visible:ring-white/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${style.color} ${
          isDimmed ? "opacity-55 saturate-[0.6] hover:opacity-80" : ""
        } ${isSelected ? "ring-4 ring-amber-300" : ""}`;
        const buttonProps = {
          "aria-checked": selected ? isSelected : undefined,
          disabled: disabledReason !== null,
          onClick: () => onPick(board),
          role: selected ? "radio" : undefined,
          style: { "--press-edge": style.edge } as React.CSSProperties,
          type: "button" as const,
        };

        if (isCompact) {
          return (
            <button key={board.id} {...buttonProps} className={`${common} press-sm flex-col items-start rounded-xl px-2 py-1.5 ${TILE_SPAN[board.mode]}`}>
              <span className="flex w-full items-start justify-between gap-1">
                <span className="text-[9px] font-bold tracking-[0.12em] uppercase opacity-80">{setup.maps[board.mode]}</span>
                {/* Alçak ekranda karolar daralır; görsel adın yerini yemesin. */}
                <span className="short:hidden">
                  <TileVisual id={board.id} isCompact />
                </span>
              </span>
              <span className="max-w-full truncate font-display text-sm leading-tight font-bold">{setup.tiles[board.id]}</span>
            </button>
          );
        }

        return (
          <button
            key={board.id}
            {...buttonProps}
            className={`${common} items-center gap-3.5 rounded-2xl py-4 pr-3.5 pl-3 short:flex-col short:items-stretch short:gap-1 short:px-3 short:py-2.5 lg:min-h-64 lg:flex-col lg:items-stretch lg:gap-2 lg:rounded-3xl lg:px-6 lg:pt-5 lg:pb-6`}
          >
            {/* Satır düzeninde solda görsel kutusu; kart düzeninde görsel adın yanına, sağ üste geçer. */}
            <span className="flex h-14 w-16 shrink-0 items-center justify-center rounded-xl bg-white/15 short:hidden max-[22.5rem]:hidden lg:hidden">
              <TileVisual id={board.id} isCompact={false} isRow />
            </span>
            {/* Kart düzeninde görsel adın üstünde kendi satırındadır; yan yana dururken dar kartta adı kırpıyordu. */}
            <span className="hidden h-8 items-center short:flex short:h-6 lg:flex lg:h-10">
              <TileVisual id={board.id} isCompact={false} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-center self-stretch short:flex-none lg:flex-1 lg:justify-end">
              <span className="max-w-full truncate font-display text-2xl leading-tight font-bold max-[22.5rem]:text-xl short:text-lg lg:text-3xl 2xl:text-4xl">
                {setup.tiles[board.id]}
              </span>
              {count !== undefined && (
                <span className="truncate text-sm font-semibold whitespace-nowrap opacity-85 short:text-xs lg:mt-0.5 lg:text-base">{setup.tileCounts[board.id](count)}</span>
              )}
            </span>
            {disabledReason && (
              <span className="shrink-0 truncate rounded-xl bg-black/20 px-2.5 py-1 text-xs font-semibold lg:text-sm">{disabledReason}</span>
            )}
            {leader && (
              <span className="flex max-w-[44%] min-w-0 shrink-0 flex-col items-start rounded-xl bg-black/20 px-2.5 py-1.5 short:max-w-full short:py-1 lg:max-w-full lg:px-3 lg:py-2">
                <span className="flex max-w-full min-w-0 items-center gap-1 text-xs font-bold lg:text-sm">
                  <span aria-hidden="true">🏆</span>
                  <span className="min-w-0 truncate">{leader.name}</span>
                </span>
                <span className="text-[11px] font-semibold whitespace-nowrap tabular-nums opacity-85 lg:text-sm">
                  {leader.score} · {leader.time}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
