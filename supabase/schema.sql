-- ============================================================
-- RunMate Database Schema  (safe to run multiple times)
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists profiles (
  id                     uuid primary key references auth.users on delete cascade,
  username               text unique not null,
  full_name              text,
  avatar_url             text,
  bio                    text,
  total_distance_km      float   default 0,
  total_runs             int     default 0,
  total_duration_seconds int     default 0,
  weekly_goal_km         float   default 0,
  created_at             timestamptz default now(),
  updated_at             timestamptz default now()
);

create index if not exists idx_profiles_username  on profiles using gin(username gin_trgm_ops);
create index if not exists idx_profiles_full_name on profiles using gin(full_name gin_trgm_ops);

alter table profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on profiles;
create policy "Public profiles are viewable by everyone"
  on profiles for select using (true);

drop policy if exists "Users can update own profile" on profiles;
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

-- ============================================================
-- RUNS
-- ============================================================
create table if not exists runs (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references profiles(id) on delete cascade,
  title                    text,
  distance_km              float   not null default 0,
  duration_seconds         int     not null default 0,
  avg_pace_seconds_per_km  float,
  avg_heart_rate           int,
  max_heart_rate           int,
  calories                 int,
  elevation_gain_m         float,
  route                    jsonb default '[]',
  started_at               timestamptz not null default now(),
  ended_at                 timestamptz,
  is_virtual               boolean default false,
  virtual_room_id          text,
  created_at               timestamptz default now()
);

create index if not exists idx_runs_user_id    on runs(user_id);
create index if not exists idx_runs_started_at on runs(started_at desc);
create index if not exists idx_runs_created_at on runs(created_at desc);

alter table runs enable row level security;

drop policy if exists "Runs are viewable by everyone" on runs;
create policy "Runs are viewable by everyone"
  on runs for select using (true);

drop policy if exists "Users can insert own runs" on runs;
create policy "Users can insert own runs"
  on runs for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own runs" on runs;
create policy "Users can update own runs"
  on runs for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own runs" on runs;
create policy "Users can delete own runs"
  on runs for delete using (auth.uid() = user_id);

-- ============================================================
-- FRIENDSHIPS (follows)
-- ============================================================
create table if not exists friendships (
  id            uuid primary key default gen_random_uuid(),
  follower_id   uuid not null references profiles(id) on delete cascade,
  following_id  uuid not null references profiles(id) on delete cascade,
  status        text not null default 'accepted' check (status in ('pending', 'accepted')),
  created_at    timestamptz default now(),
  unique(follower_id, following_id)
);

create index if not exists idx_friendships_follower  on friendships(follower_id);
create index if not exists idx_friendships_following on friendships(following_id);

alter table friendships enable row level security;

drop policy if exists "Friendships viewable by participants" on friendships;
create policy "Friendships viewable by participants"
  on friendships for select using (
    auth.uid() = follower_id or auth.uid() = following_id
  );

drop policy if exists "Users can create friendships" on friendships;
create policy "Users can create friendships"
  on friendships for insert with check (auth.uid() = follower_id);

drop policy if exists "Users can delete own friendships" on friendships;
create policy "Users can delete own friendships"
  on friendships for delete using (auth.uid() = follower_id);

