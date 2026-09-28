create table if not exists public.game_results (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default 'Oyuncu',
  avatar_url text,
  game_mode text not null default 'turkey' check (game_mode in ('turkey', 'world')),
  variant text not null default 'normal' check (variant in ('normal', 'hard', 'flags', 'plates')),
  score smallint not null check (score between 0 and 10),
  duration_ms integer not null check (duration_ms >= 0),
  best_streak smallint not null check (best_streak between 0 and 10),
  created_at timestamptz not null default now()
);

alter table public.game_results
  add column if not exists display_name text,
  add column if not exists avatar_url text,
  add column if not exists game_mode text,
  add column if not exists duration_ms integer,
  add column if not exists variant text;

-- Mevcut satırların tamamı 58 ülkelik havuzla oynandı, yani gerçekten "normal" turlar.
update public.game_results
set variant = 'normal'
where variant is null;

update public.game_results
set game_mode = 'turkey'
where game_mode is null;

update public.game_results
set duration_ms = 2147483647
where duration_ms is null;

update public.game_results
set display_name = 'Oyuncu'
where display_name is null;

alter table public.game_results
  alter column display_name set not null,
  alter column display_name set default 'Oyuncu',
  alter column game_mode set not null,
  alter column game_mode set default 'turkey',
  alter column duration_ms set not null,
  alter column variant set not null,
  alter column variant set default 'normal';

alter table public.game_results
  drop constraint if exists game_results_game_mode_check,
  add constraint game_results_game_mode_check check (game_mode in ('turkey', 'world'));

-- 'flags': bayrakla sorulan dünya turları; 'plates': plakayla sorulan Türkiye turları.
-- İkisi de ayrı bir sıralamada yer alır.
alter table public.game_results
  drop constraint if exists game_results_variant_check,
  add constraint game_results_variant_check check (variant in ('normal', 'hard', 'flags', 'plates'));

create index if not exists game_results_user_id_game_mode_variant_score_idx
on public.game_results (user_id, game_mode, variant, score desc, duration_ms asc, best_streak desc, created_at asc);

create index if not exists game_results_game_mode_variant_score_idx
on public.game_results (game_mode, variant, score desc, duration_ms asc, best_streak desc, created_at asc);

alter table public.game_results enable row level security;

drop policy if exists "Users can read their own results" on public.game_results;
drop policy if exists "Authenticated users can read results" on public.game_results;
drop policy if exists "Anyone can read results" on public.game_results;
drop policy if exists "Users can create their own results" on public.game_results;

-- Sıralama giriş ekranından herkese açıktır; siteye ilk gelen de kimin önde olduğunu görebilir.
-- Tarayıcının yazma izni yoktur: sonuçlar yalnızca aşağıdaki finish_round fonksiyonuyla eklenir.
create policy "Anyone can read results"
on public.game_results
for select
to anon, authenticated
using (true);

