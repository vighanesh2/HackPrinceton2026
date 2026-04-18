-- One pager workspace per authenticated user. Run in Supabase SQL Editor or via CLI.
create table if not exists public.user_one_pagers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  view_title text not null default '',
  summary_html text not null default '',
  deck_filename text,
  deck_text text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists user_one_pagers_updated_at_idx on public.user_one_pagers (updated_at desc);

alter table public.user_one_pagers enable row level security;

drop policy if exists "user_one_pagers_select_own" on public.user_one_pagers;
drop policy if exists "user_one_pagers_insert_own" on public.user_one_pagers;
drop policy if exists "user_one_pagers_update_own" on public.user_one_pagers;

create policy "user_one_pagers_select_own"
  on public.user_one_pagers for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "user_one_pagers_insert_own"
  on public.user_one_pagers for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "user_one_pagers_update_own"
  on public.user_one_pagers for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
