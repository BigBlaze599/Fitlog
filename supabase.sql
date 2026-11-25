-- FITLOG: execute em um projeto Supabase próprio, no SQL Editor.
-- Habilite Anonymous Sign-Ins em Authentication antes de testar.
begin;
create table if not exists public.fitlog_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  sets integer not null check (sets between 1 and 100),
  reps integer not null check (reps between 1 and 1000),
  weight numeric(6,2) not null check (weight between 0 and 1000),
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create table if not exists public.fitlog_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  exercise_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  sets integer not null check (sets between 1 and 100),
  reps integer not null check (reps between 1 and 1000),
  weight numeric(6,2) not null check (weight between 0 and 1000),
  completed_at timestamptz not null default now(),
  foreign key (exercise_id, user_id) references public.fitlog_exercises(id, user_id) on delete cascade
);
create index if not exists fitlog_exercises_user_idx on public.fitlog_exercises(user_id, created_at desc);
create index if not exists fitlog_logs_user_idx on public.fitlog_logs(user_id, completed_at desc);
alter table public.fitlog_exercises enable row level security;
alter table public.fitlog_logs enable row level security;
revoke all on public.fitlog_exercises, public.fitlog_logs from anon, authenticated;
grant select, insert on public.fitlog_exercises, public.fitlog_logs to authenticated;
drop policy if exists fitlog_exercises_read on public.fitlog_exercises;
create policy fitlog_exercises_read on public.fitlog_exercises for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists fitlog_exercises_insert on public.fitlog_exercises;
create policy fitlog_exercises_insert on public.fitlog_exercises for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists fitlog_logs_read on public.fitlog_logs;
create policy fitlog_logs_read on public.fitlog_logs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists fitlog_logs_insert on public.fitlog_logs;
create policy fitlog_logs_insert on public.fitlog_logs for insert to authenticated with check ((select auth.uid()) = user_id);
commit;
