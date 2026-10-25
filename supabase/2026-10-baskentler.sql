-- Tek seferlik geçiş: Başkent modu (variant 'capitals'). Supabase SQL Editor'da bir kez çalıştırın. Kalıcı tanım
-- supabase/schema.sql'dedir; işi bitince bu dosya silinebilir. Mevcut verilere dokunmaz.
--
-- Başkent turlarında başkentin adı sorulur, oyuncu ülkeyi bulur; sorular başkenti lib/world-capitals.ts'te olan
-- ülkelerden seçilir. Yarış, günlük meydan okuma (beşinci mod), düello ve oda bu türü kabul eder.

begin;

-- Tablolardaki tür kısıtı: eski adı ne olursa olsun variant kısıtı kaldırılıp yeni listeyle eklenir.
do $$
declare
  v_table text;
  v_constraint text;
begin
  foreach v_table in array array['game_results', 'game_rounds', 'duels', 'rooms'] loop
    for v_constraint in
      select conname from pg_constraint
      where conrelid = ('do_harita_avcisi.' || v_table)::regclass and contype = 'c' and pg_get_constraintdef(oid) like '%variant%'
    loop
      execute format('alter table do_harita_avcisi.%I drop constraint %I', v_table, v_constraint);
    end loop;
    execute format(
      'alter table do_harita_avcisi.%I add constraint %I check (variant in (''normal'', ''hard'', ''flags'', ''plates'', ''capitals''))',
      v_table, v_table || '_variant_check'
    );
  end loop;
end;
$$;

