// Düello sorularını sunucu seçer; bunun için soru havuzlarının bir kopyası supabase/schema.sql içinde durur.
// Bu betik havuzları lib/world-countries.ts'ten okuyup schema.sql'deki işaretli bloğa yazar, böylece iki liste
// birbirinden ayrılmaz. Ülke listesi değişince çalıştırın: node scripts/generate-duel-pools.mjs
import { readFileSync, writeFileSync } from "node:fs";

const countriesSource = readFileSync(new URL("../lib/world-countries.ts", import.meta.url), "utf8");
const countries = [...countriesSource.matchAll(/\{ code: "([a-z]{2})", name: "[^"]+", tier: "(common|rare)" \}/g)].map(
  ([, code, tier]) => ({ code, tier }),
);
if (countries.length === 0) throw new Error("lib/world-countries.ts içinde ülke bulunamadı.");

const sqlArray = (codes) => {
  const lines = [];
  for (let index = 0; index < codes.length; index += 16) {
    lines.push("      " + codes.slice(index, index + 16).map((code) => `'${code}'`).join(", "));
  }
  return `array[\n${lines.join(",\n")}\n    ]`;
};

const common = countries.filter((country) => country.tier === "common").map((country) => country.code);
const all = countries.map((country) => country.code);

const block = `-- duel_pool:başla (scripts/generate-duel-pools.mjs üretir; elle düzenlemeyin)
-- Düello sorularının seçildiği havuzlar. Türkiye'de 81 il (plaka), dünyada lib/world-countries.ts'teki
-- Normal havuzu (${common.length} ülke) ya da tamamı (${all.length} ülke); Bayrak düellosu tamamından sorulur.
create or replace function public.duel_pool(p_game_mode text, p_variant text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case
    when p_game_mode = 'turkey' then array(select plate::text from generate_series(1, 81) as plate)
    when p_variant = 'normal' then ${sqlArray(common)}
    else ${sqlArray(all)}
  end;
$$;
-- duel_pool:bitir`;

const schemaUrl = new URL("../supabase/schema.sql", import.meta.url);
const schema = readFileSync(schemaUrl, "utf8");
const pattern = /-- duel_pool:başla[\s\S]*?-- duel_pool:bitir/;
if (!pattern.test(schema)) throw new Error("schema.sql içinde duel_pool bloğu bulunamadı.");
writeFileSync(schemaUrl, schema.replace(pattern, () => block));
console.log(`duel_pool güncellendi: ${common.length} Normal, ${all.length} toplam ülke.`);
