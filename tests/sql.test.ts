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
const ageRound = (id: string, seconds = 60) =>
  db.query(`update ${S}.game_rounds set started_at = now() - make_interval(secs => $2) where id = $1`, [id, seconds]);
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

  it("serbest turda 3 saniyelik gösterim beklenmez; günlük turda aynı süre reddedilir", async () => {
    const D = "44444444-4444-4444-4444-444444444444";
    await db.exec(`insert into auth.users (id) values ('${D}')`);
    await as(D);
    // 10 soru 10 saniyede: gösterim bekleyen eski kural (en az 30 sn) bunu reddederdi.
    const [{ r: free }] = await rows<{ r: Started }>(`select ${S}.start_ranked_round('turkey', 'normal') as r`);
    await ageRound(free.round_id, 10);
    expect(await rejects(`select ${S}.finish_round($1, 10000, $2)`, [free.round_id, answersFor(free.questions, 10)])).toBeNull();
    const [saved] = await rows<{ score: number; duration_ms: number }>(`select score, duration_ms from ${S}.game_results where user_id = $1 order by id desc limit 1`, [D]);
    expect(saved).toEqual({ score: 10, duration_ms: 10000 });
    // Aynı süre günlük meydan okumada hile sayılır: orada her cevaptan sonra 3 saniye beklenir.
    const [{ r: daily }] = await rows<{ r: Started }>(`select ${S}.start_daily_round('world', 'capitals') as r`);
    await ageRound(daily.round_id, 10);
    expect(await rejects(`select ${S}.finish_round($1, 10000, $2)`, [daily.round_id, answersFor(daily.questions, 10)])).toBe("Tur bu kadar kısa sürede bitirilemez.");
    await as(A);
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

describe("kod alanı", () => {
  it("kod düelloya ya da odaya götürür; bilinmeyen kod boş döner", async () => {
    await as(A);
    const [{ duel }] = await rows<{ duel: string }>(`select ${S}.create_duel('world', 'capitals', 'snatch') as duel`);
    const [{ room }] = await rows<{ room: string }>(`select ${S}.create_room('Cuma', 'turkey', 'normal', 3, 30, 10) as room`);
    await db.exec(`select set_config('test.uid', '', false)`);
    const kind = async (code: string) => (await rows<{ kind: string | null }>(`select ${S}.code_kind($1) as kind`, [code]))[0].kind;
    expect(await kind(duel)).toBe("duel");
    expect(await kind(` ${room.toLowerCase()} `)).toBe("room");
    expect(await kind("ZZZZZZ")).toBeNull();
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

  /** Kullanıcıyı ekler, günün meydan okumasını oynatır ve (isteğe bağlı) turu `seconds` saniye önce başlamış sayar. */
  const playDaily = async (uid: string, mode: string, variant: string, correct: number, seconds = 60) => {
    await as(uid);
    const [{ r }] = await rows<{ r: Started }>(`select ${S}.start_daily_round($1, $2) as r`, [mode, variant]);
    await ageRound(r.round_id, seconds);
    await db.query(`select ${S}.finish_round($1, $2, $3)`, [r.round_id, seconds * 1000, answersFor(r.questions, correct)]);
  };
  const earnedBadges = async (uid: string) => {
    await as(uid);
    const [{ b }] = await rows<{ b: { id: string; earned_at: string | null }[] }>(`select ${S}.my_badges() as b`);
    return b.filter((badge) => badge.earned_at).map((badge) => badge.id);
  };

  it("kürsü ve zirve günün sıralamasından gelir; o gün modu en az 3 oyuncu bitirmiş olmalı", async () => {
    const [E, F, G, P, Q] = [
      "55555555-5555-5555-5555-555555555555",
      "66666666-6666-6666-6666-666666666666",
      "77777777-7777-7777-7777-777777777777",
      "88888888-8888-8888-8888-888888888888",
      "99999999-9999-9999-9999-999999999999",
    ];
    await db.exec(`insert into auth.users (id) values ${[E, F, G, P, Q].map((id) => `('${id}')`).join(", ")}`);
    // Plaka günlüğünü üç kişi bitirir: E birinci, F ikinci, G üçüncü.
    await playDaily(E, "turkey", "plates", 10);
    await playDaily(F, "turkey", "plates", 8);
    await playDaily(G, "turkey", "plates", 6);
    expect(await earnedBadges(E)).toEqual(expect.arrayContaining(["podium", "summit"]));
    expect(await earnedBadges(F)).toContain("podium");
    expect(await earnedBadges(F)).not.toContain("summit");
    expect(await earnedBadges(G)).toContain("podium");
    // Bayrak günlüğünü yalnızca iki kişi bitirir: birinci olmak kürsü ya da zirve saymaz.
    await playDaily(P, "world", "flags", 9);
    await playDaily(Q, "world", "flags", 4);
    expect(await earnedBadges(P)).not.toEqual(expect.arrayContaining(["podium"]));
    expect(await earnedBadges(P)).not.toContain("summit");
  });

  it("şimşek yalnızca günün meydan okumasında kazanılır; serbest turda 10 saniyede 10/10 yetmez", async () => {
    const D = "44444444-4444-4444-4444-444444444444";
    // D, serbest turda 10 saniyede 10/10 yapmıştı (yarış turu testi).
    expect(await earnedBadges(D)).not.toContain("lightning");
    // Aynı süre günlükte mümkün değil; 40 saniye mümkün ve 45'in altında.
    await playDaily(D, "turkey", "normal", 10, 40);
    expect(await earnedBadges(D)).toContain("lightning");
  });
});

describe("zayıf yerler", () => {
  type Spot = { location_id: string; asked: number; wrong: number; most_confused_with: string; last_at: string };
  const U = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const V = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  /** Bir sonuç satırı açar ve cevapları doğrudan ekler: zamanı ve sonucu tam kontrol etmek için. */
  const addAnswers = async (uid: string, mode: string, variant: string, answers: { location: string; selected: string; daysAgo?: number }[]) => {
    const [{ id }] = await rows<{ id: number }>(
      `insert into ${S}.game_results (user_id, game_mode, variant, score, duration_ms, best_streak) values ($1, $2, $3, 0, 60000, 0) returning id`,
      [uid, mode, variant],
    );
    for (const [index, answer] of answers.entries()) {
      await db.query(
        `insert into ${S}.round_answers (result_id, user_id, game_mode, variant, position, location_id, selected_id, is_correct, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, now() - make_interval(days => $9))`,
        [id, uid, mode, variant, index % 10, answer.location, answer.selected, answer.location === answer.selected, answer.daysAgo ?? 0],
      );
    }
  };
  const weak = async (uid: string, mode = "turkey", variant = "normal", limit?: number) => {
    await as(uid);
    const [{ w }] = await rows<{ w: Spot[] }>(`select ${S}.my_weak_spots($1, $2, $3) as w`, [mode, variant, limit ?? 10]);
    return w;
  };

  beforeAll(async () => {
    await db.exec(`insert into auth.users (id) values ('${U}'), ('${V}')`);
  });

  it("en çok yanlış yapılan yer önde; hiç yanlışı olmayan yer listeye girmez", async () => {
    await addAnswers(U, "turkey", "normal", [
      { location: "38", selected: "58" }, { location: "38", selected: "58" }, { location: "38", selected: "38" },
      { location: "6", selected: "6" }, { location: "6", selected: "6" },
      { location: "34", selected: "35" },
    ]);
    const spots = await weak(U);
    expect(spots.map((spot) => spot.location_id)).toEqual(["38", "34"]);
    expect(spots[0]).toMatchObject({ asked: 3, wrong: 2, most_confused_with: "58" });
    expect(spots.some((spot) => spot.location_id === "6")).toBe(false);
  });

  it("az sorulan yer çok sorulanın önüne geçmez (Wilson ölçüsü, herkesin listesiyle aynı)", async () => {
    // 34: 1/1 yanlış; 38: 6/7 yanlış. 38 öne çıkar.
    await addAnswers(V, "turkey", "normal", [
      { location: "34", selected: "35" },
      ...Array.from({ length: 6 }, () => ({ location: "38", selected: "58" })),
      { location: "38", selected: "38" },
    ]);
    const spots = await weak(V);
    expect(spots.map((spot) => spot.location_id)).toEqual(["38", "34"]);
  });

  it("eski cevaplar yarım ağırlıkla sayılır: oyuncu öğrendikçe liste yeni yanlışlara döner", async () => {
    // 10 ve 20 aynı sayıda yanlış (3/3); 10'unkiler 90 gün önce, 20'ninkiler bugün. 20 öne geçer.
    await addAnswers(U, "turkey", "plates", [
      ...Array.from({ length: 3 }, () => ({ location: "10", selected: "11", daysAgo: 90 })),
      ...Array.from({ length: 3 }, () => ({ location: "20", selected: "21", daysAgo: 0 })),
    ]);
    const spots = await weak(U, "turkey", "plates");
    expect(spots.map((spot) => spot.location_id)).toEqual(["20", "10"]);
  });

  it("yalnızca kendi cevaplarını görür; başka oyuncunun cevapları ve başka mod karışmaz", async () => {
    await addAnswers(V, "world", "flags", [{ location: "fr", selected: "de" }]);
    expect((await weak(U, "world", "flags")).length).toBe(0);
    expect((await weak(V, "world", "flags")).map((spot) => spot.location_id)).toEqual(["fr"]);
  });

  it("limit uygulanır ve 50 ile sınırlanır", async () => {
    await addAnswers(U, "world", "hard", Array.from({ length: 12 }, (_, i) => ({ location: ["tr", "fr", "de", "it", "es", "gr", "pt", "nl", "be", "at", "ch", "se"][i], selected: "us" })));
    expect((await weak(U, "world", "hard", 5)).length).toBe(5);
    expect((await weak(U, "world", "hard", 500)).length).toBe(12);
    expect((await weak(U, "world", "hard", 0)).length).toBe(1); // en az 1
  });

  it("giriş yoksa ve geçersiz modda reddeder; tarayıcı tabloya doğrudan erişemez", async () => {
    await db.exec("select set_config('test.uid', '', false)");
    expect(await rejects(`select ${S}.my_weak_spots('turkey', 'normal', 5)`)).toBe("Zayıf yerler için giriş gerekir.");
    await as(U);
    expect(await rejects(`select ${S}.my_weak_spots('turkey', 'hard', 5)`)).toContain("Geçersiz mod");
    expect(await rejects(`select ${S}.my_weak_spots('mars', 'normal', 5)`)).toContain("Geçersiz mod");
  });
});
