-- TaskFlow (Trello Clone) - Supabase PostgreSQL Schema & RLS Policies
-- Run this script in your Supabase project's SQL Editor.

-- 1. Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null,
  description text not null default '',
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes for fast board/list/card ordering queries
create index if not exists idx_boards_user_id on public.boards(user_id);
create index if not exists idx_lists_board_id_pos on public.lists(board_id, position);
create index if not exists idx_cards_list_id_pos on public.cards(list_id, position);
create index if not exists idx_cards_board_id_pos on public.cards(board_id, position);

-- 3. Helper triggers for updated_at and profile creation
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_boards_updated_at on public.boards;
create trigger trg_boards_updated_at
  before update on public.boards
  for each row execute function public.set_updated_at();

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
  before update on public.cards
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any existing auth users
insert into public.profiles (id, email, full_name)
select id, coalesce(email, ''), coalesce(raw_user_meta_data->>'full_name', '')
from auth.users
on conflict (id) do nothing;

-- 4. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.boards enable row level security;
alter table public.lists enable row level security;
alter table public.cards enable row level security;

-- Profiles policies
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Boards policies
drop policy if exists "Users can view own boards" on public.boards;
create policy "Users can view own boards"
  on public.boards for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own boards" on public.boards;
create policy "Users can create own boards"
  on public.boards for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own boards" on public.boards;
create policy "Users can update own boards"
  on public.boards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own boards" on public.boards;
create policy "Users can delete own boards"
  on public.boards for delete
  using (auth.uid() = user_id);

-- Lists policies
drop policy if exists "Users can view lists on own boards" on public.lists;
create policy "Users can view lists on own boards"
  on public.lists for select
  using (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create lists on own boards" on public.lists;
create policy "Users can create lists on own boards"
  on public.lists for insert
  with check (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update lists on own boards" on public.lists;
create policy "Users can update lists on own boards"
  on public.lists for update
  using (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can delete lists on own boards" on public.lists;
create policy "Users can delete lists on own boards"
  on public.lists for delete
  using (
    exists (
      select 1 from public.boards b
      where b.id = lists.board_id and b.user_id = auth.uid()
    )
  );

-- Cards policies
drop policy if exists "Users can view cards on own boards" on public.cards;
create policy "Users can view cards on own boards"
  on public.cards for select
  using (
    exists (
      select 1 from public.boards b
      where b.id = cards.board_id and b.user_id = auth.uid()
    )
  );

drop policy if exists "Users can create cards on own boards" on public.cards;
create policy "Users can create cards on own boards"
  on public.cards for insert
  with check (
    exists (
      select 1 from public.boards b
      where b.id = cards.board_id and b.user_id = auth.uid()
    )
    and exists (
      select 1 from public.lists l
      where l.id = cards.list_id and l.board_id = cards.board_id
    )
  );

drop policy if exists "Users can update cards on own boards" on public.cards;
create policy "Users can update cards on own boards"
  on public.cards for update
  using (
    exists (
      select 1 from public.boards b
      where b.id = cards.board_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.boards b
      where b.id = cards.board_id and b.user_id = auth.uid()
    )
    and exists (
      select 1 from public.lists l
      where l.id = cards.list_id and l.board_id = cards.board_id
    )
  );

drop policy if exists "Users can delete cards on own boards" on public.cards;
create policy "Users can delete cards on own boards"
  on public.cards for delete
  using (
    exists (
      select 1 from public.boards b
      where b.id = cards.board_id and b.user_id = auth.uid()
    )
  );
