-- Market tab: TAM/SAM/SOM sizing + competitive landscape HTML per user.

create table if not exists public.user_market_workspace (
  user_id uuid primary key references auth.users (id) on delete cascade,
  sizing jsonb not null default '{"tam":0,"sam":0,"som":0}'::jsonb,
  competitive_html text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists user_market_workspace_updated_at_idx on public.user_market_workspace (updated_at desc);

alter table public.user_market_workspace enable row level security;

drop policy if exists "user_market_workspace_select_own" on public.user_market_workspace;
drop policy if exists "user_market_workspace_insert_own" on public.user_market_workspace;
drop policy if exists "user_market_workspace_update_own" on public.user_market_workspace;
drop policy if exists "user_market_workspace_delete_own" on public.user_market_workspace;

create policy "user_market_workspace_select_own"
  on public.user_market_workspace for select
  using (auth.uid() = user_id);

create policy "user_market_workspace_insert_own"
  on public.user_market_workspace for insert
  with check (auth.uid() = user_id);

create policy "user_market_workspace_update_own"
  on public.user_market_workspace for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_market_workspace_delete_own"
  on public.user_market_workspace for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_market_workspace to authenticated;
grant all on table public.user_market_workspace to service_role;
