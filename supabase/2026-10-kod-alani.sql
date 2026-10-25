-- Tek seferlik geçiş: ana ekrandaki tek kod alanı (code_kind). Supabase SQL Editor'da bir kez çalıştırın. Kalıcı tanım
-- supabase/schema.sql'dedir; işi bitince bu dosya silinebilir. Mevcut verilere dokunmaz.

begin;

/*
 * Ana ekrandaki tek kod alanı için: kod bir düelloya mı ('duel') odaya mı ('room') ait; yoksa null. İki kod türü aynı
 * alfabeden ve ayrı tablolardadır, çakışırsa bitmemiş olan, ikisi de bitmemişse düello seçilir. Yalnızca türü söyler;
 * katılmak için giriş ve düellonun / odanın kendi denetimleri gerekir.
 */
create or replace function do_harita_avcisi.code_kind(p_code text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  with
    duel as (select status <> 'finished' as is_open from do_harita_avcisi.duels where code = upper(trim(p_code))),
    room as (select do_harita_avcisi.room_status(r) <> 'finished' as is_open from do_harita_avcisi.rooms r where r.code = upper(trim(p_code)))
  select case
    when exists (select 1 from duel where is_open) then 'duel'
    when exists (select 1 from room where is_open) then 'room'
    when exists (select 1 from duel) then 'duel'
    when exists (select 1 from room) then 'room'
  end;
$$;

revoke all on function do_harita_avcisi.code_kind(text) from public;
grant execute on function do_harita_avcisi.code_kind(text) to anon, authenticated;

commit;

notify pgrst, 'reload schema';
