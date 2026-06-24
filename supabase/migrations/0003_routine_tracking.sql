-- Routine tracking + sélection de la routine active -------------------------

-- Quelle analyse pilote la routine active de l'utilisateur (défaut = dernière).
alter table public.profiles
  add column if not exists active_analysis_id uuid
    references public.analyses (id) on delete set null;

-- Journal de complétion des étapes de routine (1 ligne = 1 étape cochée).
create table if not exists public.routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  log_date date not null,
  slot text not null check (slot in ('morning', 'evening')),
  step_index int not null,
  created_at timestamptz not null default now(),
  unique (user_id, log_date, slot, step_index)
);

alter table public.routine_logs enable row level security;

create policy "Users can view own routine logs"
  on public.routine_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own routine logs"
  on public.routine_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own routine logs"
  on public.routine_logs for delete
  using (auth.uid() = user_id);

create index if not exists routine_logs_user_date_idx
  on public.routine_logs (user_id, log_date);
