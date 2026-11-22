-- Oyna güncellemesi: canlı veritabanına bir kez uygulanacak değişiklikler (sonra bu dosya silinir).
-- Kaynak: supabase/schema.sql. Yalnızca değişen fonksiyonlar; tablo ve veri değişikliği yok.
--   1. finish_round: serbest turda (Oyna, Antrenman) en kısa süreye 3 sn'lik gösterim eklenmez.
--   2. my_profile: sıralamadaki sıra (rank, players) kalktı.
--   3. my_badges: şimşek yalnızca günlükte; kürsü/zirve günlük sıralamadan (en az 3 oyuncu).
--   4. my_weak_spots: yeni fonksiyon.
-- Eski uygulama sürümleri çalışmaya devam eder (leaderboard görünümü ve yayını yerinde kalır).

begin;

/*
 * Yarış turunun sonucunu doğrulayıp kaydeder. Sabitler lib/game.ts ile aynıdır:
 * 10 soru, 120 saniye, her cevaptan sonra en çok 3 saniyelik gösterim.
 *
 * En kısa tur süresi turun türüne bağlıdır. Günlük meydan okuma ve oda turlarında her cevaptan sonra 3 saniyelik
 * gösterim beklenir (herkes aynı kuralla yarışır). Serbest turda (Oyna, Antrenman) doğru cevap kısa gösterilir ve
 * dokunarak geçilebilir; bu yüzden en kısa süreye gösterim eklenmez. Sunucu hangi uygulama sürümünün çağırdığını
 * bilmez; eski uygulamalar 3 saniye beklemeye devam eder ve daha yavaş bitirdikleri için kabul edilir.
 *
 * p_answers, cevaplanan soruların sırayla listesidir: [{"location": "34", "selected": "41"}, ...].
 * Puan ve en uzun seri tarayıcıdan alınmaz, bu listeden hesaplanır.
 *
 * Doğru cevap sorudan belli olduğu için (sorulan ülkenin kodu, tıklanacak alanın kodudur)
 * cevapların doğruluğunu sunucuda denetlemek hileyi engellemez. Asıl kontrol süredir:
 * sunucu turun ne zaman başladığını bilir, bu yüzden hiç oynanmamış bir tur ya da fiziksel
 * olarak imkânsız bir süre kaydedilemez.
 */
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
  v_min_ms integer;
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
  v_min_ms := case
    when v_round.daily_day is null and v_round.room_id is null then c_questions * c_min_answer_ms
    else (c_questions - 1) * c_transition_ms + c_questions * c_min_answer_ms
  end;

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

/*
 * Profil sayfasının verisi (app/profil): hesap türü, ilk oyun, tur özeti (tur, doğru, cevap, en uzun seri, oynanan
 * gün), her modda en iyi sonuç, son 10 tur, düello sayıları ve son 100 düello.
 * Girişsiz oyuncunun turları ve antrenman kaydedilmediği için yer almaz; oda turları dahildir.
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
    -- Her sıralamada oyuncunun en iyi sonucu (puan, süre, en uzun seri sırasıyla). Genel sıralama kalktığı için sıra yok.
    'boards', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'game_mode', mine.game_mode,
          'variant', mine.variant,
          'score', mine.score,
          'duration_ms', mine.duration_ms
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
      -- Şimşek yalnızca günün meydan okumasında sayılır: serbest turda her cevaptan sonra beklenmediği için süreler karşılaştırılamaz.
      select game_mode, variant, max(score)::integer as score, bool_or(score = 10 and duration_ms < 45000 and daily_day is not null) as lightning
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
    -- Günün meydan okumalarındaki en iyi sıra (bugüne kadarki bütün günler ve modlar); sıralamayla aynı ölçüt (puan, süre, en
    -- uzun seri). O gün o modu en az 3 oyuncu bitirmediyse sayılmaz: tek başına oynanan günde birinci olmak bir başarı değil.
    -- 0: günlük sıralamada böyle bir sıra yok. Genel (tüm zamanlar) sıralama kalktığı için rozetler artık günlüğe bağlı.
    best_rank as (
      select coalesce(min(1 + (
        select count(*) from do_harita_avcisi.game_results other
        where other.daily_day = mine.daily_day and other.game_mode = mine.game_mode and other.variant = mine.variant
          and other.user_id <> v_user_id
          and (other.score, -other.duration_ms, other.best_streak) > (mine.score, -mine.duration_ms, mine.best_streak)
      )), 0)::integer as value
      from do_harita_avcisi.game_results mine
      where mine.user_id = v_user_id and mine.daily_day is not null
        and (
          select count(*) from do_harita_avcisi.game_results other
          where other.daily_day = mine.daily_day and other.game_mode = mine.game_mode and other.variant = mine.variant
        ) >= 3
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

revoke all on function do_harita_avcisi.my_badges() from public, anon;
grant execute on function do_harita_avcisi.my_badges() to authenticated;

/*
 * Oyuncunun bir moddaki zayıf yerleri: en çok yanlış yaptığı yerler, kötüden iyiye. Yalnızca oyuncunun kendi cevapları
 * okunur (round_answers tarayıcıya kapalıdır; bu fonksiyon yalnızca auth.uid() satırlarını toplar). Sıralama,
 * herkesin "en çok yanlış yapılanlar" listesiyle aynı ölçüyü kullanır: yanlış oranının güvenilir alt sınırı (Wilson,
 * %95). Bir kez sorulup bir kez yanlış bilinen yer, çok sorulup çoğunda yanlış bilinen yerin önüne geçmez.
 *
 * Eski cevaplar daha az sayılır: son 30 gündeki cevap tam, daha eskisi yarım ağırlıkla sayılır. Oyuncu bir yeri
 * öğrendikçe oranı düşer ve liste yeni yanlışlara döner. Hiç yanlışı olmayan yer listeye girmez. p_limit kadar yer döner
 * (en çok 50). Her yer için: location_id, asked, wrong, en çok neyle karıştırıldığı (most_confused_with) ve son cevap tarihi.
 */
