"use client";

import { useEffect, useRef } from "react";
import { useMapMarkup } from "@/lib/hooks/useMapMarkup";
import { LOCATION_SELECTOR, locationIdOf, type GameMode } from "@/lib/game";
import { continentLocationIds, isContinentScope, type WorldScope } from "@/lib/world-countries";

/**
 * Giriş ekranının ikinci adımında oynanacak haritayı gösterir. Kıta seçildiğinde o kıta vurgulanır;
 * harita yakınlaşmaz, kıtanın dünyadaki yeri olduğu gibi işaretlenir. Havuz seçimlerinde (Normal /
 * Tümü) vurgu yapılmaz: dağınık bir ülke kümesi haritada okunaklı bir şekil oluşturmuyor, o yüzden
 * kapsam yan paneldeki açıklamayla anlatılır.
 */
export function ScopePreviewMap({ mode, scope }: { mode: GameMode; scope: WorldScope }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { mapMarkup } = useMapMarkup(mode);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const highlighted = mode === "world" && isContinentScope(scope) ? continentLocationIds(scope) : null;
    container.querySelectorAll<SVGElement>(LOCATION_SELECTOR[mode]).forEach((location) => {
      location.classList.toggle("scope-active", highlighted?.has(locationIdOf(location, mode) ?? "") ?? false);
    });
  }, [mapMarkup, mode, scope]);

  if (!mapMarkup) return null;

  return <div aria-hidden="true" className="map-preview" dangerouslySetInnerHTML={{ __html: mapMarkup }} ref={containerRef} />;
}
