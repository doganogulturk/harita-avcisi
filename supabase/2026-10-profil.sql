-- Tek seferlik geçiş: profil sayfasının verisi (my_profile). Supabase SQL Editor'da bir kez çalıştırın. Kalıcı tanım
-- supabase/schema.sql'dedir; işi bitince bu dosya silinebilir. Mevcut verilere dokunmaz.

begin;

-- ---------------------------------------------------------------------------------------------------------------
-- Profil: oyuncunun kendi istatistikleri. Yalnızca oyuncunun kendisi görür (auth.uid()); kişisel cevaplar tarayıcıya
-- kapalı olduğu için sahibinin yetkisiyle çalışan tek bir fonksiyon toplar ve döndürür.

create index if not exists round_answers_user_id_idx on do_harita_avcisi.round_answers (user_id);

/*
 * Profil sayfasının verisi (app/profil): hesap türü, ilk oyun, yarış özeti (tur, doğru, cevap, en uzun seri, oynanan
 * gün), her sıralamadaki en iyi sonuç ve sıra, son 10 yarış turu, düello sayıları ve son 100 düello.
 * Antrenman kaydedilmediği için yer almaz; oda turları yarış turudur, dahildir.
 */
create or replace function do_harita_avcisi.my_profile()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Profil için giriş gerekir.';
  end if;

  return jsonb_build_object(
    'is_guest', coalesce((select is_anonymous from auth.users where id = v_user_id), false),
    'first_played_at', (select min(created_at) from do_harita_avcisi.game_results where user_id = v_user_id),
    'summary', (
      select jsonb_build_object(
        'rounds', (select count(*) from do_harita_avcisi.game_results where user_id = v_user_id),
        'answered', count(*),
        'correct', count(*) filter (where is_correct),
        'best_streak', coalesce((select max(best_streak) from do_harita_avcisi.game_results where user_id = v_user_id), 0),
        'play_days', (
          select count(distinct (created_at at time zone 'Europe/Istanbul')::date)
          from do_harita_avcisi.game_results
          where user_id = v_user_id
        )
      )
      from do_harita_avcisi.round_answers
      where user_id = v_user_id
    ),
    -- Her sıralamada oyuncunun en iyi sonucu ve sırası: sıralamayla aynı ölçüt (puan, süre, en uzun seri).
    'boards', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'game_mode', mine.game_mode,
          'variant', mine.variant,
          'score', mine.score,
          'duration_ms', mine.duration_ms,
          'rank', 1 + (
            select count(*)
            from do_harita_avcisi.leaderboard other
            where other.game_mode = mine.game_mode and other.variant = mine.variant and other.user_id <> v_user_id
              and (other.score, -other.duration_ms, other.best_streak) > (mine.score, -mine.duration_ms, mine.best_streak)
          ),
          'players', (
            select count(*) from do_harita_avcisi.leaderboard other where other.game_mode = mine.game_mode and other.variant = mine.variant
          )
        )
      )
      from do_harita_avcisi.leaderboard mine
      where mine.user_id = v_user_id
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(recent order by recent.created_at desc)
      from (
        select game_mode, variant, score, duration_ms, created_at, room_id is not null as in_room
        from do_harita_avcisi.game_results
        where user_id = v_user_id
        order by created_at desc
        limit 10
      ) as recent
    ), '[]'::jsonb),
    'duels', (
      select jsonb_build_object(
        'played', count(*),
        'wins', count(*) filter (where winner_id = v_user_id),
        'losses', count(*) filter (where winner_id is not null and winner_id <> v_user_id),
        'draws', count(*) filter (where winner_id is null)
      )
      from do_harita_avcisi.duels
      where status = 'finished' and (host_id = v_user_id or guest_id = v_user_id)
    ),
    -- Son 100 düello, yeniden eskiye: rakip, mod, kural, skor ve sonuç (profilde galibiyet / beraberlik / mağlubiyet
    -- kartına dokununca listelenir).
    'duel_history', coalesce((
      select jsonb_agg(history order by history.finished_at desc)
      from (
        select
          case when host_id = v_user_id then guest_name else host_name end as opponent_name,
          case when host_id = v_user_id then guest_avatar else host_avatar end as opponent_avatar,
          game_mode,
          variant,
          rule,
          case when host_id = v_user_id then host_score else guest_score end as my_score,
          case when host_id = v_user_id then guest_score else host_score end as opponent_score,
          case when winner_id is null then 'draw' when winner_id = v_user_id then 'win' else 'loss' end as result,
          finish_reason,
          coalesce(finished_at, created_at) as finished_at
        from do_harita_avcisi.duels
        where status = 'finished' and (host_id = v_user_id or guest_id = v_user_id)
        order by coalesce(finished_at, created_at) desc
        limit 100
      ) as history
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function do_harita_avcisi.my_profile() from public, anon;
grant execute on function do_harita_avcisi.my_profile() to authenticated;

commit;
