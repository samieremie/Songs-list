-- Sub-lists (setlists): songs planned for a specific service date.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Safe to run again: it is how you apply updates to this file.
--
-- Before running: check in Table Editor that songs.id is int8 (bigint).
-- If it is uuid, change the type of setlist_songs.song_id below to uuid.

create table if not exists setlists (
  id bigint generated always as identity primary key,
  date date not null unique,                 -- one list per date
  created_at timestamptz not null default now()
);

create table if not exists setlist_songs (
  setlist_id bigint not null references setlists(id) on delete cascade,
  song_id    bigint not null references songs(id)    on delete cascade,
  position   int    not null,
  primary key (setlist_id, song_id)          -- a song appears once per list
);

-- Same open access as `songs` (the app has no login).
alter table setlists enable row level security;
alter table setlist_songs enable row level security;

drop policy if exists "public access" on setlists;
drop policy if exists "public access" on setlist_songs;
create policy "public access" on setlists      for all using (true) with check (true);
create policy "public access" on setlist_songs for all using (true) with check (true);

-- Lists are no longer expired automatically. Remove the old hourly job and
-- its function if an earlier version of this file was run.
create extension if not exists pg_cron;

select cron.unschedule('expire-setlists')
 where exists (select 1 from cron.job where jobname = 'expire-setlists');

drop function if exists expire_setlists();

-- Closes a list once its day has passed (Brussels time), in one transaction:
--   * songs NOT in p_unsung_ids get last_sung = the list's date;
--   * songs in p_unsung_ids move to the end of the list of the first Monday
--     after the list's date that is today or later (created if missing);
--   * the closed list is deleted (its setlist_songs rows go with it).
-- Returns the date of the Monday list, or null when no song was moved.
-- Raises SQLSTATE 22023 if the list's day has not passed yet, P0002 if the
-- list does not exist.
create or replace function close_setlist(p_setlist_id bigint, p_unsung_ids bigint[])
returns date
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today      date := (now() at time zone 'Europe/Brussels')::date;
  v_date       date;
  v_from       date;
  v_target     date;
  v_target_id  bigint;
  v_next_pos   int;
begin
  select date into v_date from setlists where id = p_setlist_id for update;
  if not found then
    raise exception 'setlist_not_found' using errcode = 'P0002';
  end if;
  if v_date >= v_today then
    raise exception 'setlist_not_finished' using errcode = '22023';
  end if;

  p_unsung_ids := coalesce(p_unsung_ids, '{}');

  update songs s
     set last_sung = v_date
    from setlist_songs ss
   where ss.setlist_id = p_setlist_id
     and ss.song_id = s.id
     and not (s.id = any(p_unsung_ids))
     and (s.last_sung is null or s.last_sung < v_date);

  if exists (
    select 1 from setlist_songs
     where setlist_id = p_setlist_id and song_id = any(p_unsung_ids)
  ) then
    -- First Monday strictly after the list's date, and not in the past.
    v_from := greatest(v_date + 1, v_today);
    v_target := v_from + ((8 - extract(isodow from v_from)::int) % 7);

    insert into setlists(date) values (v_target) on conflict (date) do nothing;
    select id into v_target_id from setlists where date = v_target;

    select coalesce(max(position), -1) + 1 into v_next_pos
      from setlist_songs where setlist_id = v_target_id;

    insert into setlist_songs(setlist_id, song_id, position)
    select v_target_id, ss.song_id,
           v_next_pos + (row_number() over (order by ss.position))::int - 1
      from setlist_songs ss
     where ss.setlist_id = p_setlist_id
       and ss.song_id = any(p_unsung_ids)
       and not exists (
         select 1 from setlist_songs t
          where t.setlist_id = v_target_id and t.song_id = ss.song_id
       )
    on conflict (setlist_id, song_id) do nothing;
  end if;

  delete from setlists where id = p_setlist_id;
  return v_target;
end;
$$;

revoke all on function close_setlist(bigint, bigint[]) from public;
grant execute on function close_setlist(bigint, bigint[]) to anon, authenticated;

-- Test:  insert into setlists(date) values (current_date - 3) returning id;
--        insert into setlist_songs values (<id>, <song id>, 0);
--        select close_setlist(<id>, array[<song id>]);
