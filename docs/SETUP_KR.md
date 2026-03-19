# 귤귤 GitHub Pages + Supabase 세팅

## 0. 먼저 이해할 구조
- **GitHub Pages**: 화면 띄우는 곳
- **Supabase**: 프로그램/폼/제출 데이터 저장하는 곳
- **메인 사이트**: root
- **어드민**: `/admin`

GitHub Pages는 저장소의 정적 파일을 그대로 서비스할 수 있습니다. 게시 원본은 브랜치의 루트(`/`)나 `/docs` 폴더로 지정할 수 있습니다. citeturn297110search4turn297110search7

## 1. GitHub 저장소 올리기
1. GitHub에서 새 저장소 생성
2. 이 폴더 안 파일을 전부 업로드
3. Settings → Pages 이동
4. Build and deployment에서 **Deploy from a branch** 선택
5. Branch는 `main`, Folder는 `/ (root)` 선택
6. 저장 후 배포 완료까지 기다림

## 2. 먼저 화면 확인
배포 주소에서 아래 두 페이지가 뜨면 1차 성공입니다.
- 메인: `/`
- 어드민: `/admin/`

## 3. Supabase 프로젝트 만들기
1. Supabase 로그인
2. New project 생성
3. 프로젝트 생성 완료 후 `Project URL` 확인
4. `API Keys`에서 **Publishable key** 확인

Supabase는 브라우저 클라이언트 초기화 시 URL과 Key를 사용하고, 최신 문서에서는 클라이언트 쪽에 publishable key 사용을 우선 안내합니다. citeturn297110search11turn297110search14

## 4. DB 스키마 넣기
1. Supabase 대시보드 → SQL Editor
2. `supabase/schema.sql` 전체 붙여넣기
3. 실행
4. 실행 후 `admin_emails`, `site_state`, `submissions`, `submission_public` 테이블이 생겼는지 확인

## 5. 관리자 이메일 등록
`admin_emails` 테이블에 네 이메일을 한 줄 추가합니다.
예시:
```sql
insert into public.admin_emails (email, note)
values ('your@email.com', 'main admin')
on conflict (email) do nothing;
```

## 6. Auth 켜기
Supabase Auth는 이메일/비밀번호 로그인을 지원합니다. hosted 프로젝트에서는 이메일 인증 요구 여부를 설정할 수 있습니다. citeturn297110search3turn297110search24

가장 쉬운 방법:
1. Authentication → Sign In / Providers
2. Email 켜져 있는지 확인
3. 처음엔 확인 메일 강제를 끄거나, 켠 상태면 메일 인증까지 완료

## 7. 프론트에 키 넣기
아래 두 파일을 열어 값을 넣습니다.
- `/js/config.js`
- `/admin/js/config.js`

```js
export const SUPABASE_URL = 'https://xxxx.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xxxxx';
export const SUPABASE_ANON_KEY = ''; // 비워도 됨
export const SUPABASE_SITE_SLUG = 'gyulgyul-main';
```

## 8. 어드민 로그인
1. `/admin/` 접속
2. 이메일/비밀번호 입력
3. 회원가입 또는 로그인
4. 로그인 후 상태가 `승인된 관리자`로 보이면 성공

## 9. Supabase로 업로드
1. 어드민에서 프로그램/폼 수정
2. `Supabase에 업로드` 클릭
3. 메인 페이지 새로고침
4. 수정 내용 반영 확인

## 10. 제출 테스트
1. 메인 페이지에서 폼 제출
2. 어드민에서 `Supabase에서 다시 불러오기`
3. 제출 현황 테이블에 들어왔는지 확인

## 자주 막히는 부분
- 메인은 뜨는데 데이터가 안 보임 → `config.js` 값 오타 확인
- 로그인은 되는데 업로드 안 됨 → `admin_emails`에 내 이메일 등록했는지 확인
- GitHub Pages 404 → Pages 게시 원본 branch/folder 확인
- 제출은 되는데 내 일정이 안 보임 → 현재 내 일정 표시는 브라우저의 내 정보 + 로컬 캐시도 함께 사용함
