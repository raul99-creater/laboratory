create extension if not exists pgcrypto;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails
    where lower(email) = lower(coalesce(auth.email(), ''))
  );
$$;

create table if not exists public.admin_emails (
  email text primary key,
  note text default '',
  created_at timestamptz not null default now()
);

alter table public.admin_emails enable row level security;

drop policy if exists admin_emails_self_select on public.admin_emails;
create policy admin_emails_self_select
on public.admin_emails
for select
using (lower(email) = lower(coalesce(auth.email(), '')));

create table if not exists public.site_state (
  slug text primary key,
  payload jsonb not null default '{"lectures":[],"forms":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_state enable row level security;

drop policy if exists site_state_public_read on public.site_state;
create policy site_state_public_read
on public.site_state
for select
using (true);

drop policy if exists site_state_admin_insert on public.site_state;
create policy site_state_admin_insert
on public.site_state
for insert
with check (public.is_admin_user());

drop policy if exists site_state_admin_update on public.site_state;
create policy site_state_admin_update
on public.site_state
for update
using (public.is_admin_user())
with check (public.is_admin_user());

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id text not null,
  viewer_key text default '',
  viewer_name text default '',
  viewer_phone text default '',
  answers jsonb not null default '[]'::jsonb,
  selected_events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.submissions enable row level security;

drop policy if exists submissions_public_insert on public.submissions;
create policy submissions_public_insert
on public.submissions
for insert
with check (true);

drop policy if exists submissions_admin_select on public.submissions;
create policy submissions_admin_select
on public.submissions
for select
using (public.is_admin_user());

create table if not exists public.submission_public (
  id uuid primary key,
  form_id text not null,
  answers jsonb not null default '[]'::jsonb,
  selected_events jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.submission_public enable row level security;

drop policy if exists submission_public_read on public.submission_public;
create policy submission_public_read
on public.submission_public
for select
using (true);

create or replace function public.sync_submission_public()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.submission_public (id, form_id, answers, selected_events, created_at)
  values (new.id, new.form_id, coalesce(new.answers, '[]'::jsonb), coalesce(new.selected_events, '[]'::jsonb), new.created_at)
  on conflict (id) do update
    set form_id = excluded.form_id,
        answers = excluded.answers,
        selected_events = excluded.selected_events,
        created_at = excluded.created_at;
  return new;
end;
$$;

drop trigger if exists trg_sync_submission_public on public.submissions;
create trigger trg_sync_submission_public
after insert on public.submissions
for each row
execute function public.sync_submission_public();
