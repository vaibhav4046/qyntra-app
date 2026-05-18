-- Patch 002 — email+password authentication
-- Run once in Supabase SQL editor.

alter table public.profiles
  add column if not exists password_hash text,
  add column if not exists password_salt text;
