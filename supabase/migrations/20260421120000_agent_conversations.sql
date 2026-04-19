-- Agent chat threads per workspace document (persistent history).

create table if not exists public.agent_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_id uuid not null references public.documents (id) on delete cascade,
  title text not null default 'New chat',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists agent_conversations_user_doc_updated_idx
  on public.agent_conversations (user_id, doc_id, updated_at desc);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.agent_conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists agent_messages_conversation_created_idx
  on public.agent_messages (conversation_id, created_at asc);

alter table public.agent_conversations enable row level security;
alter table public.agent_messages enable row level security;

drop policy if exists "agent_conversations_select_own" on public.agent_conversations;
drop policy if exists "agent_conversations_insert_own" on public.agent_conversations;
drop policy if exists "agent_conversations_update_own" on public.agent_conversations;
drop policy if exists "agent_conversations_delete_own" on public.agent_conversations;

create policy "agent_conversations_select_own"
  on public.agent_conversations for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "agent_conversations_insert_own"
  on public.agent_conversations for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "agent_conversations_update_own"
  on public.agent_conversations for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "agent_conversations_delete_own"
  on public.agent_conversations for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "agent_messages_select_own" on public.agent_messages;
drop policy if exists "agent_messages_insert_own" on public.agent_messages;
drop policy if exists "agent_messages_delete_own" on public.agent_messages;

create policy "agent_messages_select_own"
  on public.agent_messages for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "agent_messages_insert_own"
  on public.agent_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "agent_messages_delete_own"
  on public.agent_messages for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.agent_conversations to authenticated;
grant select, insert, delete on public.agent_messages to authenticated;
