create extension if not exists pgcrypto;

create table if not exists public.admin_emails (
  email text primary key,
  note text,
  created_at timestamptz not null default now()
);

insert into public.admin_emails(email, note)
values ('admin@example.com', '첫 관리자 이메일')
on conflict (email) do nothing;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt()->>'email', ''))
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text,
  description text,
  cover_note text,
  is_published boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  description text,
  global_deadline_at timestamptz,
  max_responses integer,
  is_published boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  question_type text not null check (question_type in ('short','paragraph','single','multi','dropdown','date','time')),
  title text not null,
  description text,
  is_required boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.form_questions(id) on delete cascade,
  label text not null,
  deadline_at timestamptz,
  capacity integer,
  event_start_at timestamptz,
  event_end_at timestamptz,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  is_published boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references public.forms(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  participant_name text not null,
  participant_phone text not null,
  participant_email text,
  created_at timestamptz not null default now()
);

create table if not exists public.submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  question_id uuid not null references public.form_questions(id) on delete cascade,
  option_ids uuid[] not null default '{}'::uuid[],
  value_text text,
  value_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_forms_program_id on public.forms(program_id);
create index if not exists idx_questions_form_id on public.form_questions(form_id);
create index if not exists idx_options_question_id on public.form_options(question_id);
create index if not exists idx_submissions_form_id on public.submissions(form_id);
create index if not exists idx_submission_answers_form_id on public.submission_answers(form_id);
create index if not exists idx_submission_answers_option_ids on public.submission_answers using gin(option_ids);

drop trigger if exists trg_programs_updated_at on public.programs;
create trigger trg_programs_updated_at before update on public.programs for each row execute function public.set_updated_at();
drop trigger if exists trg_forms_updated_at on public.forms;
create trigger trg_forms_updated_at before update on public.forms for each row execute function public.set_updated_at();
drop trigger if exists trg_questions_updated_at on public.form_questions;
create trigger trg_questions_updated_at before update on public.form_questions for each row execute function public.set_updated_at();
drop trigger if exists trg_options_updated_at on public.form_options;
create trigger trg_options_updated_at before update on public.form_options for each row execute function public.set_updated_at();
drop trigger if exists trg_faqs_updated_at on public.faqs;
create trigger trg_faqs_updated_at before update on public.faqs for each row execute function public.set_updated_at();

alter table public.programs enable row level security;
alter table public.forms enable row level security;
alter table public.form_questions enable row level security;
alter table public.form_options enable row level security;
alter table public.faqs enable row level security;
alter table public.submissions enable row level security;
alter table public.submission_answers enable row level security;

-- Public reads
drop policy if exists programs_public_select on public.programs;
create policy programs_public_select on public.programs
for select using (is_published = true);

drop policy if exists forms_public_select on public.forms;
create policy forms_public_select on public.forms
for select using (
  is_published = true
  and exists (
    select 1 from public.programs p
    where p.id = forms.program_id and p.is_published = true
  )
);

drop policy if exists questions_public_select on public.form_questions;
create policy questions_public_select on public.form_questions
for select using (
  exists (
    select 1
    from public.forms f
    join public.programs p on p.id = f.program_id
    where f.id = form_questions.form_id
      and f.is_published = true
      and p.is_published = true
  )
);

drop policy if exists options_public_select on public.form_options;
create policy options_public_select on public.form_options
for select using (
  exists (
    select 1
    from public.form_questions q
    join public.forms f on f.id = q.form_id
    join public.programs p on p.id = f.program_id
    where q.id = form_options.question_id
      and f.is_published = true
      and p.is_published = true
  )
);

drop policy if exists faqs_public_select on public.faqs;
create policy faqs_public_select on public.faqs
for select using (is_published = true);

-- Admin full access
drop policy if exists programs_admin_all on public.programs;
create policy programs_admin_all on public.programs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists forms_admin_all on public.forms;
create policy forms_admin_all on public.forms
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists questions_admin_all on public.form_questions;
create policy questions_admin_all on public.form_questions
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists options_admin_all on public.form_options;
create policy options_admin_all on public.form_options
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists faqs_admin_all on public.faqs;
create policy faqs_admin_all on public.faqs
for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists submissions_admin_select on public.submissions;
create policy submissions_admin_select on public.submissions
for select to authenticated using (public.is_admin());

drop policy if exists answers_admin_select on public.submission_answers;
create policy answers_admin_select on public.submission_answers
for select to authenticated using (public.is_admin());

create or replace function public.get_option_counts(p_form_id uuid)
returns table(question_id uuid, option_id uuid, used_count bigint)
language sql
security definer
set search_path = public
as $$
  select sa.question_id,
         opt_id as option_id,
         count(*)::bigint as used_count
  from public.submission_answers sa,
       unnest(sa.option_ids) as opt_id
  where sa.form_id = p_form_id
  group by sa.question_id, opt_id
  order by sa.question_id;
$$;

grant execute on function public.get_option_counts(uuid) to anon, authenticated;

