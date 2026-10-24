-- Tek seferlik geçiş: yarış turunun soruları sunucuda seçilir ve skor bunlarla doğrulanır.
-- Supabase SQL Editor'da bir kez çalıştırın (tek transaction). Kalıcı tanım supabase/schema.sql'dedir; işi bitince bu
-- dosya silinebilir. Eski uygulamaların kullandığı start_round değişmez, onların turları eskisi gibi kaydedilir.

begin;

alter table do_harita_avcisi.game_rounds add column if not exists questions text[];

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

  insert into do_harita_avcisi.game_results (user_id, display_name, avatar_url, game_mode, variant, score, duration_ms, best_streak, room_id, room_round)
  values (v_user_id, coalesce(v_display_name, 'Oyuncu'), v_avatar_url, v_round.game_mode, v_round.variant, v_score, v_duration_ms, v_best_streak,
    v_round.room_id, v_round.room_round)
  returning id into v_result_id;

  insert into do_harita_avcisi.round_answers (result_id, user_id, game_mode, variant, position, location_id, selected_id, is_correct)
  select
    v_result_id, v_user_id, v_round.game_mode, v_round.variant, (item.position - 1)::smallint,
    item.answer ->> 'location', item.answer ->> 'selected', (item.answer ->> 'location') = (item.answer ->> 'selected')
  from jsonb_array_elements(p_answers) with ordinality as item(answer, position);
end;
$$;

/*
 * Yarış turunu açar ve 10 sorusunu sunucuda seçer (düello ve odayla aynı havuzdan, duel_pool). Sorular turla
 * birlikte saklanır ve tarayıcıya sırayla döner; finish_round cevapları bunlarla karşılaştırır.
 * start_round eski uygulamalar için duruyor: onunla açılan turun sorusu saklanmaz, sonucu yalnızca süre ve biçim
 * kontrolüyle kaydedilir. Uygulamaların hepsi start_ranked_round'a geçince start_round kapatılmalı.
 */
create or replace function do_harita_avcisi.start_ranked_round(p_game_mode text, p_variant text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round_id uuid := do_harita_avcisi.start_round(p_game_mode, p_variant);
  v_questions text[];
begin
  select array_agg(location_id) into v_questions
  from (
    select location_id
    from unnest(do_harita_avcisi.duel_pool(p_game_mode, p_variant)) as location_id
    order by random()
    limit 10
  ) as picked;

  update do_harita_avcisi.game_rounds set questions = v_questions where id = v_round_id;

  return jsonb_build_object('round_id', v_round_id, 'questions', to_jsonb(v_questions));
end;
$$;

revoke all on function do_harita_avcisi.start_round(text, text) from public, anon;
revoke all on function do_harita_avcisi.start_ranked_round(text, text) from public, anon;
revoke all on function do_harita_avcisi.finish_round(uuid, integer, jsonb) from public, anon;
grant execute on function do_harita_avcisi.start_round(text, text) to authenticated;
grant execute on function do_harita_avcisi.start_ranked_round(text, text) to authenticated;
grant execute on function do_harita_avcisi.finish_round(uuid, integer, jsonb) to authenticated;

commit;
