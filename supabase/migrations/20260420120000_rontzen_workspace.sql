-- Rontzen workspace: company profile, documents, RAG chunks (pgvector), claims, issues, decision log.
-- Run via Supabase CLI or SQL Editor. Requires pgvector.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- company_context: one row per user (JSON profile extracted from onboarding)
-- ---------------------------------------------------------------------------
create table if not exists public.company_context (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists company_context_updated_at_idx on public.company_context (updated_at desc);

alter table public.company_context enable row level security;

drop policy if exists "company_context_select_own" on public.company_context;
drop policy if exists "company_context_insert_own" on public.company_context;
drop policy if exists "company_context_update_own" on public.company_context;

create policy "company_context_select_own"
  on public.company_context for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "company_context_insert_own"
  on public.company_context for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "company_context_update_own"
  on public.company_context for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.company_context to authenticated;

-- ---------------------------------------------------------------------------
-- documents: workspace docs (doc_type = classified template bucket for RAG/metadata)
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_type text not null,
  title text not null,
  body_html text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists documents_user_id_idx on public.documents (user_id);
create index if not exists documents_user_updated_idx on public.documents (user_id, updated_at desc);

alter table public.documents enable row level security;

drop policy if exists "documents_select_own" on public.documents;
drop policy if exists "documents_insert_own" on public.documents;
drop policy if exists "documents_update_own" on public.documents;
drop policy if exists "documents_delete_own" on public.documents;

create policy "documents_select_own"
  on public.documents for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "documents_insert_own"
  on public.documents for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "documents_update_own"
  on public.documents for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "documents_delete_own"
  on public.documents for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.documents to authenticated;

-- ---------------------------------------------------------------------------
-- document_chunks: RAG segments + embedding (nomic-embed-text = 768 dims)
-- ---------------------------------------------------------------------------
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_id uuid not null references public.documents (id) on delete cascade,
  chunk_index int not null,
  chunk_body text not null,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  embedding vector(768),
  fts tsvector generated always as (to_tsvector('english', coalesce(chunk_body, ''))) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (doc_id, chunk_index)
);

create index if not exists document_chunks_user_doc_idx on public.document_chunks (user_id, doc_id);
create index if not exists document_chunks_fts_idx on public.document_chunks using gin (fts);

-- HNSW index for similarity search (cosine)
create index if not exists document_chunks_embedding_hnsw_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

alter table public.document_chunks enable row level security;

drop policy if exists "document_chunks_select_own" on public.document_chunks;
drop policy if exists "document_chunks_insert_own" on public.document_chunks;
drop policy if exists "document_chunks_update_own" on public.document_chunks;
drop policy if exists "document_chunks_delete_own" on public.document_chunks;

create policy "document_chunks_select_own"
  on public.document_chunks for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "document_chunks_insert_own"
  on public.document_chunks for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "document_chunks_update_own"
  on public.document_chunks for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "document_chunks_delete_own"
  on public.document_chunks for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.document_chunks to authenticated;

-- ---------------------------------------------------------------------------
-- document_claims: canonical numeric / structured claims per doc
-- ---------------------------------------------------------------------------
create table if not exists public.document_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_id uuid not null references public.documents (id) on delete cascade,
  claim_key text not null,
  claim_value jsonb not null,
  source_span jsonb,
  confidence real not null default 0.8,
  updated_at timestamptz not null default now(),
  unique (doc_id, claim_key)
);

create index if not exists document_claims_user_key_idx on public.document_claims (user_id, claim_key);
create index if not exists document_claims_doc_idx on public.document_claims (doc_id);

alter table public.document_claims enable row level security;

drop policy if exists "document_claims_select_own" on public.document_claims;
drop policy if exists "document_claims_insert_own" on public.document_claims;
drop policy if exists "document_claims_update_own" on public.document_claims;
drop policy if exists "document_claims_delete_own" on public.document_claims;

create policy "document_claims_select_own"
  on public.document_claims for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "document_claims_insert_own"
  on public.document_claims for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "document_claims_update_own"
  on public.document_claims for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "document_claims_delete_own"
  on public.document_claims for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.document_claims to authenticated;

-- ---------------------------------------------------------------------------
-- consistency_issues: cross-doc flags (metric | narrative)
-- ---------------------------------------------------------------------------
create table if not exists public.consistency_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  severity text not null,
  issue_type text not null,
  summary text not null,
  source_doc_id uuid references public.documents (id) on delete set null,
  target_doc_id uuid references public.documents (id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists consistency_issues_user_status_idx on public.consistency_issues (user_id, status);
create index if not exists consistency_issues_target_doc_idx on public.consistency_issues (target_doc_id);

alter table public.consistency_issues enable row level security;

drop policy if exists "consistency_issues_select_own" on public.consistency_issues;
drop policy if exists "consistency_issues_insert_own" on public.consistency_issues;
drop policy if exists "consistency_issues_update_own" on public.consistency_issues;
drop policy if exists "consistency_issues_delete_own" on public.consistency_issues;

create policy "consistency_issues_select_own"
  on public.consistency_issues for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "consistency_issues_insert_own"
  on public.consistency_issues for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "consistency_issues_update_own"
  on public.consistency_issues for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "consistency_issues_delete_own"
  on public.consistency_issues for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.consistency_issues to authenticated;

-- ---------------------------------------------------------------------------
-- document_edits: Decision log / paper trail
-- ---------------------------------------------------------------------------
create table if not exists public.document_edits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  doc_id uuid not null references public.documents (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  author_display text not null,
  source text not null,
  action text not null,
  range_from int,
  range_to int,
  text_before text,
  text_after text,
  diff_stats jsonb,
  rationale text,
  created_at timestamptz not null default now()
);

create index if not exists document_edits_doc_time_idx on public.document_edits (doc_id, created_at desc);
create index if not exists document_edits_user_time_idx on public.document_edits (user_id, created_at desc);

alter table public.document_edits enable row level security;

drop policy if exists "document_edits_select_own" on public.document_edits;
drop policy if exists "document_edits_insert_own" on public.document_edits;
drop policy if exists "document_edits_delete_own" on public.document_edits;

create policy "document_edits_select_own"
  on public.document_edits for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "document_edits_insert_own"
  on public.document_edits for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "document_edits_delete_own"
  on public.document_edits for delete to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.document_edits to authenticated;

-- ---------------------------------------------------------------------------
-- Hybrid search: keyword + vector (RPC for vector leg)
-- ---------------------------------------------------------------------------
create or replace function public.match_document_chunks(
  p_query_embedding vector(768),
  p_match_count int,
  p_user_id uuid,
  p_doc_ids uuid[] default null
)
returns table (
  id uuid,
  doc_id uuid,
  chunk_index int,
  chunk_text text,
  metadata jsonb,
  distance float
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    c.id,
    c.doc_id,
    c.chunk_index,
    c.chunk_body as chunk_text,
    c.metadata,
    (c.embedding <=> p_query_embedding)::float as distance
  from public.document_chunks c
  where c.user_id = p_user_id
    and c.embedding is not null
    and (p_doc_ids is null or c.doc_id = any (p_doc_ids))
  order by c.embedding <=> p_query_embedding
  limit least(coalesce(p_match_count, 10), 50);
$$;

grant execute on function public.match_document_chunks(vector, int, uuid, uuid[]) to authenticated;
