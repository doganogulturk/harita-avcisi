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

  -- Bitirilmeyen ya da çoktan kapanan eski turlar tabloda birikmesin.
  delete from public.game_rounds
  where user_id = v_user_id and started_at < now() - interval '1 day';

  insert into public.game_rounds (user_id, game_mode, variant)
  values (v_user_id, p_game_mode, p_variant)
  returning id into v_round_id;

  return v_round_id;
end;
$$;

/*
 * Yarış turunun sonucunu doğrulayıp kaydeder. Sabitler lib/game.ts ile aynıdır:
 * 10 soru, 120 saniye, her cevaptan sonra 3 saniyelik gösterim.
 *
 * Doğru cevap sorudan belli olduğu için (sorulan ülkenin kodu, tıklanacak alanın kodudur)
 * cevapları tek tek sunucuda kontrol etmek bir şey kazandırmaz. Asıl kontrol süredir:
 * sunucu turun ne zaman başladığını bilir, bu yüzden hiç oynanmamış bir tur ya da fiziksel
 * olarak imkânsız bir süre kaydedilemez.
 */
create or replace function public.finish_round(
  p_round_id uuid,
  p_score integer,
  p_best_streak integer,
  p_answered integer,
  p_duration_ms integer
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

  if p_answered is null or p_answered < 0 or p_answered > c_questions
    or p_score is null or p_score < 0 or p_score > p_answered
    or p_best_streak is null or p_best_streak < 0 or p_best_streak > p_score
    or p_duration_ms is null
  then
    raise exception 'Geçersiz sonuç.';
  end if;

  -- Yanlış cevaplar doğruları en fazla (yanlış + 1) seriye böler; en uzun seri bundan kısa olamaz.
  if p_score > 0 and p_best_streak < ceil(p_score::numeric / (p_answered - p_score + 1)) then
    raise exception 'Geçersiz sonuç.';
  end if;

  if v_elapsed_ms > c_game_ms + c_transition_ms + c_late_ms then
    raise exception 'Turun süresi çoktan doldu.';
  end if;

  if p_answered < c_questions then
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

  insert into public.game_results (user_id, display_name, avatar_url, game_mode, variant, score, duration_ms, best_streak)
  values (v_user_id, coalesce(v_display_name, 'Oyuncu'), v_avatar_url, v_round.game_mode, v_round.variant, p_score, v_duration_ms, p_best_streak);
end;
$$;

revoke all on function public.start_round(text, text) from public, anon;
revoke all on function public.finish_round(uuid, integer, integer, integer, integer) from public, anon;
grant execute on function public.start_round(text, text) to authenticated;
grant execute on function public.finish_round(uuid, integer, integer, integer, integer) to authenticated;

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

notify pgrst, 'reload schema';
