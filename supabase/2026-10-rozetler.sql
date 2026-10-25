-- Tek seferlik geçiş: rozetler (player_badges, my_badges). Supabase SQL Editor'da bir kez çalıştırın. Kalıcı tanım
-- supabase/schema.sql'dedir; işi bitince bu dosya silinebilir. Mevcut verilere dokunmaz.

begin;

-- ---------------------------------------------------------------------------------------------------------------
-- Rozetler: oyuncunun kazandığı başarılar. Mevcut veriden (yarış sonuçları, cevaplar, düellolar, günlük meydan okumalar)
-- hesaplanır; kazanılan rozet bu tabloya yazılır ve bir daha kaybolmaz (ör. sıralamada geçilse de "Kürsü" kalır). Adları
-- ve açıklamaları istemcidedir (lib/badges.ts).

create table if not exists do_harita_avcisi.player_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table do_harita_avcisi.player_badges enable row level security;
revoke all on do_harita_avcisi.player_badges from anon, authenticated;

/*
 * Oyuncunun rozetleri: her rozetin ilerlemesi ve hedefi; hedefe ulaşılan ama henüz verilmemiş rozetleri verir. Dönen
 * listede kazanılanların tarihi ve bu çağrıda yeni verilenler (is_new) işaretlidir; sonuç ekranı yeni rozeti kutlar.
 * Geçmişte hak edilmiş rozetler de ilk çağrıda verilir.
 */
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
            having count(distinct (game_mode, variant)) >= 4
          ) as full_days
        ), 1),
        ('perfect_turkey', coalesce((select score from best_scores where game_mode = 'turkey' and variant = 'normal'), 0), 10),
        ('perfect_plates', coalesce((select score from best_scores where game_mode = 'turkey' and variant = 'plates'), 0), 10),
        ('perfect_world', coalesce((select score from best_scores where game_mode = 'world' and variant = 'hard'), 0), 10),
        ('perfect_flags', coalesce((select score from best_scores where game_mode = 'world' and variant = 'flags'), 0), 10),
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

revoke all on function do_harita_avcisi.my_badges() from public, anon;
grant execute on function do_harita_avcisi.my_badges() to authenticated;

commit;
