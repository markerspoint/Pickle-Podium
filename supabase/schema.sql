-- Pickle Podium database. Run this once in Supabase: SQL Editor → New query → paste → Run.
-- It is safe to run again.

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  nickname text not null default '',
  city text not null default '',
  home_club text not null default '',
  bio text not null default '',
  photo_url text not null default '',
  is_published boolean not null default true,
  fictional_example boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  tournament_name text not null,
  event_date date not null,
  placement text not null check (placement in ('Gold', 'Silver', 'Bronze')),
  skill_level text not null check (skill_level in ('Beginner', 'Novice', 'Intermediate', 'Advanced', 'Open')),
  division text not null check (division in ('Men''s Doubles', 'Women''s Doubles', 'Mixed Doubles')),
  partner_name text not null default '',
  proof_url text not null default '',
  notes text not null default '',
  is_published boolean not null default true,
  fictional_example boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists achievements_player_id_idx on public.achievements (player_id);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('New Achievement', 'Correction to Existing Record')),
  player_name text not null,
  partner_name text not null default '',
  tournament_name text not null,
  event_date date not null,
  skill_level text not null check (skill_level in ('Beginner', 'Novice', 'Intermediate', 'Advanced', 'Open')),
  placement text not null check (placement in ('Gold', 'Silver', 'Bronze')),
  division text not null check (division in ('Men''s Doubles', 'Women''s Doubles', 'Mixed Doubles')),
  proof_url text not null default '',
  notes text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text not null default '',
  created_at timestamptz not null default now()
);

-- Who may edit. Add yourself after creating your login (see README):
--   insert into public.admins select id from auth.users where email = 'you@example.com';
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.players enable row level security;
alter table public.achievements enable row level security;
alter table public.submissions enable row level security;
alter table public.admins enable row level security; -- no policies: nobody reads or writes it through the API

-- Visitors read published records; admins read and change everything.
drop policy if exists "read published players" on public.players;
create policy "read published players" on public.players for select using (is_published or public.is_admin());
drop policy if exists "admins manage players" on public.players;
create policy "admins manage players" on public.players for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "read published achievements" on public.achievements;
create policy "read published achievements" on public.achievements for select using (is_published or public.is_admin());
drop policy if exists "admins manage achievements" on public.achievements;
create policy "admins manage achievements" on public.achievements for all using (public.is_admin()) with check (public.is_admin());

-- Anyone may send a submission; only admins can read or decide on them.
drop policy if exists "anyone submits" on public.submissions;
create policy "anyone submits" on public.submissions for insert with check (status = 'pending' and admin_note = '');
drop policy if exists "admins manage submissions" on public.submissions;
create policy "admins manage submissions" on public.submissions for all using (public.is_admin()) with check (public.is_admin());

grant select on public.players, public.achievements to anon, authenticated;
grant insert on public.submissions to anon, authenticated;
grant all on public.players, public.achievements, public.submissions to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
