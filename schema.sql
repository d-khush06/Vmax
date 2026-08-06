-- VMAX Multi-tenant Supabase Schema

-- 1. Users Extension (Maps to auth.users)
create table if not exists users (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);
alter publication supabase_realtime add table users;

-- 2. Teams
create table if not exists teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  join_code text not null unique,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);
alter publication supabase_realtime add table teams;

-- 3. Team Members
create table if not exists team_members (
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references users(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);
alter publication supabase_realtime add table team_members;

-- 4. Kanban Tasks (Multi-tenant)
create table if not exists kanban_tasks (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  content text not null,
  column_id text not null default 'todo',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);
alter publication supabase_realtime add table kanban_tasks;

-- 5. Calendar Events (Multi-tenant)
create table if not exists calendar_events (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz default now()
);
alter publication supabase_realtime add table calendar_events;

-- 6. Chat Messages (Multi-tenant)
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references teams(id) on delete cascade not null,
  channel_id text default 'general',
  content text not null,
  user_id uuid references users(id) on delete cascade,
  created_at timestamptz default now()
);
alter publication supabase_realtime add table messages;

-- Trigger to automatically create a user profile when a new auth user signs up
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists to prevent errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
