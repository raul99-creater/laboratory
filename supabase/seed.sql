insert into public.programs(slug, name, summary, description, cover_note, is_published, sort_order)
values
  ('open-house', '귤귤 오픈하우스', '브랜드 소개와 공간 투어, 네트워킹을 묶은 공개 프로그램', '처음 귤귤을 접하는 사람이 가장 빠르게 흐름을 이해할 수 있는 기본 프로그램', '이미지는 나중에 넣고 지금은 구조와 신청 플로우만 먼저 확인하면 된다.', true, 10),
  ('community-round', '커뮤니티 라운드', '소규모 라운드 테이블과 실무 대화 세션', '시간대별 좌석 정원과 일정이 다르게 설정되는 형태 테스트용 프로그램', null, true, 20),
  ('showcase', '브랜드 쇼케이스', '공개 행사 / 팝업 / 전시 알림용 프로그램', '간단한 관심 등록 폼 테스트용 프로그램', null, true, 30)
on conflict (slug) do nothing;

with open_house as (
  select id from public.programs where slug = 'open-house'
), community_round as (
  select id from public.programs where slug = 'community-round'
), showcase as (
  select id from public.programs where slug = 'showcase'
)
insert into public.forms(program_id, title, description, global_deadline_at, max_responses, is_published, sort_order)
select id, '4월 오픈하우스 신청', '시간대별 정원이 다르므로 원하는 회차를 선택해 주세요.', now() + interval '10 days', 80, true, 10 from open_house
where not exists (select 1 from public.forms where title = '4월 오픈하우스 신청')
union all
select id, '커뮤니티 라운드 좌석 신청', '주제별 라운드를 하나 선택할 수 있습니다.', now() + interval '14 days', 50, true, 20 from community_round
where not exists (select 1 from public.forms where title = '커뮤니티 라운드 좌석 신청')
union all
select id, '브랜드 쇼케이스 알림 신청', '간단한 관심 등록용 폼', null, null, true, 30 from showcase
where not exists (select 1 from public.forms where title = '브랜드 쇼케이스 알림 신청');

-- Open house questions
with form_row as (
  select id from public.forms where title = '4월 오픈하우스 신청'
)
insert into public.form_questions(form_id, question_type, title, description, is_required, sort_order)
select id, 'short', '이름', null, true, 10 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '이름')
union all
select id, 'short', '연락처', null, true, 20 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '연락처')
union all
select id, 'single', '참여 시간대 선택', '가능한 회차를 하나 선택해 주세요.', true, 30 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '참여 시간대 선택')
union all
select id, 'paragraph', '남기고 싶은 메모', null, false, 40 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '남기고 싶은 메모');

with question_row as (
  select q.id
  from public.form_questions q
  join public.forms f on f.id = q.form_id
  where f.title = '4월 오픈하우스 신청' and q.title = '참여 시간대 선택'
)
insert into public.form_options(question_id, label, deadline_at, capacity, event_start_at, event_end_at, sort_order)
select id, '토요일 14:00 공간 투어', now() + interval '6 days', 20, now() + interval '8 days 14 hours', now() + interval '8 days 16 hours', 10 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '토요일 14:00 공간 투어')
union all
select id, '토요일 17:00 네트워킹', now() + interval '6 days', 24, now() + interval '8 days 17 hours', now() + interval '8 days 19 hours', 20 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '토요일 17:00 네트워킹')
union all
select id, '일요일 13:00 라이트 투어', now() + interval '7 days', 18, now() + interval '9 days 13 hours', now() + interval '9 days 14 hours 30 minutes', 30 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '일요일 13:00 라이트 투어');

-- Community round questions
with form_row as (
  select id from public.forms where title = '커뮤니티 라운드 좌석 신청'
)
insert into public.form_questions(form_id, question_type, title, description, is_required, sort_order)
select id, 'short', '이름', null, true, 10 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '이름')
union all
select id, 'dropdown', '원하는 라운드 선택', '주제를 하나 선택해 주세요.', true, 20 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '원하는 라운드 선택')
union all
select id, 'multi', '관심 있는 운영 포인트', '복수 선택 가능', false, 30 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '관심 있는 운영 포인트');

with question_row as (
  select q.id
  from public.form_questions q
  join public.forms f on f.id = q.form_id
  where f.title = '커뮤니티 라운드 좌석 신청' and q.title = '원하는 라운드 선택'
)
insert into public.form_options(question_id, label, deadline_at, capacity, event_start_at, event_end_at, sort_order)
select id, '브랜드 톤 정리 라운드', now() + interval '9 days', 10, now() + interval '12 days 19 hours', now() + interval '12 days 21 hours', 10 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '브랜드 톤 정리 라운드')
union all
select id, '오프라인 운영 체크 라운드', now() + interval '10 days', 12, now() + interval '13 days 14 hours', now() + interval '13 days 16 hours', 20 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '오프라인 운영 체크 라운드')
union all
select id, '커뮤니티 실험 회의', now() + interval '11 days', 14, now() + interval '14 days 20 hours', now() + interval '14 days 22 hours', 30 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '커뮤니티 실험 회의');

with question_row as (
  select q.id
  from public.form_questions q
  join public.forms f on f.id = q.form_id
  where f.title = '커뮤니티 라운드 좌석 신청' and q.title = '관심 있는 운영 포인트'
)
insert into public.form_options(question_id, label, sort_order)
select id, '브랜딩', 10 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '브랜딩')
union all
select id, '현장 운영', 20 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '현장 운영')
union all
select id, '콘텐츠 흐름', 30 from question_row
where not exists (select 1 from public.form_options where question_id = question_row.id and label = '콘텐츠 흐름');

-- Showcase questions
with form_row as (
  select id from public.forms where title = '브랜드 쇼케이스 알림 신청'
)
insert into public.form_questions(form_id, question_type, title, description, is_required, sort_order)
select id, 'short', '이름', null, true, 10 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '이름')
union all
select id, 'short', '이메일 또는 연락처', null, true, 20 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '이메일 또는 연락처')
union all
select id, 'paragraph', '보고 싶은 테마', null, false, 30 from form_row
where not exists (select 1 from public.form_questions where form_id = form_row.id and title = '보고 싶은 테마');

insert into public.faqs(question, answer, is_published, sort_order)
values
  ('관리자 이메일은 어디에 등록해?', 'schema.sql 실행 후 public.admin_emails 테이블에 네 이메일을 넣으면 된다.', true, 10),
  ('이미지는 아직 안 넣어도 돼?', '된다. 지금 단계는 구조와 데이터 흐름 확인이 먼저다.', true, 20),
  ('카카오봇은 언제 붙이면 좋아?', '프로그램/폼/제출 구조가 안정된 다음에 Edge Functions를 붙이는 게 가장 안전하다.', true, 30)
on conflict do nothing;
