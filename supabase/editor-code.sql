-- Editor code: only people who know the shared code can add, edit or delete songs.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Then set the code with the block at the end of this file (never commit it).
--
-- After this runs, the browser can no longer insert, edit or delete rows in
-- `songs` directly. It goes through add_song() / update_song() / delete_song(),
-- which check the code. Anyone can still read songs and update last_sung.
--
-- Already ran an older version of this file? Just run the update_song block
-- (function + its revoke/grant lines) again; the rest is unchanged.

create extension if not exists pgcrypto with schema extensions;

-- The `private` schema is not exposed by the Supabase API, so the hash
-- cannot be read from the browser.
create schema if not exists private;

create table if not exists private.editor_code (
  id   int  primary key default 1 check (id = 1),  -- a single row
  hash text not null                              -- bcrypt hash of the code
);

revoke all on schema private from anon, authenticated;
revoke all on private.editor_code from anon, authenticated;

-- Raises 'invalid_editor_code' (SQLSTATE 28000) when the code is wrong.
-- The 1 s pause slows down guessing.
create or replace function private.assert_editor_code(p_code text) returns void
language plpgsql
security definer
set search_path = private, extensions
as $$
begin
  if p_code is null or not exists (
    select 1 from private.editor_code where hash = crypt(p_code, hash)
  ) then
    perform pg_sleep(1);
    raise exception 'invalid_editor_code' using errcode = '28000';
  end if;
end;
$$;

revoke all on function private.assert_editor_code(text) from public;

-- Lets the app validate a code when someone types it in.
create or replace function public.check_editor_code(p_code text) returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform private.assert_editor_code(p_code);
  return true;
exception
  when sqlstate '28000' then
    return false;
end;
$$;

create or replace function public.add_song(
  p_title text,
  p_music_scale text,
  p_code text
) returns songs
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_song songs;
begin
  perform private.assert_editor_code(p_code);
  insert into songs (title, music_scale)
       values (p_title, p_music_scale)
    returning * into new_song;
  return new_song;
end;
$$;

-- Changes a song's title and key.
create or replace function public.update_song(
  p_id bigint,
  p_title text,
  p_music_scale text,
  p_code text
) returns songs
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  updated songs;
begin
  perform private.assert_editor_code(p_code);
  update songs
     set title = p_title, music_scale = p_music_scale
   where id = p_id
  returning * into updated;
  return updated;
end;
$$;

revoke all on function public.update_song(bigint, text, text, text) from public;
grant execute on function public.update_song(bigint, text, text, text) to anon, authenticated;

-- Its setlist_songs rows go with it (cascade).
create or replace function public.delete_song(p_id bigint, p_code text) returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  perform private.assert_editor_code(p_code);
  delete from songs where id = p_id;
end;
$$;

revoke all on function public.check_editor_code(text) from public;
revoke all on function public.add_song(text, text, text) from public;
revoke all on function public.delete_song(bigint, text) from public;
grant execute on function public.check_editor_code(text) to anon, authenticated;
grant execute on function public.add_song(text, text, text) to anon, authenticated;
grant execute on function public.delete_song(bigint, text) to anon, authenticated;

-- Lock the songs table: reading and updating last_sung stay open, nothing else.
alter table songs enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'songs'
  loop
    execute format('drop policy %I on public.songs', pol.policyname);
  end loop;
end;
$$;

create policy "public read"   on songs for select using (true);
create policy "public update" on songs for update using (true) with check (true);

revoke insert, delete, update on songs from anon, authenticated;
grant select on songs to anon, authenticated;
grant update (last_sung) on songs to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Set or change the code. Run separately, with your real code in place of
-- CHANGE-ME, and don't save it in this file. Phones that stored the old code
-- are asked for the new one automatically.
--
-- insert into private.editor_code (hash)
--      values (extensions.crypt('CHANGE-ME', extensions.gen_salt('bf')))
-- on conflict (id) do update set hash = excluded.hash;
--
-- Check: select public.check_editor_code('CHANGE-ME');   -- true
--        select public.check_editor_code('wrong');       -- false (after 1 s)
--        select * from pg_policies where tablename = 'songs';
