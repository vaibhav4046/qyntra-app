-- Patch 001 — run after schema.sql
-- Ensures upsert keys match: (user_id, provider) unique constraint
-- Already declared via `unique (user_id, provider)` in CREATE TABLE.
-- This file is here only if you reset connectors and need to re-add it.

alter table public.connectors
  drop constraint if exists connectors_user_id_provider_key;
alter table public.connectors
  add constraint connectors_user_id_provider_key unique (user_id, provider);
