-- Cursor-style workspace chat: threads are per user, not tied to a single document.
-- RAG / apply still use whichever file is focused in the client.

alter table public.agent_conversations alter column doc_id drop not null;

-- Existing per-doc threads become workspace-visible (same history, one rail).
update public.agent_conversations set doc_id = null where doc_id is not null;

create index if not exists agent_conversations_user_updated_idx
  on public.agent_conversations (user_id, updated_at desc);