-- ============================================================
-- LIKES (KUDOS)
-- ============================================================
create table if not exists likes (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references runs(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  created_at  timestamptz default now(),
  unique(run_id, user_id)
);

create index if not exists idx_likes_run_id on likes(run_id);

alter table likes enable row level security;

drop policy if exists "Likes viewable by everyone" on likes;
create policy "Likes viewable by everyone" on likes for select using (true);

drop policy if exists "Users can like runs" on likes;
create policy "Users can like runs" on likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users can unlike runs" on likes;
create policy "Users can unlike runs" on likes for delete using (auth.uid() = user_id);

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists comments (
  id          uuid primary key default gen_random_uuid(),
  run_id      uuid not null references runs(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz default now()
);

create index if not exists idx_comments_run_id on comments(run_id);

alter table comments enable row level security;

drop policy if exists "Comments viewable by everyone" on comments;
create policy "Comments viewable by everyone" on comments for select using (true);

drop policy if exists "Users can add comments" on comments;
create policy "Users can add comments" on comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on comments;
create policy "Users can delete own comments" on comments for delete using (auth.uid() = user_id);

-- ============================================================
-- VIRTUAL ROOMS
-- ============================================================
create table if not exists virtual_rooms (
  id          text primary key,
  host_id     uuid not null references profiles(id) on delete cascade,
  name        text,
  is_active   boolean default true,
  created_at  timestamptz default now()
);

alter table virtual_rooms enable row level security;

drop policy if exists "Virtual rooms viewable by everyone" on virtual_rooms;
create policy "Virtual rooms viewable by everyone" on virtual_rooms for select using (true);

drop policy if exists "Users can create virtual rooms" on virtual_rooms;
create policy "Users can create virtual rooms" on virtual_rooms for insert with check (auth.uid() = host_id);

drop policy if exists "Hosts can update their rooms" on virtual_rooms;
create policy "Hosts can update their rooms" on virtual_rooms for update using (auth.uid() = host_id);

-- ============================================================
-- LIVE LOCATIONS
-- ============================================================
create table if not exists live_locations (
  user_id           uuid primary key references profiles(id) on delete cascade,
  room_id           text references virtual_rooms(id) on delete cascade,
  latitude          float,
  longitude         float,
  distance_km       float default 0,
  duration_seconds  int   default 0,
  updated_at        timestamptz default now()
);

alter table live_locations enable row level security;

drop policy if exists "Live locations viewable by everyone" on live_locations;
create policy "Live locations viewable by everyone" on live_locations for select using (true);

drop policy if exists "Users can update own live location" on live_locations;
create policy "Users can update own live location" on live_locations for all using (auth.uid() = user_id);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
create table if not exists achievements (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  type        text not null,
  earned_at   timestamptz default now(),
  unique(user_id, type)
);

create index if not exists idx_achievements_user_id on achievements(user_id);

alter table achievements enable row level security;

drop policy if exists "Achievements viewable by everyone" on achievements;
create policy "Achievements viewable by everyone" on achievements for select using (true);

drop policy if exists "System can insert achievements" on achievements;
create policy "System can insert achievements" on achievements for insert with check (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

create or replace function increment_profile_stats(
  p_user_id uuid,
  p_distance_km float,
  p_duration_seconds int
) returns void language plpgsql security definer as $$
begin
  update profiles set
    total_distance_km      = total_distance_km + p_distance_km,
    total_runs             = total_runs + 1,
    total_duration_seconds = total_duration_seconds + p_duration_seconds,
    updated_at             = now()
  where id = p_user_id;
end;
$$;

create or replace function get_leaderboard(
  p_period text default 'week',
  p_limit  int  default 25
) returns table (
  rank              bigint,
  user_id           uuid,
  username          text,
  full_name         text,
  avatar_url        text,
  total_distance_km float,
  run_count         bigint
) language plpgsql security definer as $$
declare
  v_start_date timestamptz;
begin
  if p_period = 'week' then
    v_start_date := date_trunc('week', now());
  elsif p_period = 'month' then
    v_start_date := date_trunc('month', now());
  else
    v_start_date := '1970-01-01'::timestamptz;
  end if;

  return query
    select
      row_number() over (order by sum(r.distance_km) desc) as rank,
      p.id as user_id,
      p.username,
      p.full_name,
      p.avatar_url,
      round(sum(r.distance_km)::numeric, 2)::float as total_distance_km,
      count(r.id) as run_count
    from profiles p
    inner join runs r on r.user_id = p.id
    where r.started_at >= v_start_date
    group by p.id, p.username, p.full_name, p.avatar_url
    order by total_distance_km desc
    limit p_limit;
end;
$$;

create or replace function check_achievements() returns trigger language plpgsql security definer as $$
declare
  v_total_km   float;
  v_total_runs int;
  v_hour       int;
begin
  select total_distance_km, total_runs
    into v_total_km, v_total_runs
    from profiles where id = new.user_id;

  v_hour := extract(hour from new.started_at at time zone 'UTC');

  if v_total_runs = 1 then
    insert into achievements (user_id, type) values (new.user_id, 'first_run') on conflict do nothing;
  end if;
  if new.distance_km >= 5 then
    insert into achievements (user_id, type) values (new.user_id, 'run_5k') on conflict do nothing;
  end if;
  if new.distance_km >= 10 then
    insert into achievements (user_id, type) values (new.user_id, 'run_10k') on conflict do nothing;
  end if;
  if new.distance_km >= 21.1 then
    insert into achievements (user_id, type) values (new.user_id, 'run_half_marathon') on conflict do nothing;
  end if;
  if new.distance_km >= 42.2 then
    insert into achievements (user_id, type) values (new.user_id, 'run_marathon') on conflict do nothing;
  end if;
  if v_total_km >= 100 then
    insert into achievements (user_id, type) values (new.user_id, 'total_100k') on conflict do nothing;
  end if;
  if v_total_km >= 500 then
    insert into achievements (user_id, type) values (new.user_id, 'total_500k') on conflict do nothing;
  end if;
  if v_hour >= 5 and v_hour < 7 then
    insert into achievements (user_id, type) values (new.user_id, 'early_bird') on conflict do nothing;
  end if;
  if v_hour >= 22 or v_hour < 5 then
    insert into achievements (user_id, type) values (new.user_id, 'night_runner') on conflict do nothing;
  end if;
  if new.is_virtual then
    insert into achievements (user_id, type) values (new.user_id, 'virtual_run') on conflict do nothing;
  end if;

  return new;
end;
$$;

-- Drop and recreate trigger (safe to re-run)
drop trigger if exists on_run_insert on runs;
create trigger on_run_insert
  after insert on runs
  for each row execute function check_achievements();

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table live_locations;
alter publication supabase_realtime add table comments;
alter publication supabase_realtime add table likes;

-- Reload schema cache
notify pgrst, 'reload schema';
