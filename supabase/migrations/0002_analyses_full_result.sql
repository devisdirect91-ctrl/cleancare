-- Store the complete LLM result (summary, scores, ingredients) alongside the
-- normalized columns already used for product matching.
alter table public.analyses
  add column full_result jsonb not null default '{}';
