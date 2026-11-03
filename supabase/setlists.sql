-- Sub-lists (setlists): songs planned for a specific service date.
-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
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

-- When a list's date has passed (Brussels time): mark its songs as sung on
-- that date, then delete the list. Its setlist_songs rows go with it (cascade);
-- the songs themselves stay in the main list.
create or replace function expire_setlists() returns void
language sql
security definer
set search_path = public
as $$
  update songs s
     set last_sung = sl.date
    from setlist_songs ss
    join setlists sl on sl.id = ss.setlist_id
   where ss.song_id = s.id
     and sl.date < (now() at time zone 'Europe/Brussels')::date
     and (s.last_sung is null or s.last_sung < sl.date);

  delete from setlists
   where date < (now() at time zone 'Europe/Brussels')::date;
$$;

-- Run the cleanup every hour at minute 15 (pg_cron uses UTC; running hourly
-- keeps the Brussels date check correct across daylight-saving changes).
create extension if not exists pg_cron;

select cron.unschedule('expire-setlists')
 where exists (select 1 from cron.job where jobname = 'expire-setlists');

select cron.schedule('expire-setlists', '15 * * * *', 'select expire_setlists()');

-- Check: select * from cron.job;
-- Test:  insert into setlists(date) values (current_date - 1);
--        select expire_setlists();
