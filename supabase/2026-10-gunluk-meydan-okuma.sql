-- Tek seferlik geçiş: günlük meydan okuma. Supabase SQL Editor'da bir kez çalıştırın (tek transaction). Kalıcı tanım
-- supabase/schema.sql'dedir; işi bitince bu dosya silinebilir. Mevcut verilere dokunmaz; finish_round yalnızca sonucun
-- gününü de yazacak şekilde güncellenir.

begin;

-- Günlük meydan okuma turlarında meydan okumanın günü (Türkiye saatiyle); diğer turlarda boş. Sonuç da günü taşır:
-- günlük sıralama ve gün serisi bundan hesaplanır.
alter table do_harita_avcisi.game_rounds add column if not exists daily_day date;
alter table do_harita_avcisi.game_results add column if not exists daily_day date;

-- Her oyuncu her modun günlük meydan okumasını bir kez başlatabilir (bırakılan tur da hakkı kullanır).
create unique index if not exists game_rounds_daily_user_idx
on do_harita_avcisi.game_rounds (user_id, daily_day, game_mode, variant) where daily_day is not null;

create index if not exists game_results_daily_idx
on do_harita_avcisi.game_results (daily_day, game_mode, variant, score desc, duration_ms asc, best_streak desc) where daily_day is not null;

