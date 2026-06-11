-- FlowDeck / Werkplek — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.
--
-- Model: one row per user holding their entire app state as JSON ("snapshot").
-- The app upserts this row on every change and pulls it when switching devices.
-- Row-Level Security guarantees each account can only ever touch its own row,
-- which is why the anon key is safe to ship in the client bundle.

create table if not exists public.snapshots (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.snapshots enable row level security;

-- Each user can only read/write/delete their own snapshot row.
create policy "own snapshot select" on public.snapshots
  for select using (auth.uid() = user_id);

create policy "own snapshot insert" on public.snapshots
  for insert with check (auth.uid() = user_id);

create policy "own snapshot update" on public.snapshots
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own snapshot delete" on public.snapshots
  for delete using (auth.uid() = user_id);
