-- Profiles --------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  trial_ends_at timestamptz not null default (now() + interval '7 days'),
  subscription_status text not null default 'trial'
    check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  stripe_customer_id text
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile row on signup -------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, trial_ends_at, subscription_status)
  values (new.id, new.email, now() + interval '7 days', 'trial');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Products ----------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  category text not null,
  price_eur numeric(10, 2) not null,
  for_skin_types text[] not null default '{}',
  affiliate_url text,
  image_url text,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "Products are publicly readable"
  on public.products for select
  using (true);

-- Analyses ------------------------------------------------------------------
create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  photo_url text,
  skin_type text,
  concerns jsonb not null default '[]',
  undertone text,
  routine_morning jsonb not null default '[]',
  routine_evening jsonb not null default '[]',
  recommended_products jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table public.analyses enable row level security;

create policy "Users can view own analyses"
  on public.analyses for select
  using (auth.uid() = user_id);

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (auth.uid() = user_id);

create index analyses_user_id_idx on public.analyses (user_id);

-- Storage: user-photos bucket ------------------------------------------------
insert into storage.buckets (id, name, public)
values ('user-photos', 'user-photos', false)
on conflict (id) do nothing;

create policy "Users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own photos"
  on storage.objects for select
  using (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'user-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Auto-delete photos older than 30 days -------------------------------------
-- Requires pg_cron extension (enabled by default on Supabase projects).
create extension if not exists pg_cron;

select cron.schedule(
  'delete-old-user-photos',
  '0 3 * * *',
  $$
  delete from storage.objects
  where bucket_id = 'user-photos'
    and created_at < now() - interval '30 days';
  $$
);