create or replace function do_harita_avcisi.my_weak_spots(p_game_mode text, p_variant text, p_limit integer default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 50);
  v_spots jsonb;
begin
  if v_user_id is null then
    raise exception 'Zayıf yerler için giriş gerekir.';
  end if;
  if not ((p_game_mode = 'turkey' and p_variant in ('normal', 'plates')) or (p_game_mode = 'world' and p_variant in ('hard', 'flags', 'capitals'))) then
    raise exception 'Geçersiz mod: % / %', p_game_mode, p_variant;
  end if;

  with mine as (
    select
      location_id,
      selected_id,
      is_correct,
      created_at,
      -- Son 30 gün tam, daha eskisi yarım ağırlık.
      case when created_at >= now() - interval '30 days' then 1.0 else 0.5 end as weight
    from do_harita_avcisi.round_answers
    where user_id = v_user_id and game_mode = p_game_mode and variant = p_variant
  ),
  totals as (
    select
      location_id,
      count(*)::integer as asked,
      count(*) filter (where not is_correct)::integer as wrong,
      sum(weight) as weighted_asked,
      sum(weight) filter (where not is_correct) as weighted_wrong,
      max(created_at) as last_at
    from mine
    group by location_id
    having count(*) filter (where not is_correct) > 0
  ),
  confusions as (
    select distinct on (location_id) location_id, selected_id
    from mine
    where not is_correct
    group by location_id, selected_id
    order by location_id, count(*) desc, selected_id
  ),
  scored as (
    select
      totals.*,
      confusions.selected_id as most_confused_with,
      -- Wilson alt sınırı (z = 1,96), ağırlıklı sayılarla.
      (
        (totals.weighted_wrong / totals.weighted_asked) + (1.96 * 1.96) / (2 * totals.weighted_asked)
        - 1.96 * sqrt(
          ((totals.weighted_wrong / totals.weighted_asked) * (1 - totals.weighted_wrong / totals.weighted_asked)) / totals.weighted_asked
          + (1.96 * 1.96) / (4 * totals.weighted_asked * totals.weighted_asked)
        )
      ) / (1 + (1.96 * 1.96) / totals.weighted_asked) as score
    from totals
    join confusions using (location_id)
  )
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'location_id', location_id,
      'asked', asked,
      'wrong', wrong,
      'most_confused_with', most_confused_with,
      'last_at', last_at
    ) order by score desc, wrong desc, location_id
  ), '[]'::jsonb)
  into v_spots
  from (select * from scored order by score desc, wrong desc, location_id limit v_limit) as top;

  return v_spots;
end;
$$;

revoke all on function do_harita_avcisi.my_weak_spots(text, text, integer) from public, anon;
grant execute on function do_harita_avcisi.my_weak_spots(text, text, integer) to authenticated;

grant execute on function do_harita_avcisi.my_weak_spots(text, text, integer) to service_role;

commit;

notify pgrst, 'reload schema';
