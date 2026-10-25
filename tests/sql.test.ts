import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { CAPITALS } from "@/lib/world-capitals";

/**
 * Sunucu mantığının testleri: supabase/schema.sql, tarayıcıda çalışan gerçek bir PostgreSQL'e (PGlite) yüklenir.
 * Supabase'in auth şeması ve rolleri en küçük hâliyle taklit edilir; auth.uid() test.uid ayarından okunur.
 */
const S = "do_harita_avcisi";
const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
let db: PGlite;

const as = (uid: string) => db.exec(`select set_config('test.uid', '${uid}', false)`);
const rows = async <T = Record<string, unknown>>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows;
const rejects = async (sql: string, params: unknown[] = []) => {
  try {
    await db.query(sql, params);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
};
/** Turun başlangıcını geriye alır; "bu kadar kısa sürede bitirilemez" denetimine takılmasın. */
const ageRound = (id: string) => db.query(`update ${S}.game_rounds set started_at = now() - interval '60 seconds' where id = $1`, [id]);
/** İlk `correct` soru doğru; kalanlarda turun bir sonraki sorusuna tıklanmış sayılır (her haritada geçerli bir yer). */
const answersFor = (questions: string[], correct: number) =>
  JSON.stringify(questions.map((id, index) => ({ location: id, selected: index < correct ? id : questions[(index + 1) % questions.length] })));

type Started = { round_id: string; questions: string[] };

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon; create role authenticated; create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', is_anonymous boolean default false);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
    create publication supabase_realtime;
  `);
  await db.exec(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
  await db.exec(`insert into auth.users (id) values ('${A}'), ('${B}')`);
}, 60_000);

describe("yarış turu", () => {
  it("sorular sunucuda seçilir, puan ve seri cevaplardan hesaplanır", async () => {
    await as(A);
    const [{ r }] = await rows<{ r: Started }>(`select ${S}.start_ranked_round('world', 'hard') as r`);
    expect(r.questions).toHaveLength(10);
    expect(new Set(r.questions).size).toBe(10);
    await ageRound(r.round_id);
    await db.query(`select ${S}.finish_round($1, 50000, $2)`, [r.round_id, answersFor(r.questions, 7)]);
    const [result] = await rows<{ score: number; best_streak: number }>(`select score, best_streak from ${S}.game_results where user_id = $1 order by id desc limit 1`, [A]);
    expect(result).toEqual({ score: 7, best_streak: 7 });
  });

  it("uydurulmuş ya da sırası değiştirilmiş sorular reddedilir", async () => {
    const [{ r }] = await rows<{ r: Started }>(`select ${S}.start_ranked_round('turkey', 'plates') as r`);
    await ageRound(r.round_id);
    const fake = JSON.stringify(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((id) => ({ location: id, selected: id })));
    expect(await rejects(`select ${S}.finish_round($1, 50000, $2)`, [r.round_id, fake])).toBe("Geçersiz sonuç.");
    expect(await rejects(`select ${S}.finish_round($1, 50000, $2)`, [r.round_id, answersFor([...r.questions].reverse(), 10)])).toBe("Geçersiz sonuç.");
  });

  it("çok kısa sürede bitirilen tur reddedilir", async () => {
    const [{ r }] = await rows<{ r: Started }>(`select ${S}.start_ranked_round('turkey', 'normal') as r`);
    expect(await rejects(`select ${S}.finish_round($1, 5000, $2)`, [r.round_id, answersFor(r.questions, 10)])).toBe("Tur bu kadar kısa sürede bitirilemez.");
  });

  it("kaldırılmış ya da geçersiz tür açılamaz", async () => {
    expect(await rejects(`select ${S}.start_ranked_round('world', 'plates')`)).toContain("Geçersiz tur");
  });
});

describe("başkent turu", () => {
  it("sorular yalnızca başkenti listede olan ülkelerden seçilir", async () => {
    const [{ pool }] = await rows<{ pool: string[] }>(`select ${S}.duel_pool('world', 'capitals') as pool`);
    expect([...pool].sort()).toEqual(Object.keys(CAPITALS).sort());
  });

  it("yarış, düello ve oda başkent türünü kabul eder; 10/10 rozet kazandırır", async () => {
    const C = "33333333-3333-3333-3333-333333333333";
    await db.exec(`insert into auth.users (id) values ('${C}')`);
    await as(C);
    const [{ r }] = await rows<{ r: Started }>(`select ${S}.start_ranked_round('world', 'capitals') as r`);
    for (const id of r.questions) expect(CAPITALS[id], id).toBeTruthy();
    await ageRound(r.round_id);
    await db.query(`select ${S}.finish_round($1, 50000, $2)`, [r.round_id, answersFor(r.questions, 10)]);
    const [{ b }] = await rows<{ b: { id: string; is_new: boolean }[] }>(`select ${S}.my_badges() as b`);
    expect(b.find((badge) => badge.id === "perfect_capitals")?.is_new).toBe(true);
    expect(await rejects(`select ${S}.duel_check_settings('world', 'capitals', 'snatch')`)).toBeNull();
    expect(await rejects(`select ${S}.duel_check_settings('turkey', 'capitals', 'snatch')`)).toBe("Geçersiz düello ayarı.");
  });
});

describe("günlük meydan okuma", () => {
  it("herkese aynı sorular, her mod günde bir kez", async () => {
    await as(A);
    const [{ r: first }] = await rows<{ r: Started }>(`select ${S}.start_daily_round('world', 'flags') as r`);
    await as(B);
    const [{ r: second }] = await rows<{ r: Started }>(`select ${S}.start_daily_round('world', 'flags') as r`);
    expect(second.questions).toEqual(first.questions);
    expect(await rejects(`select ${S}.start_daily_round('world', 'flags')`)).toBe("Bugünün meydan okumasını oynadın.");
  });

  it("sonuç günlük sıralamaya düşer, seri bugün sayılır", async () => {
    await as(B);
    const [{ r }] = await rows<{ r: Started }>(`select ${S}.start_daily_round('turkey', 'normal') as r`);
    await ageRound(r.round_id);
    await db.query(`select ${S}.finish_round($1, 50000, $2)`, [r.round_id, answersFor(r.questions, 9)]);
    const leaders = await rows<{ score: number }>(`select score from ${S}.daily_leaderboard where game_mode = 'turkey' and variant = 'normal'`);
    expect(leaders.map((leader) => leader.score)).toEqual([9]);
    const [{ d }] = await rows<{ d: { streak: number; results: { answers: boolean[] }[] } }>(`select ${S}.my_daily() as d`);
    expect(d.streak).toBe(1);
    expect(d.results[0].answers.filter(Boolean)).toHaveLength(9);
  });

  it("başkent beşinci meydan okumadır; tam gün beşini de ister", async () => {
    await as(A);
    for (const [mode, variant] of [["turkey", "normal"], ["turkey", "plates"], ["world", "hard"], ["world", "capitals"]]) {
      const [{ r }] = await rows<{ r: Started }>(`select ${S}.start_daily_round($1, $2) as r`, [mode, variant]);
      await ageRound(r.round_id);
      await db.query(`select ${S}.finish_round($1, 50000, $2)`, [r.round_id, answersFor(r.questions, 5)]);
      const [{ b }] = await rows<{ b: { id: string; earned_at: string | null }[] }>(`select ${S}.my_badges() as b`);
      expect(b.find((badge) => badge.id === "daily_full")?.earned_at ?? null, variant).toBeNull();
    }
  });
});

describe("rozetler", () => {
  it("hak edilen rozet bir kez verilir ve yeni olarak işaretlenir", async () => {
    await as(B);
    const [{ b: first }] = await rows<{ b: { id: string; is_new: boolean; earned_at: string | null }[] }>(`select ${S}.my_badges() as b`);
    const earned = first.filter((badge) => badge.earned_at).map((badge) => badge.id);
    expect(earned).toContain("daily_first");
    expect(first.filter((badge) => badge.is_new).map((badge) => badge.id).sort()).toEqual(earned.sort());
    const [{ b: second }] = await rows<{ b: { is_new: boolean }[] }>(`select ${S}.my_badges() as b`);
    expect(second.some((badge) => badge.is_new)).toBe(false);
  });
});
