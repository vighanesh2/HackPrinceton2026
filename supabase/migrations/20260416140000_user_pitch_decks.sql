-- Embedded pitch deck PDF per user (metadata + Storage object at {user_id}/embedded.pdf).
-- Run in Supabase SQL Editor after user_one_pagers migration.

create table if not exists public.user_pitch_decks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  filename text not null default 'deck.pdf',
  mime text not null default 'application/pdf',
  object_key text not null,
  updated_at timestamptz not null default now()
);

create index if not exists user_pitch_decks_updated_at_idx on public.user_pitch_decks (updated_at desc);

alter table public.user_pitch_decks enable row level security;

drop policy if exists "user_pitch_decks_select_own" on public.user_pitch_decks;
drop policy if exists "user_pitch_decks_insert_own" on public.user_pitch_decks;
drop policy if exists "user_pitch_decks_update_own" on public.user_pitch_decks;
drop policy if exists "user_pitch_decks_delete_own" on public.user_pitch_decks;

create policy "user_pitch_decks_select_own"
  on public.user_pitch_decks for select
  using (auth.uid() = user_id);

create policy "user_pitch_decks_insert_own"
  on public.user_pitch_decks for insert
  with check (auth.uid() = user_id);

create policy "user_pitch_decks_update_own"
  on public.user_pitch_decks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_pitch_decks_delete_own"
  on public.user_pitch_decks for delete
  using (auth.uid() = user_id);

grant select, insert, update, delete on table public.user_pitch_decks to authenticated;
grant all on table public.user_pitch_decks to service_role;

-- Private bucket for PDFs (50 MB max; matches practical embed limits).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pitch-decks',
  'pitch-decks',
  false,
  52428800,
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "pitch_decks_select_own" on storage.objects;
drop policy if exists "pitch_decks_insert_own" on storage.objects;
drop policy if exists "pitch_decks_update_own" on storage.objects;
drop policy if exists "pitch_decks_delete_own" on storage.objects;

-- Path must be {auth.uid()}/... so each user only touches their prefix.
create policy "pitch_decks_select_own"
  on storage.objects for select
  using (
    bucket_id = 'pitch-decks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pitch_decks_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'pitch-decks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pitch_decks_update_own"
  on storage.objects for update
  using (
    bucket_id = 'pitch-decks'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'pitch-decks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pitch_decks_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'pitch-decks'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