-- duel_pool:başla (scripts/generate-duel-pools.mjs üretir; elle düzenlemeyin)
-- Düello sorularının seçildiği havuzlar. Türkiye'de 81 il (plaka), dünyada lib/world-countries.ts'teki
-- Normal havuzu (58 ülke) ya da tamamı (179 ülke); Bayrak düellosu tamamından, Başkent düellosu
-- lib/world-capitals.ts'te başkenti olan 174 ülkeden sorulur.
create or replace function do_harita_avcisi.duel_pool(p_game_mode text, p_variant text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select case
    when p_game_mode = 'turkey' then array(select plate::text from generate_series(1, 81) as plate)
    when p_variant = 'normal' then array[
      'de', 'us', 'ar', 'au', 'at', 'az', 'be', 'ae', 'gb', 'br', 'bg', 'cz', 'cn', 'dk', 'id', 'ma',
      'ph', 'fi', 'fr', 'za', 'kr', 'hr', 'in', 'nl', 'iq', 'ir', 'ie', 'es', 'se', 'ch', 'it', 'jp',
      'ca', 'kz', 'ke', 'co', 'cu', 'hu', 'mx', 'eg', 'ng', 'no', 'pk', 'pe', 'pl', 'pt', 'ro', 'ru',
      'sa', 'cl', 'th', 'tr', 'ua', 'uy', 've', 'vn', 'nz', 'gr'
    ]
    when p_variant = 'capitals' then array[
      'af', 'de', 'us', 'ao', 'ar', 'al', 'au', 'at', 'az', 'bs', 'bd', 'by', 'be', 'bz', 'bj', 'ae',
      'gb', 'bo', 'ba', 'bw', 'br', 'bn', 'bg', 'bf', 'bi', 'bt', 'cv', 'dz', 'dj', 'td', 'cz', 'cn',
      'dk', 'cd', 'do', 'dm', 'ec', 'gq', 'sv', 'id', 'er', 'am', 'ee', 'sz', 'et', 'ma', 'ci', 'ph',
      'fi', 'fr', 'ga', 'gm', 'gh', 'gn', 'gw', 'gt', 'gy', 'za', 'kr', 'ss', 'ge', 'ht', 'hr', 'in',
      'nl', 'hn', 'iq', 'ir', 'ie', 'es', 'se', 'ch', 'it', 'is', 'jm', 'jp', 'kh', 'cm', 'ca', 'me',
      'qa', 'kz', 'ke', 'cy', 'kg', 'co', 'km', 'cg', 'cr', 'kw', 'kp', 'mk', 'cu', 'la', 'ls', 'lv',
      'lr', 'ly', 'lt', 'lb', 'lu', 'hu', 'mg', 'mw', 'mv', 'my', 'ml', 'mt', 'mu', 'mx', 'eg', 'mn',
      'md', 'mr', 'mz', 'mm', 'na', 'np', 'ne', 'ng', 'ni', 'no', 'cf', 'uz', 'pk', 'pa', 'pg', 'py',
      'pe', 'pl', 'pt', 'ro', 'rw', 'ru', 'lc', 'vc', 'st', 'sn', 'sc', 'rs', 'sl', 'sg', 'sk', 'si',
      'sb', 'so', 'lk', 'sd', 'sr', 'sy', 'sa', 'cl', 'tj', 'tz', 'th', 'tw', 'tg', 'tt', 'tn', 'tr',
      'tm', 'ug', 'ua', 'om', 'uy', 'jo', 'vu', 've', 'vn', 'ye', 'nz', 'gr', 'zm', 'zw'
    ]
    else array[
      'af', 'de', 'us', 'ao', 'ar', 'al', 'au', 'at', 'az', 'bs', 'bd', 'by', 'be', 'bz', 'bj', 'ae',
      'gb', 'bo', 'ba', 'bw', 'br', 'bn', 'bg', 'bf', 'bi', 'bt', 'cv', 'dz', 'dj', 'td', 'cz', 'cn',
      'dk', 'cd', 'do', 'dm', 'ec', 'gq', 'sv', 'id', 'er', 'am', 'ee', 'sz', 'et', 'fk', 'ma', 'ci',
      'ph', 'fi', 'fr', 'ga', 'gm', 'gh', 'gn', 'gw', 'gl', 'gt', 'gy', 'za', 'kr', 'ss', 'ge', 'ht',
      'hr', 'in', 'nl', 'hn', 'iq', 'ir', 'ie', 'es', 'il', 'se', 'ch', 'it', 'is', 'jm', 'jp', 'kh',
      'cm', 'ca', 'me', 'qa', 'kz', 'ke', 'cy', 'kg', 'co', 'km', 'cg', 'cr', 'kw', 'kp', 'mk', 'cu',
      'la', 'ls', 'lv', 'lr', 'ly', 'lt', 'lb', 'lu', 'hu', 'mg', 'mw', 'mv', 'my', 'ml', 'mt', 'mu',
      'mx', 'eg', 'mn', 'md', 'mr', 'mz', 'mm', 'na', 'np', 'ne', 'ng', 'ni', 'no', 'cf', 'uz', 'pk',
      'pa', 'pg', 'py', 'pe', 'pl', 'pt', 'pr', 'ro', 'rw', 'ru', 'lc', 'vc', 'st', 'sn', 'sc', 'rs',
      'sl', 'sg', 'sk', 'si', 'sb', 'so', 'lk', 'sd', 'sr', 'sy', 'sa', 'cl', 'tj', 'tz', 'th', 'tw',
      'tg', 'tt', 'tn', 'tr', 'tm', 'ug', 'ua', 'om', 'uy', 'jo', 'vu', 've', 'vn', 'ye', 'nc', 'nz',
      'gr', 'zm', 'zw'
    ]
  end;
$$;
-- duel_pool:bitir

create or replace function do_harita_avcisi.start_round(p_game_mode text, p_variant text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_round_id uuid;
begin
  if v_user_id is null then
    raise exception 'Tur başlatmak için giriş gerekir.';
  end if;

  -- Plaka ve isim Türkiye'de; isim (Normal / Zor), bayrak ve başkent dünyada sorulur.
  if not (
    (p_game_mode = 'turkey' and p_variant in ('normal', 'plates'))
    or (p_game_mode = 'world' and p_variant in ('normal', 'hard', 'flags', 'capitals'))
  ) then
    raise exception 'Geçersiz tur: % / %', p_game_mode, p_variant;
  end if;

  -- Bitirilmeyen ya da çoktan kapanan eski turlar tabloda birikmesin. Oda turları kalır: oda sıralaması
  -- tur tur ayrıntıyı ve yarım bırakılan turları onlardan okur.
  delete from do_harita_avcisi.game_rounds
  where user_id = v_user_id and room_id is null and started_at < now() - interval '1 day';

  insert into do_harita_avcisi.game_rounds (user_id, game_mode, variant)
  values (v_user_id, p_game_mode, p_variant)
  returning id into v_round_id;

  return v_round_id;
end;
$$;

create or replace function do_harita_avcisi.duel_check_settings(p_game_mode text, p_variant text, p_rule text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if not (
    (p_game_mode = 'turkey' and p_variant in ('normal', 'plates'))
    or (p_game_mode = 'world' and p_variant in ('normal', 'hard', 'flags', 'capitals'))
  ) or p_rule not in ('snatch', 'shared') then
    raise exception 'Geçersiz düello ayarı.';
  end if;
end;
$$;

create or replace function do_harita_avcisi.start_daily_round(p_game_mode text, p_variant text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := do_harita_avcisi.daily_today();
  v_questions text[];
  v_round_id uuid;
begin
  if v_user_id is null then
    raise exception 'Günlük meydan okuma için giriş gerekir.';
  end if;
  if not ((p_game_mode = 'turkey' and p_variant in ('normal', 'plates')) or (p_game_mode = 'world' and p_variant in ('hard', 'flags', 'capitals'))) then
    raise exception 'Geçersiz meydan okuma: % / %', p_game_mode, p_variant;
  end if;
  if exists (
    select 1 from do_harita_avcisi.game_rounds
    where user_id = v_user_id and daily_day = v_day and game_mode = p_game_mode and variant = p_variant
  ) then
    raise exception 'Bugünün meydan okumasını oynadın.';
  end if;

  insert into do_harita_avcisi.daily_challenges (day, game_mode, variant, questions)
  values (
    v_day, p_game_mode, p_variant,
    array(select location_id from unnest(do_harita_avcisi.duel_pool(p_game_mode, p_variant)) as location_id order by random() limit 10)
  )
  on conflict do nothing;

  select questions into v_questions
  from do_harita_avcisi.daily_challenges
  where day = v_day and game_mode = p_game_mode and variant = p_variant;

  insert into do_harita_avcisi.game_rounds (user_id, game_mode, variant, questions, daily_day)
  values (v_user_id, p_game_mode, p_variant, v_questions, v_day)
  returning id into v_round_id;

  return jsonb_build_object('round_id', v_round_id, 'questions', to_jsonb(v_questions), 'day', v_day);
end;
$$;

create or replace function do_harita_avcisi.my_badges()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_badges jsonb;
begin
  if v_user_id is null then
    raise exception 'Rozetler için giriş gerekir.';
  end if;

  with
    daily_days as (
      select distinct daily_day as day from do_harita_avcisi.game_results where user_id = v_user_id and daily_day is not null
    ),
    -- En uzun gün serisi: ardışık günler aynı gruba düşer (gün - sıra numarası sabittir).
    best_streak as (
      select coalesce(max(length), 0)::integer as value
      from (select count(*) as length from (select day, day - (row_number() over (order by day))::integer as run from daily_days) as numbered group by run) as runs
    ),
    best_scores as (
      select game_mode, variant, max(score)::integer as score, bool_or(score = 10 and duration_ms < 45000) as lightning
      from do_harita_avcisi.game_results
      where user_id = v_user_id
      group by game_mode, variant
    ),
    correct_places as (
      select game_mode, count(distinct location_id)::integer as places
      from do_harita_avcisi.round_answers
      where user_id = v_user_id and is_correct
      group by game_mode
    ),
    -- Gösterilen sıralamalardaki en iyi sıra (kaldırılan dünya "normal" hariç); sıralamayla aynı ölçüt. 0: sıralamada yok.
    best_rank as (
      select coalesce(min(1 + (
        select count(*) from do_harita_avcisi.leaderboard other
        where other.game_mode = mine.game_mode and other.variant = mine.variant and other.user_id <> v_user_id
          and (other.score, -other.duration_ms, other.best_streak) > (mine.score, -mine.duration_ms, mine.best_streak)
      )), 0)::integer as value
      from do_harita_avcisi.leaderboard mine
      where mine.user_id = v_user_id and not (mine.game_mode = 'world' and mine.variant = 'normal')
    ),
    duel_wins as (
      select count(*)::integer as value from do_harita_avcisi.duels where status = 'finished' and winner_id = v_user_id
    ),
    computed (badge_id, progress, goal) as (
      values
        ('streak_3', (select value from best_streak), 3),
        ('streak_7', (select value from best_streak), 7),
        ('streak_30', (select value from best_streak), 30),
        ('daily_first', (select count(*)::integer from daily_days), 1),
        ('daily_full', (
          select count(*)::integer from (
            select daily_day from do_harita_avcisi.game_results
            where user_id = v_user_id and daily_day is not null
            group by daily_day
            having count(distinct (game_mode, variant)) >= 5
          ) as full_days
        ), 1),
        ('perfect_turkey', coalesce((select score from best_scores where game_mode = 'turkey' and variant = 'normal'), 0), 10),
        ('perfect_plates', coalesce((select score from best_scores where game_mode = 'turkey' and variant = 'plates'), 0), 10),
        ('perfect_world', coalesce((select score from best_scores where game_mode = 'world' and variant = 'hard'), 0), 10),
        ('perfect_flags', coalesce((select score from best_scores where game_mode = 'world' and variant = 'flags'), 0), 10),
        ('perfect_capitals', coalesce((select score from best_scores where game_mode = 'world' and variant = 'capitals'), 0), 10),
        ('lightning', (select count(*)::integer from best_scores where lightning), 1),
        ('provinces_81', coalesce((select places from correct_places where game_mode = 'turkey'), 0), 81),
        ('countries_100', coalesce((select places from correct_places where game_mode = 'world'), 0), 100),
        ('duel_first_win', (select value from duel_wins), 1),
        ('duel_10_wins', (select value from duel_wins), 10),
        -- Sıra rozetlerinde ilerleme "ulaşıldı mı" (1/0).
        ('podium', (select case when value between 1 and 3 then 1 else 0 end from best_rank), 1),
        ('summit', (select case when value = 1 then 1 else 0 end from best_rank), 1)
    ),
    -- Hedefe ulaşılan rozetler verilir; bu sorgunun okuduğu tablo eklenenleri henüz görmez, yeniler ayrıca işaretlenir.
    inserted as (
      insert into do_harita_avcisi.player_badges (user_id, badge_id)
      select v_user_id, badge_id from computed where progress >= goal
      on conflict do nothing
      returning badge_id, earned_at
    )
  select jsonb_agg(
    jsonb_build_object(
      'id', computed.badge_id,
      'progress', least(computed.progress, computed.goal),
      'goal', computed.goal,
      'earned_at', coalesce(earned.earned_at, fresh.earned_at),
      'is_new', fresh.badge_id is not null
    )
    order by computed.badge_id
  )
  into v_badges
  from computed
  left join do_harita_avcisi.player_badges as earned on earned.user_id = v_user_id and earned.badge_id = computed.badge_id
  left join inserted as fresh on fresh.badge_id = computed.badge_id;

  return v_badges;
end;
$$;

commit;

notify pgrst, 'reload schema';
