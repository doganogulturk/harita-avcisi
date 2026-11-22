import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DailyEntry } from "@/app/components/intro/ModeGrid";
import { type DailyStatus } from "@/lib/daily";

const none = () => {};
const doneAll: DailyStatus = {
  day: "d",
  streak: 1,
  started: [],
  results: [["turkey", "normal"], ["turkey", "plates"], ["world", "hard"], ["world", "flags"], ["world", "capitals"]].map(([mode, variant]) => ({
    game_mode: mode as "turkey" | "world",
    variant,
    score: 10,
    duration_ms: 50000,
    rank: 1,
    players: 1,
    answers: [],
  })),
};
const partial: DailyStatus = { ...doneAll, results: doneAll.results.slice(0, 2) };
const render = (status: DailyStatus | null, variant?: "inline" | "dock") => renderToStaticMarkup(createElement(DailyEntry, { status, onOpen: none, variant }));

describe("günlük giriş şeridinin nefesi", () => {
  it("oynanmamış mod varken akıştaki şerit nefes alır (büyür); durum yoksa da (hiçbiri oynanmamış)", () => {
    expect(render(partial)).toContain("daily-breathe");
    expect(render(null)).toContain("daily-breathe");
  });

  it("telefondaki alt şerit büyümez, yalnızca parlaklığı atar", () => {
    const dock = render(partial, "dock");
    expect(dock).toContain("daily-glow");
    expect(dock).not.toContain("daily-breathe");
  });

  it("beş mod da bitince şerit durur ve yeşil kalır", () => {
    for (const variant of ["inline", "dock"] as const) {
      const html = render(doneAll, variant);
      expect(html).not.toContain("daily-breathe");
      expect(html).not.toContain("daily-glow");
      expect(html).toContain("bg-emerald-600");
    }
  });
});