create or replace function public.get_public_form_bundle(p_form_id uuid)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with chosen_form as (
    select f.*, p.id as program_id_ref, p.name as program_name, p.slug as program_slug, p.summary as program_summary
    from public.forms f
    join public.programs p on p.id = f.program_id
    where f.id = p_form_id
      and f.is_published = true
      and p.is_published = true
  ), question_rows as (
    select q.*
    from public.form_questions q
    join chosen_form f on f.id = q.form_id
    order by q.sort_order, q.created_at
  ), option_rows as (
    select o.*
    from public.form_options o
    join question_rows q on q.id = o.question_id
    order by o.sort_order, o.created_at
  )
  select jsonb_build_object(
    'form', jsonb_build_object(
      'id', f.id,
      'title', f.title,
      'description', f.description,
      'global_deadline_at', f.global_deadline_at,
      'max_responses', f.max_responses,
      'is_published', f.is_published,
      'response_count', (select count(*)::int from public.submissions s where s.form_id = f.id)
    ),
    'program', jsonb_build_object(
      'id', f.program_id_ref,
      'name', f.program_name,
      'slug', f.program_slug,
      'summary', f.program_summary
    ),
    'questions', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'question_type', q.question_type,
          'title', q.title,
          'description', q.description,
          'is_required', q.is_required,
          'sort_order', q.sort_order,
          'options', coalesce((
            select jsonb_agg(
              jsonb_build_object(
                'id', o.id,
                'label', o.label,
                'deadline_at', o.deadline_at,
                'capacity', o.capacity,
                'event_start_at', o.event_start_at,
                'event_end_at', o.event_end_at,
                'sort_order', o.sort_order
              ) order by o.sort_order, o.created_at
            ) from option_rows o where o.question_id = q.id
          ), '[]'::jsonb)
        ) order by q.sort_order, q.created_at
      )
      from question_rows q
    ), '[]'::jsonb)
  )
  from chosen_form f;
$$;

grant execute on function public.get_public_form_bundle(uuid) to anon, authenticated;

create or replace function public.submit_form(
  p_form_id uuid,
  p_participant_name text,
  p_participant_phone text,
  p_participant_email text,
  p_answers jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_form public.forms%rowtype;
  v_program_id uuid;
  v_submission_id uuid;
  v_answer jsonb;
  v_question_id uuid;
  v_option_id uuid;
  v_option public.form_options%rowtype;
  v_selected uuid[];
  v_used_count bigint;
begin
  if coalesce(trim(p_participant_name), '') = '' then
    raise exception '이름은 필수야.';
  end if;
  if coalesce(trim(p_participant_phone), '') = '' then
    raise exception '연락처는 필수야.';
  end if;

  select * into v_form
  from public.forms
  where id = p_form_id
    and is_published = true;

  if not found then
    raise exception '공개된 폼이 아니야.';
  end if;

  select p.id into v_program_id
  from public.programs p
  where p.id = v_form.program_id and p.is_published = true;

  if v_program_id is null then
    raise exception '공개된 프로그램이 아니야.';
  end if;

  if v_form.global_deadline_at is not null and v_form.global_deadline_at < now() then
    raise exception '전체 마감 시간이 지났어.';
  end if;

  if v_form.max_responses is not null and (select count(*) from public.submissions s where s.form_id = p_form_id) >= v_form.max_responses then
    raise exception '전체 정원이 마감됐어.';
  end if;

  insert into public.submissions(form_id, program_id, participant_name, participant_phone, participant_email)
  values (p_form_id, v_program_id, p_participant_name, p_participant_phone, nullif(trim(coalesce(p_participant_email, '')), ''))
  returning id into v_submission_id;

  for v_answer in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    v_question_id := (v_answer->>'questionId')::uuid;
    v_selected := array(
      select value::uuid
      from jsonb_array_elements_text(coalesce(v_answer->'optionIds', '[]'::jsonb)) as value
    );

    -- Validate selected options
    if array_length(v_selected, 1) is not null then
      foreach v_option_id in array v_selected
      loop
        select o.* into v_option
        from public.form_options o
        join public.form_questions q on q.id = o.question_id
        where o.id = v_option_id
          and q.id = v_question_id
          and q.form_id = p_form_id;

        if not found then
          raise exception '선택지 검증 실패';
        end if;

        if v_option.deadline_at is not null and v_option.deadline_at < now() then
          raise exception '이미 마감된 선택지가 포함되어 있어.';
        end if;

        if v_option.capacity is not null then
          select count(*) into v_used_count
          from public.submission_answers sa
          where sa.question_id = v_question_id
            and sa.option_ids @> array[v_option_id]::uuid[];

          if v_used_count >= v_option.capacity then
            raise exception '선택지 정원이 마감됐어.';
          end if;
        end if;
      end loop;
    end if;

    insert into public.submission_answers(submission_id, form_id, question_id, option_ids, value_text, value_json)
    values (
      v_submission_id,
      p_form_id,
      v_question_id,
      coalesce(v_selected, '{}'::uuid[]),
      nullif(trim(coalesce(v_answer->>'valueText', '')), ''),
      v_answer->'valueJson'
    );
  end loop;

  return jsonb_build_object('submission_id', v_submission_id);
end;
$$;

grant execute on function public.submit_form(uuid, text, text, text, jsonb) to anon, authenticated;