create or replace function do_harita_avcisi.finish_round(
  p_round_id uuid,
  p_duration_ms integer,
  p_answers jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_questions constant integer := 10;
  c_game_ms constant integer := 120000;
  c_transition_ms constant integer := 3000;
  -- Bir soruyu okuyup haritada tıklamak için insanın ihtiyaç duyduğu en kısa süre.
  c_min_answer_ms constant integer := 300;
  -- Ağ gecikmesi ve tarayıcı zamanlayıcılarının kayması için pay.
  c_grace_ms constant integer := 5000;
  -- Sekme arka plandayken zamanlayıcılar yavaşlar; turun kaydı bu kadar gecikebilir.
  c_late_ms constant integer := 20000;

  v_user_id uuid := auth.uid();
  v_round do_harita_avcisi.game_rounds;
  v_elapsed_ms integer;
  v_min_ms integer := (c_questions - 1) * c_transition_ms + c_questions * c_min_answer_ms;
  v_duration_ms integer;
  v_id_pattern text;
  v_answered integer;
  v_score integer := 0;
  v_streak integer := 0;
  v_best_streak integer := 0;
  v_answer record;
  v_result_id bigint;
  v_display_name text;
  v_avatar_url text;
begin
  if v_user_id is null then
    raise exception 'Sonuç kaydetmek için giriş gerekir.';
  end if;

  select * into v_round
  from do_harita_avcisi.game_rounds
  where id = p_round_id and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Tur bulunamadı.';
  end if;
  if v_round.finished_at is not null then
    raise exception 'Bu turun sonucu zaten kaydedildi.';
  end if;

  v_elapsed_ms := floor(extract(epoch from (now() - v_round.started_at)) * 1000);

  if p_duration_ms is null or p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Geçersiz sonuç.';
  end if;

  v_answered := jsonb_array_length(p_answers);
  if v_answered > c_questions then
    raise exception 'Geçersiz sonuç.';
  end if;

  -- Türkiye'de 1-81 arası plaka, dünyada iki harfli ülke kodu. Bir turda aynı yer iki kez sorulmaz.
  v_id_pattern := case v_round.game_mode when 'turkey' then '^([1-9]|[1-7][0-9]|8[01])$' else '^[a-z]{2}$' end;
  if exists (
    select 1
    from jsonb_array_elements(p_answers) as answer
    where jsonb_typeof(answer) <> 'object'
      or coalesce(answer ->> 'location', '') !~ v_id_pattern
      or coalesce(answer ->> 'selected', '') !~ v_id_pattern
  ) or (
    select count(distinct answer ->> 'location') from jsonb_array_elements(p_answers) as answer
  ) <> v_answered then
    raise exception 'Geçersiz sonuç.';
  end if;

  -- Yarış turunun soruları sunucuda seçildiyse (start_ranked_round) cevaplar sırayla o sorulara verilmiş olmalı.
  if v_round.questions is not null and exists (
    select 1
    from jsonb_array_elements(p_answers) with ordinality as item(answer, position)
    where v_round.questions[item.position] is distinct from item.answer ->> 'location'
  ) then
    raise exception 'Geçersiz sonuç.';
  end if;

  -- Oda turunda sorular sunucudan gelir; cevaplar sırayla o turun sorularına verilmiş olmalı.
  if v_round.room_id is not null and exists (
    select 1
    from jsonb_array_elements(p_answers) with ordinality as item(answer, position)
    left join do_harita_avcisi.room_questions q
      on q.room_id = v_round.room_id and q.round_no = v_round.room_round and q.position = item.position - 1
    where q.location_id is distinct from item.answer ->> 'location'
  ) then
    raise exception 'Geçersiz sonuç.';
  end if;

  for v_answer in
    select (answer ->> 'location') = (answer ->> 'selected') as is_correct
    from jsonb_array_elements(p_answers) with ordinality as item(answer, position)
    order by position
  loop
    if v_answer.is_correct then
      v_score := v_score + 1;
      v_streak := v_streak + 1;
      v_best_streak := greatest(v_best_streak, v_streak);
    else
      v_streak := 0;
    end if;
  end loop;

  if v_elapsed_ms > c_game_ms + c_transition_ms + c_late_ms then
    raise exception 'Turun süresi çoktan doldu.';
  end if;

  if v_answered < c_questions then
    -- Sorular bitmeden kaydedilen tur ancak süre dolunca biter.
    if v_elapsed_ms < c_game_ms - c_grace_ms then
      raise exception 'Tur bitmeden sonuç kaydedilemez.';
    end if;
    v_duration_ms := c_game_ms;
  else
    if v_elapsed_ms < v_min_ms then
      raise exception 'Tur bu kadar kısa sürede bitirilemez.';
    end if;
    -- Tarayıcının ölçtüğü süre kullanılır, ama sunucunun ölçtüğünden belirgin biçimde kısa olamaz.
    -- Son cevaptan sonraki 3 saniyelik gösterim sunucu süresine dahildir, tarayıcınınkine değil.
    v_duration_ms := least(c_game_ms, greatest(p_duration_ms, v_elapsed_ms - c_transition_ms - c_grace_ms, v_min_ms));
  end if;

  -- Ad ve fotoğraf tarayıcıdan değil oturumdan alınır (lib/game.ts'teki playerFromUser ile aynı sıra).
  select
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(raw_user_meta_data ->> 'name'), ''),
      nullif(trim(raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(email), ''),
      'Oyuncu'
    ),
    coalesce(nullif(raw_user_meta_data ->> 'avatar_url', ''), nullif(raw_user_meta_data ->> 'picture', ''))
  into v_display_name, v_avatar_url
  from auth.users
  where id = v_user_id;

  update do_harita_avcisi.game_rounds set finished_at = now() where id = v_round.id;

  insert into do_harita_avcisi.game_results (user_id, display_name, avatar_url, game_mode, variant, score, duration_ms, best_streak, room_id, room_round, daily_day)
  values (v_user_id, coalesce(v_display_name, 'Oyuncu'), v_avatar_url, v_round.game_mode, v_round.variant, v_score, v_duration_ms, v_best_streak,
    v_round.room_id, v_round.room_round, v_round.daily_day)
  returning id into v_result_id;

  insert into do_harita_avcisi.round_answers (result_id, user_id, game_mode, variant, position, location_id, selected_id, is_correct)
  select
    v_result_id, v_user_id, v_round.game_mode, v_round.variant, (item.position - 1)::smallint,
    item.answer ->> 'location', item.answer ->> 'selected', (item.answer ->> 'location') = (item.answer ->> 'selected')
  from jsonb_array_elements(p_answers) with ordinality as item(answer, position);
end;
$$;

-- ---------------------------------------------------------------------------------------------------------------
-- Günlük meydan okuma: her gün (Türkiye saatiyle) Türkiye, Plaka, Dünya ve Bayrak için ayrı birer meydan okuma.
-- Bir modun soruları o gün ilk başlatıldığında seçilir ve gün boyu herkes için aynıdır. Her oyuncu her modu günde bir
-- kez oynar; tur normal bir yarış turudur (finish_round doğrular) ve genel sıralamaya da işlenir.

create table if not exists do_harita_avcisi.daily_challenges (
  day date not null,
  game_mode text not null,
  variant text not null,
  questions text[] not null,
  primary key (day, game_mode, variant)
);

alter table do_harita_avcisi.daily_challenges enable row level security;
revoke all on do_harita_avcisi.daily_challenges from anon, authenticated;

/* Türkiye saatiyle bugün; günlük meydan okuma gece yarısı değişir. */
create or replace function do_harita_avcisi.daily_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Europe/Istanbul')::date;
$$;

/* Bugünün meydan okuma turunu açar: soruları (gerekirse seçip) döndürür; aynı mod bugün başlatıldıysa reddeder. */
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
  if not ((p_game_mode = 'turkey' and p_variant in ('normal', 'plates')) or (p_game_mode = 'world' and p_variant in ('hard', 'flags'))) then
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

-- Bugünün günlük sıralaması: her oyuncunun her modda tek sonucu vardır. Gece yarısı kendiliğinden yeni güne geçer.
create or replace view do_harita_avcisi.daily_leaderboard
with (security_invoker = true)
as
select user_id, display_name, avatar_url, game_mode, variant, score, duration_ms, best_streak
from do_harita_avcisi.game_results
where daily_day = do_harita_avcisi.daily_today();

revoke all on do_harita_avcisi.daily_leaderboard from anon, authenticated;
grant select on do_harita_avcisi.daily_leaderboard to anon, authenticated;

/*
 * Oyuncunun bugünkü durumu: başlattığı modlar (bırakılanlar da hakkı kullanır), bitirdiklerinin sonucu, sırası ve soru
 * soru doğru/yanlış dizisi (paylaşım kareleri için), gün serisi ve yeni meydan okumaya kalan saniye. Seri: en az bir
 * meydan okuma bitirilen ardışık günler; bugün henüz oynanmadıysa dünden geriye sayılır.
 */
create or replace function do_harita_avcisi.my_daily()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_day date := do_harita_avcisi.daily_today();
  v_anchor date;
  v_streak integer;
begin
  if v_user_id is null then
    raise exception 'Günlük meydan okuma için giriş gerekir.';
  end if;

  v_anchor := case
    when exists (select 1 from do_harita_avcisi.game_results where user_id = v_user_id and daily_day = v_day) then v_day
    else v_day - 1
  end;

  select count(*) into v_streak
  from (
    select day, row_number() over (order by day desc) as position
    from (select distinct daily_day as day from do_harita_avcisi.game_results where user_id = v_user_id and daily_day <= v_anchor) as days
  ) as ordered
  where day = v_anchor - (position - 1)::integer;

  return jsonb_build_object(
    'day', v_day,
    'seconds_left', ceil(extract(epoch from (((v_day + 1)::timestamp at time zone 'Europe/Istanbul') - now())))::integer,
    'streak', v_streak,
    'started', coalesce((
      select jsonb_agg(jsonb_build_object('game_mode', game_mode, 'variant', variant))
      from do_harita_avcisi.game_rounds
      where user_id = v_user_id and daily_day = v_day
    ), '[]'::jsonb),
    'results', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'game_mode', mine.game_mode,
          'variant', mine.variant,
          'score', mine.score,
          'duration_ms', mine.duration_ms,
          'rank', 1 + (
            select count(*) from do_harita_avcisi.game_results other
            where other.daily_day = v_day and other.game_mode = mine.game_mode and other.variant = mine.variant
              and (other.score, -other.duration_ms, other.best_streak) > (mine.score, -mine.duration_ms, mine.best_streak)
          ),
          'players', (
            select count(*) from do_harita_avcisi.game_results other
            where other.daily_day = v_day and other.game_mode = mine.game_mode and other.variant = mine.variant
          ),
          'answers', coalesce((
            select jsonb_agg(is_correct order by position) from do_harita_avcisi.round_answers where result_id = mine.id
          ), '[]'::jsonb)
        )
      )
      from do_harita_avcisi.game_results mine
      where mine.user_id = v_user_id and mine.daily_day = v_day
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function do_harita_avcisi.daily_today() from public, anon, authenticated;
revoke all on function do_harita_avcisi.start_daily_round(text, text) from public, anon;
revoke all on function do_harita_avcisi.my_daily() from public, anon;
grant execute on function do_harita_avcisi.daily_today() to anon, authenticated;
grant execute on function do_harita_avcisi.start_daily_round(text, text) to authenticated;
grant execute on function do_harita_avcisi.my_daily() to authenticated;

commit;