-- Yarış turları. Tur başlarken açılır, sonuç kaydedilince kapanır; süreyi sunucu ölçer.
-- Tarayıcı bu tabloya doğrudan erişemez, yalnızca start_round ve finish_round kullanılır.
create table if not exists public.game_rounds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_mode text not null check (game_mode in ('turkey', 'world')),
  variant text not null check (variant in ('normal', 'hard', 'flags', 'plates')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists game_rounds_user_id_started_at_idx
on public.game_rounds (user_id, started_at);

alter table public.game_rounds enable row level security;
revoke all on public.game_rounds from anon, authenticated;

create or replace function public.start_round(p_game_mode text, p_variant text)
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

  -- Plaka ve isim Türkiye'de; isim (Normal / Zor) ve bayrak dünyada sorulur.
  if not (
    (p_game_mode = 'turkey' and p_variant in ('normal', 'plates'))
    or (p_game_mode = 'world' and p_variant in ('normal', 'hard', 'flags'))
  ) then
    raise exception 'Geçersiz tur: % / %', p_game_mode, p_variant;
  end if;

  -- Bitirilmeyen ya da çoktan kapanan eski turlar tabloda birikmesin. Oda turları kalır: oda sıralaması
  -- tur tur ayrıntıyı ve yarım bırakılan turları onlardan okur.
  delete from public.game_rounds
  where user_id = v_user_id and room_id is null and started_at < now() - interval '1 day';

  insert into public.game_rounds (user_id, game_mode, variant)
  values (v_user_id, p_game_mode, p_variant)
  returning id into v_round_id;

  return v_round_id;
end;
$$;

-- Yarış turlarında verilen her cevap. "En çok yanlış yapılanlar" bu tablodan hesaplanır; antrenman
-- cevapları kaydedilmez. Sonuç silinirse cevapları da silinir.
-- location_id sorulan yer, selected_id oyuncunun tıkladığı yerdir: Türkiye'de başında sıfır olmadan
-- plaka ("6", "34"), dünyada küçük harfli ISO kodu ("tr").
create table if not exists public.round_answers (
  id bigint generated always as identity primary key,
  result_id bigint not null references public.game_results(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  game_mode text not null,
  variant text not null,
  position smallint not null check (position between 0 and 9),
  location_id text not null,
  selected_id text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists round_answers_game_mode_variant_location_id_idx
on public.round_answers (game_mode, variant, location_id);

alter table public.round_answers enable row level security;
revoke all on public.round_answers from anon, authenticated;

-- Eski imza (puanı ve seriyi tarayıcıdan alan sürüm); yenisi cevap listesinden kendisi hesaplar.
drop function if exists public.finish_round(uuid, integer, integer, integer, integer);

/*
 * Yarış turunun sonucunu doğrulayıp kaydeder. Sabitler lib/game.ts ile aynıdır:
 * 10 soru, 120 saniye, her cevaptan sonra 3 saniyelik gösterim.
 *
 * p_answers, cevaplanan soruların sırayla listesidir: [{"location": "34", "selected": "41"}, ...].
 * Puan ve en uzun seri tarayıcıdan alınmaz, bu listeden hesaplanır.
 *
 * Doğru cevap sorudan belli olduğu için (sorulan ülkenin kodu, tıklanacak alanın kodudur)
 * cevapların doğruluğunu sunucuda denetlemek hileyi engellemez. Asıl kontrol süredir:
 * sunucu turun ne zaman başladığını bilir, bu yüzden hiç oynanmamış bir tur ya da fiziksel
 * olarak imkânsız bir süre kaydedilemez.
 */
create or replace function public.finish_round(
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
  v_round public.game_rounds;
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
  from public.game_rounds
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

  -- Oda turunda sorular sunucudan gelir; cevaplar sırayla o turun sorularına verilmiş olmalı.
  if v_round.room_id is not null and exists (
    select 1
    from jsonb_array_elements(p_answers) with ordinality as item(answer, position)
    left join public.room_questions q
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

  update public.game_rounds set finished_at = now() where id = v_round.id;

  insert into public.game_results (user_id, display_name, avatar_url, game_mode, variant, score, duration_ms, best_streak, room_id, room_round)
  values (v_user_id, coalesce(v_display_name, 'Oyuncu'), v_avatar_url, v_round.game_mode, v_round.variant, v_score, v_duration_ms, v_best_streak,
    v_round.room_id, v_round.room_round)
  returning id into v_result_id;

  insert into public.round_answers (result_id, user_id, game_mode, variant, position, location_id, selected_id, is_correct)
  select
    v_result_id, v_user_id, v_round.game_mode, v_round.variant, (item.position - 1)::smallint,
    item.answer ->> 'location', item.answer ->> 'selected', (item.answer ->> 'location') = (item.answer ->> 'selected')
  from jsonb_array_elements(p_answers) with ordinality as item(answer, position);
end;
$$;

revoke all on function public.start_round(text, text) from public, anon;
revoke all on function public.finish_round(uuid, integer, jsonb) from public, anon;
grant execute on function public.start_round(text, text) to authenticated;
grant execute on function public.finish_round(uuid, integer, jsonb) to authenticated;

-- Her sıralamada (game_mode + variant) her yerin kaç kez sorulduğu, kaç kez yanlış cevaplandığı ve
-- en çok hangi yerle karıştırıldığı. Yalnızca en az bir kez yanlış cevaplanan yerler listelenir.
-- round_answers tarayıcıya kapalı olduğu için bu view sahibinin yetkisiyle çalışır ve yalnızca
-- toplamları gösterir; kimin neyi cevapladığı görünmez.
drop view if exists public.location_stats;

create view public.location_stats
as
with totals as (
  select game_mode, variant, location_id,
    count(*) as asked,
    count(*) filter (where not is_correct) as wrong
  from public.round_answers
  group by game_mode, variant, location_id
),
confusions as (
  select distinct on (game_mode, variant, location_id)
    game_mode, variant, location_id, selected_id, count(*) as confused_count
  from public.round_answers
  where not is_correct
  group by game_mode, variant, location_id, selected_id
  order by game_mode, variant, location_id, count(*) desc, selected_id
)
select
  totals.game_mode,
  totals.variant,
  totals.location_id,
  totals.asked,
  totals.wrong,
  round(totals.wrong::numeric / totals.asked, 4) as wrong_rate,
  confusions.selected_id as most_confused_with,
  confusions.confused_count
from totals
join confusions using (game_mode, variant, location_id)
where totals.wrong > 0;

revoke all on public.location_stats from anon, authenticated;
grant select on public.location_stats to anon, authenticated;

drop view if exists public.leaderboard;

create view public.leaderboard
with (security_invoker = true)
as
select distinct on (user_id, game_mode, variant)
  user_id,
  display_name,
  avatar_url,
  game_mode,
  variant,
  score,
  duration_ms,
  best_streak
from public.game_results
order by user_id, game_mode, variant, score desc, duration_ms asc, best_streak desc, created_at asc;

alter table public.game_results replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'game_results'
  ) then
    alter publication supabase_realtime add table public.game_results;
  end if;
end;
$$;

-- ============================================================================================
-- Düello: iki oyuncu aynı sorularla aynı anda yarışır. Genel sıralamaya ve istatistiklere işlenmez.
--
-- Oyunun hakemi sunucudur: soruları seçer, her sorunun başlangıç anını tutar, cevapların doğruluğunu
-- ve kimin önce bildiğini kendi saatine göre belirler. Tarayıcı bu tablolara doğrudan erişemez; her
-- şeyi aşağıdaki fonksiyonlarla yapar. duel_state, çağıranın görmesi gerekeni döndürür: rakibin o
-- sorudaki cevabı, çağıran cevap verene ya da soru bitene kadar gizlidir.
--
-- Kurallar: 'snatch' (Kapan kazanır) ilk doğru bilen 1 puan alır ve soru biter; yanlış tıklayan o soruda
-- hakkını kaybeder. 'shared' (Herkes puan alır) doğru bilen 1 puan alır, ikisi de bildiyse hızlı olana +1.
-- Soru, iki oyuncu da cevaplayınca (snatch'te biri doğru bilince) ya da 15 saniye dolunca biter.
-- ============================================================================================

create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  -- Rövanşlar aynı seriye bağlanır; seri skoru bu kimlik üzerinden sayılır.
  series_id uuid not null,
  game_mode text not null check (game_mode in ('turkey', 'world')),
  variant text not null check (variant in ('normal', 'hard', 'flags', 'plates')),
  rule text not null check (rule in ('snatch', 'shared')),
  host_id uuid not null references auth.users(id) on delete cascade,
  host_name text not null,
  host_avatar text,
  host_ready boolean not null default false,
  host_seen_at timestamptz not null default now(),
  guest_id uuid references auth.users(id) on delete cascade,
  guest_name text,
  guest_avatar text,
  guest_ready boolean not null default false,
  guest_seen_at timestamptz,
  -- Rövanşta yalnızca eski rakip katılabilir.
  invited_id uuid references auth.users(id) on delete cascade,
  status text not null default 'lobby' check (status in ('lobby', 'playing', 'finished')),
  question_index smallint not null default -1,
  question_started_at timestamptz,
  question_ended_at timestamptz,
  host_score smallint not null default 0,
  guest_score smallint not null default 0,
  winner_id uuid,
  finish_reason text check (finish_reason in ('completed', 'forfeit')),
  rematch_duel_id uuid references public.duels(id) on delete set null,
  rematch_by uuid,
  rematch_declined boolean not null default false,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists duels_series_id_idx on public.duels (series_id);

create table if not exists public.duel_questions (
  duel_id uuid not null references public.duels(id) on delete cascade,
  position smallint not null,
  location_id text not null,
  primary key (duel_id, position)
);

create table if not exists public.duel_answers (
  duel_id uuid not null references public.duels(id) on delete cascade,
  position smallint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  selected_id text not null,
  is_correct boolean not null,
  response_ms integer not null,
  points smallint not null default 0,
  answered_at timestamptz not null default now(),
  primary key (duel_id, position, user_id)
);

alter table public.duels enable row level security;
alter table public.duel_questions enable row level security;
alter table public.duel_answers enable row level security;
revoke all on public.duels from anon, authenticated;
revoke all on public.duel_questions from anon, authenticated;
revoke all on public.duel_answers from anon, authenticated;

-- duel_pool:başla (scripts/generate-duel-pools.mjs üretir; elle düzenlemeyin)
-- Düello sorularının seçildiği havuzlar. Türkiye'de 81 il (plaka), dünyada lib/world-countries.ts'teki
-- Normal havuzu (58 ülke) ya da tamamı (179 ülke); Bayrak düellosu tamamından sorulur.
create or replace function public.duel_pool(p_game_mode text, p_variant text)
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

/* Oyuncunun sıralamada ve düelloda görünen adı ve fotoğrafı (lib/game.ts'teki playerFromUser ile aynı sıra). */
create or replace function public.player_profile(p_user_id uuid, out display_name text, out avatar_url text)
language sql
stable
security definer
set search_path = ''
as $$
  select
    coalesce(
      nullif(trim(raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(raw_user_meta_data ->> 'name'), ''),
      nullif(trim(raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(email), ''),
      'Oyuncu'
    ),
    coalesce(nullif(raw_user_meta_data ->> 'avatar_url', ''), nullif(raw_user_meta_data ->> 'picture', ''))
  from auth.users
  where id = p_user_id;
$$;

/* Düello kodu: 6 karakter; birbirine karışan O/0 ve I/1 kullanılmaz. */
create or replace function public.duel_new_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  c_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
begin
  loop
    select string_agg(substr(c_alphabet, 1 + floor(random() * length(c_alphabet))::int, 1), '')
    into v_code
    from generate_series(1, 6);
    exit when not exists (select 1 from public.duels where code = v_code);
  end loop;
  return v_code;
end;
$$;

create or replace function public.duel_check_settings(p_game_mode text, p_variant text, p_rule text)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if not (
    (p_game_mode = 'turkey' and p_variant in ('normal', 'plates'))
    or (p_game_mode = 'world' and p_variant in ('normal', 'hard', 'flags'))
  ) or p_rule not in ('snatch', 'shared') then
    raise exception 'Geçersiz düello ayarı.';
  end if;
end;
$$;

/*
 * Açık sorunun kapanışı: 'shared' kuralında ikisi de doğru bildiyse hızlı olana +1 verilir, skorlar
 * cevaplardaki puanlardan yeniden toplanır ve sorunun bittiği an yazılır. Satır kilitliyken çağrılır.
 */
create or replace function public.duel_close_question(p_duel public.duels)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_faster uuid;
begin
  if p_duel.rule = 'shared' then
    select user_id into v_faster
    from public.duel_answers
    where duel_id = p_duel.id and position = p_duel.question_index and is_correct
    order by response_ms, answered_at
    limit 1;
    if v_faster is not null and (
      select count(*) from public.duel_answers
      where duel_id = p_duel.id and position = p_duel.question_index and is_correct
    ) = 2 then
      update public.duel_answers set points = points + 1
      where duel_id = p_duel.id and position = p_duel.question_index and user_id = v_faster;
    end if;
  end if;

  update public.duels set
    question_ended_at = now(),
    host_score = coalesce((select sum(points) from public.duel_answers where duel_id = p_duel.id and user_id = p_duel.host_id), 0),
    guest_score = coalesce((select sum(points) from public.duel_answers where duel_id = p_duel.id and user_id = p_duel.guest_id), 0)
  where id = p_duel.id;
end;
$$;

/*
 * Düellonun çağıranın gözünden görünüşü. Rakibin açık sorudaki cevabının yeri ve doğruluğu, çağıran
 * cevap verene ya da soru bitene kadar gizlenir; yalnızca cevapladığı bilinir. Sorunun kendisi de
 * başlama anı gelmeden (geri sayım sırasında) gösterilmez.
 */
create or replace function public.duel_state(p_duel_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c_online_ms constant integer := 10000;
  v_user_id uuid := auth.uid();
  v_duel public.duels;
  v_rematch public.duels;
  v_i_answered boolean;
begin
  select * into v_duel from public.duels where id = p_duel_id;
  if not found then
    return null;
  end if;

  select exists (
    select 1 from public.duel_answers
    where duel_id = v_duel.id and position = v_duel.question_index and user_id = v_user_id
  ) into v_i_answered;

  if v_duel.rematch_duel_id is not null then
    select * into v_rematch from public.duels where id = v_duel.rematch_duel_id;
  end if;

  return jsonb_build_object(
    'code', v_duel.code,
    'status', v_duel.status,
    'game_mode', v_duel.game_mode,
    'variant', v_duel.variant,
    'rule', v_duel.rule,
    'server_now', now(),
    'me', case when v_user_id = v_duel.host_id then 'host' when v_user_id = v_duel.guest_id then 'guest' end,
    'host', jsonb_build_object(
      'id', v_duel.host_id, 'name', v_duel.host_name, 'avatar', v_duel.host_avatar, 'ready', v_duel.host_ready,
      'score', v_duel.host_score, 'online', v_duel.host_seen_at > now() - make_interval(secs => c_online_ms / 1000.0)
    ),
    'guest', case when v_duel.guest_id is null then null else jsonb_build_object(
      'id', v_duel.guest_id, 'name', v_duel.guest_name, 'avatar', v_duel.guest_avatar, 'ready', v_duel.guest_ready,
      'score', v_duel.guest_score, 'online', coalesce(v_duel.guest_seen_at > now() - make_interval(secs => c_online_ms / 1000.0), false)
    ) end,
    'question_index', v_duel.question_index,
    'question_started_at', v_duel.question_started_at,
    'question_ended_at', v_duel.question_ended_at,
    -- Başlamış soruların yerleri; açık soru ancak başlama anından sonra görünür.
    'questions', coalesce((
      select jsonb_agg(jsonb_build_object('position', q.position, 'location', q.location_id) order by q.position)
      from public.duel_questions q
      where q.duel_id = v_duel.id
        and (q.position < v_duel.question_index
          or (q.position = v_duel.question_index and v_duel.question_started_at <= now())
          or v_duel.status = 'finished')
    ), '[]'::jsonb),
    'answers', coalesce((
      select jsonb_agg(
        case
          when a.user_id = v_user_id or a.position < v_duel.question_index or v_duel.question_ended_at is not null
            or v_duel.status = 'finished' or v_i_answered
          then jsonb_build_object('position', a.position, 'user_id', a.user_id, 'selected', a.selected_id,
            'correct', a.is_correct, 'response_ms', a.response_ms, 'points', a.points)
          else jsonb_build_object('position', a.position, 'user_id', a.user_id, 'selected', null,
            'correct', null, 'response_ms', null, 'points', null)
        end
        order by a.position, a.answered_at)
      from public.duel_answers a
      where a.duel_id = v_duel.id
    ), '[]'::jsonb),
    'winner_id', v_duel.winner_id,
    'finish_reason', v_duel.finish_reason,
    'rematch', case when v_duel.rematch_duel_id is null then null else jsonb_build_object(
      'code', v_rematch.code, 'by', v_duel.rematch_by, 'declined', v_duel.rematch_declined,
      'game_mode', v_rematch.game_mode, 'variant', v_rematch.variant, 'rule', v_rematch.rule
    ) end,
    -- Seri skoru, bu düellonun ev sahibi ve misafirine göre.
    'series', jsonb_build_object(
      'host_wins', (select count(*) from public.duels d where d.series_id = v_duel.series_id and d.status = 'finished' and d.winner_id = v_duel.host_id),
      'guest_wins', (select count(*) from public.duels d where d.series_id = v_duel.series_id and d.status = 'finished' and d.winner_id = v_duel.guest_id)
    )
  );
end;
$$;

create or replace function public.duel_for_player(p_code text)
returns public.duels
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duel public.duels;
begin
  if auth.uid() is null then
    raise exception 'Düello için giriş gerekir.';
  end if;
  select * into v_duel from public.duels where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'Düello bulunamadı.';
  end if;
  if auth.uid() is distinct from v_duel.host_id and auth.uid() is distinct from v_duel.guest_id then
    raise exception 'Bu düellonun oyuncusu değilsin.';
  end if;
  return v_duel;
end;
$$;

create or replace function public.create_duel(p_game_mode text, p_variant text, p_rule text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile record;
  v_id uuid := gen_random_uuid();
  v_code text;
begin
  if v_user_id is null then
    raise exception 'Düello kurmak için giriş gerekir.';
  end if;
  perform public.duel_check_settings(p_game_mode, p_variant, p_rule);
  select * into v_profile from public.player_profile(v_user_id);
  v_code := public.duel_new_code();
  insert into public.duels (id, code, series_id, game_mode, variant, rule, host_id, host_name, host_avatar)
  values (v_id, v_code, v_id, p_game_mode, p_variant, p_rule, v_user_id, coalesce(v_profile.display_name, 'Oyuncu'), v_profile.avatar_url);
  return v_code;
end;
$$;

/* Bağlantıyla gelen oyuncuyu misafir olarak oturtur. Zaten oyuncuysa yalnızca durumu döndürür. */
create or replace function public.join_duel(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_duel public.duels;
  v_profile record;
begin
  if v_user_id is null then
    raise exception 'Düelloya katılmak için giriş gerekir.';
  end if;
  select * into v_duel from public.duels where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'Düello bulunamadı.';
  end if;
  if v_user_id = v_duel.host_id or v_user_id = v_duel.guest_id then
    return public.duel_state(v_duel.id);
  end if;
  if v_duel.guest_id is not null or v_duel.status <> 'lobby' then
    raise exception 'Bu düello dolu.';
  end if;
  if v_duel.invited_id is not null and v_duel.invited_id <> v_user_id then
    raise exception 'Bu rövanş başka bir oyuncuya ait.';
  end if;
  select * into v_profile from public.player_profile(v_user_id);
  update public.duels set
    guest_id = v_user_id,
    guest_name = coalesce(v_profile.display_name, 'Oyuncu'),
    guest_avatar = v_profile.avatar_url,
    guest_seen_at = now()
  where id = v_duel.id;
  return public.duel_state(v_duel.id);
end;
$$;

create or replace function public.duel_ready(p_code text, p_ready boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duel public.duels := public.duel_for_player(p_code);
begin
  if v_duel.status = 'lobby' then
    if auth.uid() = v_duel.host_id then
      update public.duels set host_ready = p_ready, host_seen_at = now() where id = v_duel.id;
    else
      update public.duels set guest_ready = p_ready, guest_seen_at = now() where id = v_duel.id;
    end if;
  end if;
  return public.duel_tick(p_code);
end;
$$;

/*
 * Oyunun saati. İki tarayıcı da düzenli aralıklarla çağırır: çağıranın hâlâ bağlı olduğunu kaydeder,
 * zamanı gelen geçişi yapar (ikisi de hazırsa düelloyu başlatır, 15 saniyesi dolan soruyu kapatır,
 * gösterimi biten sorudan sonrakine geçer) ve 30 saniyedir sesi çıkmayan rakibe karşı hükmen galibiyet
 * verir. Satır kilitli olduğu için aynı geçiş iki kez yapılmaz.
 */
create or replace function public.duel_tick(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_questions constant integer := 10;
  c_question_ms constant integer := 15000;
  c_reveal_ms constant integer := 3000;
  c_countdown_ms constant integer := 3000;
  c_forfeit_ms constant integer := 30000;
  v_duel public.duels := public.duel_for_player(p_code);
  v_is_host boolean := auth.uid() = v_duel.host_id;
  v_opponent_seen timestamptz;
begin
  if v_is_host then
    update public.duels set host_seen_at = now() where id = v_duel.id;
  else
    update public.duels set guest_seen_at = now() where id = v_duel.id;
  end if;

  if v_duel.status = 'lobby' then
    if v_duel.guest_id is not null and v_duel.host_ready and v_duel.guest_ready then
      insert into public.duel_questions (duel_id, position, location_id)
      select v_duel.id, (row_number() over () - 1)::smallint, location_id
      from (
        select location_id from unnest(public.duel_pool(v_duel.game_mode, v_duel.variant)) as location_id
        order by random()
        limit c_questions
      ) as picked;
      update public.duels set
        status = 'playing',
        question_index = 0,
        question_started_at = now() + make_interval(secs => c_countdown_ms / 1000.0),
        question_ended_at = null
      where id = v_duel.id;
    end if;
    return public.duel_state(v_duel.id);
  end if;

  if v_duel.status = 'playing' then
    v_opponent_seen := case when v_is_host then v_duel.guest_seen_at else v_duel.host_seen_at end;
    if v_opponent_seen < now() - make_interval(secs => c_forfeit_ms / 1000.0) then
      update public.duels set status = 'finished', finished_at = now(), winner_id = auth.uid(), finish_reason = 'forfeit'
      where id = v_duel.id;
      return public.duel_state(v_duel.id);
    end if;

    if v_duel.question_ended_at is null
      and now() >= v_duel.question_started_at + make_interval(secs => c_question_ms / 1000.0) then
      perform public.duel_close_question(v_duel);
      select * into v_duel from public.duels where id = v_duel.id;
    end if;

    if v_duel.question_ended_at is not null
      and now() >= v_duel.question_ended_at + make_interval(secs => c_reveal_ms / 1000.0) then
      if v_duel.question_index >= c_questions - 1 then
        update public.duels set
          status = 'finished',
          finished_at = now(),
          finish_reason = 'completed',
          winner_id = case
            when v_duel.host_score > v_duel.guest_score then v_duel.host_id
            when v_duel.guest_score > v_duel.host_score then v_duel.guest_id
          end
        where id = v_duel.id;
      else
        update public.duels set
          question_index = v_duel.question_index + 1,
          question_started_at = now(),
          question_ended_at = null
        where id = v_duel.id;
      end if;
    end if;
  end if;

  return public.duel_state(v_duel.id);
end;
$$;

/* Açık soruya cevap. Doğruluğu ve cevap süresini sunucu belirler; her oyuncunun soru başına tek hakkı var. */
create or replace function public.duel_answer(p_code text, p_position integer, p_selected text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_question_ms constant integer := 15000;
  -- Süre dolmak üzereyken verilen cevap ağda gecikirse kaybolmasın.
  c_grace_ms constant integer := 500;
  v_duel public.duels := public.duel_for_player(p_code);
  v_correct_id text;
  v_is_correct boolean;
  v_answers integer;
begin
  if v_duel.status <> 'playing' or p_position <> v_duel.question_index then
    return public.duel_tick(p_code);
  end if;
  if v_duel.question_ended_at is not null
    or now() < v_duel.question_started_at
    or now() > v_duel.question_started_at + make_interval(secs => (c_question_ms + c_grace_ms) / 1000.0)
    or exists (select 1 from public.duel_answers where duel_id = v_duel.id and position = p_position and user_id = auth.uid())
  then
    return public.duel_tick(p_code);
  end if;

  select location_id into v_correct_id from public.duel_questions where duel_id = v_duel.id and position = p_position;
  v_is_correct := p_selected = v_correct_id;

  insert into public.duel_answers (duel_id, position, user_id, selected_id, is_correct, response_ms, points)
  values (
    v_duel.id, p_position, auth.uid(), coalesce(p_selected, ''), v_is_correct,
    greatest(0, floor(extract(epoch from (now() - v_duel.question_started_at)) * 1000))::integer,
    case when v_is_correct then 1 else 0 end
  );

  select count(*) into v_answers from public.duel_answers where duel_id = v_duel.id and position = p_position;
  if (v_duel.rule = 'snatch' and v_is_correct) or v_answers = 2 then
    perform public.duel_close_question(v_duel);
  end if;

  return public.duel_tick(p_code);
end;
$$;

/*
 * Rövanş: çağıran, aynı ya da farklı ayarlarla yeni bir düello kurar; eski rakip davetli olur ve
 * yalnızca o katılabilir. Rakip de aynı anda istediyse yeni düello kurulmaz, var olanın kodu döner.
 */
create or replace function public.duel_rematch(p_code text, p_game_mode text, p_variant text, p_rule text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duel public.duels := public.duel_for_player(p_code);
  v_user_id uuid := auth.uid();
  v_opponent uuid;
  v_profile record;
  v_id uuid := gen_random_uuid();
  v_code text;
begin
  if v_duel.status <> 'finished' then
    raise exception 'Düello bitmeden rövanş istenemez.';
  end if;
  if v_duel.rematch_duel_id is not null and not v_duel.rematch_declined then
    return (select code from public.duels where id = v_duel.rematch_duel_id);
  end if;
  perform public.duel_check_settings(p_game_mode, p_variant, p_rule);

  v_opponent := case when v_user_id = v_duel.host_id then v_duel.guest_id else v_duel.host_id end;
  select * into v_profile from public.player_profile(v_user_id);
  v_code := public.duel_new_code();
  insert into public.duels (id, code, series_id, game_mode, variant, rule, host_id, host_name, host_avatar, invited_id)
  values (v_id, v_code, v_duel.series_id, p_game_mode, p_variant, p_rule, v_user_id,
    coalesce(v_profile.display_name, 'Oyuncu'), v_profile.avatar_url, v_opponent);
  update public.duels set rematch_duel_id = v_id, rematch_by = v_user_id, rematch_declined = false where id = v_duel.id;
  return v_code;
end;
$$;

create or replace function public.duel_decline_rematch(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_duel public.duels := public.duel_for_player(p_code);
begin
  if v_duel.rematch_duel_id is not null and v_duel.rematch_by <> auth.uid() then
    update public.duels set rematch_declined = true where id = v_duel.id;
  end if;
  return public.duel_state(v_duel.id);
end;
$$;

-- Tarayıcının çağırabildiği düello fonksiyonları; yardımcılar dışarıya kapalı.
revoke all on function public.duel_pool(text, text) from public, anon, authenticated;
revoke all on function public.player_profile(uuid) from public, anon, authenticated;
revoke all on function public.duel_new_code() from public, anon, authenticated;
revoke all on function public.duel_check_settings(text, text, text) from public, anon, authenticated;
revoke all on function public.duel_close_question(public.duels) from public, anon, authenticated;
revoke all on function public.duel_state(uuid) from public, anon, authenticated;
revoke all on function public.duel_for_player(text) from public, anon, authenticated;
revoke all on function public.create_duel(text, text, text) from public, anon;
revoke all on function public.join_duel(text) from public, anon;
revoke all on function public.duel_ready(text, boolean) from public, anon;
revoke all on function public.duel_tick(text) from public, anon;
revoke all on function public.duel_answer(text, integer, text) from public, anon;
revoke all on function public.duel_rematch(text, text, text, text) from public, anon;
revoke all on function public.duel_decline_rematch(text) from public, anon;
grant execute on function public.create_duel(text, text, text) to authenticated;
grant execute on function public.join_duel(text) to authenticated;
grant execute on function public.duel_ready(text, boolean) to authenticated;
grant execute on function public.duel_tick(text) to authenticated;
grant execute on function public.duel_answer(text, integer, text) to authenticated;
grant execute on function public.duel_rematch(text, text, text, text) to authenticated;
grant execute on function public.duel_decline_rematch(text) to authenticated;

-- ============================================================================================
-- Oda: bir grup, aynı sorularla kendi içinde yarışır. Oda sahibi haritayı, modu, tur sayısını (1/3/5),
-- süreyi (15/30/60 dk) ve en fazla katılımcıyı (2-50) seçer. Katılım yalnızca lobide açıktır; sahip
-- "Başlat" deyince süre işler ve herkes turlarını sırayla, dilediği anda oynar. Her tur normal bir
-- yarış turudur (10 soru, 120 saniye): start_room_round ile açılır, finish_round ile doğrulanıp kaydedilir,
-- bu yüzden genel sıralamaya ve istatistiklere de işlenir. Her turun soruları odadaki herkes için aynıdır
-- ve tur başlayana kadar gizlidir; her tur bir kez oynanır, başlatılıp bırakılan tur 0 sayılır.
-- ============================================================================================

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (char_length(name) between 1 and 30),
  game_mode text not null check (game_mode in ('turkey', 'world')),
  variant text not null check (variant in ('normal', 'hard', 'flags', 'plates')),
  round_count smallint not null check (round_count in (1, 3, 5)),
  duration_minutes smallint not null check (duration_minutes in (15, 30, 60)),
  max_players smallint not null check (max_players between 2 and 50),
  host_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists rooms_host_id_idx on public.rooms (host_id);

create table if not exists public.room_players (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.room_questions (
  room_id uuid not null references public.rooms(id) on delete cascade,
  round_no smallint not null,
  position smallint not null,
  location_id text not null,
  primary key (room_id, round_no, position)
);

-- Yarış turları ve sonuçları odaya bağlanabilir; oda dışındaki turlarda boş kalır.
alter table public.game_rounds
  add column if not exists room_id uuid references public.rooms(id) on delete set null,
  add column if not exists room_round smallint;
alter table public.game_results
  add column if not exists room_id uuid references public.rooms(id) on delete set null,
  add column if not exists room_round smallint;

-- Her oyuncu odadaki her turu bir kez başlatabilir.
create unique index if not exists game_rounds_room_round_user_idx
on public.game_rounds (room_id, room_round, user_id) where room_id is not null;

create index if not exists game_results_room_id_idx on public.game_results (room_id) where room_id is not null;

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_questions enable row level security;
revoke all on public.rooms from anon, authenticated;
revoke all on public.room_players from anon, authenticated;
revoke all on public.room_questions from anon, authenticated;

/* Odanın durumu: lobide, oyunda ya da bitti. Başlatılmayan oda 24 saat sonra kapanmış sayılır. */
create or replace function public.room_status(p_room public.rooms)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_room.started_at is null and p_room.created_at < now() - interval '24 hours' then 'finished'
    when p_room.started_at is null then 'lobby'
    when now() < p_room.ends_at then 'playing'
    else 'finished'
  end;
$$;

/*
 * Odanın çağıranın gözünden görünüşü: ayarlar, oyuncular ve oda sıralaması. Sıralamada her oyuncunun
 * tur tur puanı ve süresi, toplam puanı ve toplam süresi var; toplam puana, eşitlikte toplam süreye göre
 * dizilir. Oyuncunun bıraktığı ya da başlatılıp 150 saniyede bitirilmeyen tur "yarım" sayılır: 0 puan, 120 saniye.
 */
create or replace function public.room_state(p_room_id uuid, p_join_error text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c_round_ms constant integer := 120000;
  v_user_id uuid := auth.uid();
  v_room public.rooms;
  v_status text;
begin
  select * into v_room from public.rooms where id = p_room_id;
  if not found then
    return null;
  end if;
  v_status := public.room_status(v_room);

  return jsonb_build_object(
    'code', v_room.code,
    'name', v_room.name,
    'game_mode', v_room.game_mode,
    'variant', v_room.variant,
    'round_count', v_room.round_count,
    'duration_minutes', v_room.duration_minutes,
    'max_players', v_room.max_players,
    'status', v_status,
    'started_at', v_room.started_at,
    'ends_at', v_room.ends_at,
    'server_now', now(),
    'host_id', v_room.host_id,
    'is_member', exists (select 1 from public.room_players where room_id = v_room.id and user_id = v_user_id),
    'join_error', p_join_error,
    'players', coalesce((
      select jsonb_agg(player order by (player ->> 'total_score')::int desc, (player ->> 'total_duration_ms')::int, player ->> 'joined_at')
      from (
        select jsonb_build_object(
          'id', rp.user_id,
          'name', rp.display_name,
          'avatar', rp.avatar_url,
          'joined_at', rp.joined_at,
          'rounds', coalesce((
            select jsonb_agg(jsonb_build_object(
              'round', r.room_round,
              'status', case when res.id is not null then 'done'
                when r.finished_at is not null or r.started_at < now() - make_interval(secs => (c_round_ms + 30000) / 1000.0) then 'abandoned'
                else 'playing' end,
              'score', coalesce(res.score, 0),
              'duration_ms', case when res.id is not null then res.duration_ms else c_round_ms end
            ) order by r.room_round)
            from public.game_rounds r
            left join public.game_results res on res.room_id = r.room_id and res.room_round = r.room_round and res.user_id = r.user_id
            where r.room_id = v_room.id and r.user_id = rp.user_id
          ), '[]'::jsonb),
          'total_score', coalesce((
            select sum(res.score) from public.game_results res where res.room_id = v_room.id and res.user_id = rp.user_id
          ), 0),
          'total_duration_ms', coalesce((
            select sum(case when res.id is not null then res.duration_ms else c_round_ms end)
            from public.game_rounds r
            left join public.game_results res on res.room_id = r.room_id and res.room_round = r.room_round and res.user_id = r.user_id
            where r.room_id = v_room.id and r.user_id = rp.user_id
          ), 0)
        ) as player
        from public.room_players rp
        where rp.room_id = v_room.id
      ) as players
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.room_by_code(p_code text, p_lock boolean default false)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.rooms;
begin
  if auth.uid() is null then
    raise exception 'Oda için giriş gerekir.';
  end if;
  if p_lock then
    select * into v_room from public.rooms where code = upper(trim(p_code)) for update;
  else
    select * into v_room from public.rooms where code = upper(trim(p_code));
  end if;
  if not found then
    raise exception 'Oda bulunamadı.';
  end if;
  return v_room;
end;
$$;

create or replace function public.create_room(
  p_name text, p_game_mode text, p_variant text, p_round_count integer, p_duration_minutes integer, p_max_players integer
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_max_open_rooms constant integer := 3;
  v_user_id uuid := auth.uid();
  v_profile record;
  v_id uuid := gen_random_uuid();
  v_code text;
begin
  if v_user_id is null then
    raise exception 'Oda kurmak için giriş gerekir.';
  end if;
  perform public.duel_check_settings(p_game_mode, p_variant, 'snatch');
  if p_round_count not in (1, 3, 5) or p_duration_minutes not in (15, 30, 60) or p_max_players not between 2 and 50
    or char_length(trim(coalesce(p_name, ''))) not between 1 and 30 then
    raise exception 'Geçersiz oda ayarı.';
  end if;
  if (select count(*) from public.rooms r where r.host_id = v_user_id and public.room_status(r) <> 'finished') >= c_max_open_rooms then
    raise exception 'Aynı anda en fazla % açık odan olabilir.', c_max_open_rooms;
  end if;

  select * into v_profile from public.player_profile(v_user_id);
  -- Oda kodları düello kodlarıyla aynı alfabeden; ikisi ayrı tablolarda olduğu için çakışmaları sorun değil.
  loop
    v_code := public.duel_new_code();
    exit when not exists (select 1 from public.rooms where code = v_code);
  end loop;
  insert into public.rooms (id, code, name, game_mode, variant, round_count, duration_minutes, max_players, host_id)
  values (v_id, v_code, trim(p_name), p_game_mode, p_variant, p_round_count, p_duration_minutes, p_max_players, v_user_id);
  insert into public.room_players (room_id, user_id, display_name, avatar_url)
  values (v_id, v_user_id, coalesce(v_profile.display_name, 'Oyuncu'), v_profile.avatar_url);
  return v_code;
end;
$$;

/*
 * Odaya katılır. Oyuncu zaten odadaysa ya da katılamıyorsa (oda başlamış, bitmiş ya da dolu) hata vermez;
 * durumu, katılamama nedeniyle birlikte döndürür ki bağlantıyı açan sıralamayı yine de görebilsin.
 */
create or replace function public.join_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms := public.room_by_code(p_code, true);
  v_profile record;
begin
  if exists (select 1 from public.room_players where room_id = v_room.id and user_id = v_user_id) then
    return public.room_state(v_room.id);
  end if;
  if public.room_status(v_room) <> 'lobby' then
    return public.room_state(v_room.id, 'Oda başladı; yeni oyuncu katılamaz.');
  end if;
  if (select count(*) from public.room_players where room_id = v_room.id) >= v_room.max_players then
    return public.room_state(v_room.id, 'Oda dolu.');
  end if;
  select * into v_profile from public.player_profile(v_user_id);
  insert into public.room_players (room_id, user_id, display_name, avatar_url)
  values (v_room.id, v_user_id, coalesce(v_profile.display_name, 'Oyuncu'), v_profile.avatar_url);
  return public.room_state(v_room.id);
end;
$$;

create or replace function public.get_room(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  return public.room_state((public.room_by_code(p_code)).id);
end;
$$;

/* Oda sahibi başlatır: her turun soruları seçilir (turlar arasında tekrar yok) ve süre işlemeye başlar. */
create or replace function public.start_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  c_questions constant integer := 10;
  v_room public.rooms := public.room_by_code(p_code, true);
begin
  if auth.uid() <> v_room.host_id then
    raise exception 'Odayı yalnızca oda sahibi başlatabilir.';
  end if;
  if public.room_status(v_room) <> 'lobby' then
    raise exception 'Oda zaten başladı.';
  end if;
  if (select count(*) from public.room_players where room_id = v_room.id) < 2 then
    raise exception 'Başlatmak için en az 2 oyuncu gerekir.';
  end if;

  insert into public.room_questions (room_id, round_no, position, location_id)
  select v_room.id, ((ordinal - 1) / c_questions + 1)::smallint, ((ordinal - 1) % c_questions)::smallint, location_id
  from (
    select location_id, row_number() over () as ordinal
    from (
      select location_id from unnest(public.duel_pool(v_room.game_mode, v_room.variant)) as location_id
      order by random()
      limit c_questions * v_room.round_count
    ) as picked
  ) as numbered;

  update public.rooms set started_at = now(), ends_at = now() + make_interval(mins => v_room.duration_minutes)
  where id = v_room.id;
  return public.room_state(v_room.id);
end;
$$;

/*
 * Odadaki bir turu açar ve sorularını döndürür. Turlar sırayla oynanır, her tur bir kez başlatılabilir;
 * süre bitince yeni tur açılmaz (başlamış tur kendi 120 saniyesi içinde bitirilebilir).
 */
create or replace function public.start_room_round(p_code text, p_round integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_room public.rooms := public.room_by_code(p_code);
  v_round_id uuid;
begin
  if not exists (select 1 from public.room_players where room_id = v_room.id and user_id = v_user_id) then
    raise exception 'Bu odanın oyuncusu değilsin.';
  end if;
  if public.room_status(v_room) <> 'playing' then
    raise exception 'Oda şu an oynanmıyor.';
  end if;
  if p_round < 1 or p_round > v_room.round_count then
    raise exception 'Geçersiz tur.';
  end if;
  if (select count(*) from public.game_rounds where room_id = v_room.id and user_id = v_user_id) <> p_round - 1 then
    raise exception 'Turlar sırayla ve birer kez oynanır.';
  end if;

  insert into public.game_rounds (user_id, game_mode, variant, room_id, room_round)
  values (v_user_id, v_room.game_mode, v_room.variant, v_room.id, p_round)
  returning id into v_round_id;

  return jsonb_build_object(
    'round_id', v_round_id,
    'questions', (
      select jsonb_agg(location_id order by position)
      from public.room_questions
      where room_id = v_room.id and round_no = p_round
    )
  );
end;
$$;

/* Oyuncu turu bilerek bırakır; tur hemen "yarım" sayılır ve artık bitirilemez. */
create or replace function public.abandon_round(p_round_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.game_rounds set finished_at = now()
  where id = p_round_id and user_id = auth.uid() and finished_at is null;
$$;

revoke all on function public.room_status(public.rooms) from public, anon, authenticated;
revoke all on function public.room_state(uuid, text) from public, anon, authenticated;
revoke all on function public.room_by_code(text, boolean) from public, anon, authenticated;
revoke all on function public.create_room(text, text, text, integer, integer, integer) from public, anon;
revoke all on function public.join_room(text) from public, anon;
revoke all on function public.get_room(text) from public, anon;
revoke all on function public.start_room(text) from public, anon;
revoke all on function public.start_room_round(text, integer) from public, anon;
grant execute on function public.create_room(text, text, text, integer, integer, integer) to authenticated;
grant execute on function public.join_room(text) to authenticated;
grant execute on function public.get_room(text) to authenticated;
grant execute on function public.start_room(text) to authenticated;
grant execute on function public.start_room_round(text, integer) to authenticated;
revoke all on function public.abandon_round(uuid) from public, anon;
grant execute on function public.abandon_round(uuid) to authenticated;

notify pgrst, 'reload schema';
