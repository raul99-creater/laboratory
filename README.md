# 귤귤 Supabase Starter

브라우저에서 바로 돌릴 수 있는 **정적 사이트 2개(web / admin)** 와 Supabase SQL을 같이 넣어둔 스타터다.

- `apps/web` : 이용자용 사이트
- `apps/admin` : 관리자용 사이트
- `supabase/schema.sql` : 테이블 / RLS / RPC
- `supabase/seed.sql` : 샘플 데이터
- `docs/SETUP_KR.md` : 초보자용 설치 순서

## 가장 빠른 시작
1. Supabase 프로젝트 생성
2. `supabase/schema.sql` 실행
3. `supabase/seed.sql` 실행
4. `apps/web/js/config.js` 와 `apps/admin/js/config.js` 에 URL / Publishable Key 입력
5. `apps/admin` 에서 관리자 이메일로 회원가입 또는 로그인
6. 같은 이메일을 `public.admin_emails` 테이블에 넣었는지 확인
7. GitHub에 업로드 후 Vercel에서 `apps/web`, `apps/admin` 을 각각 다른 프로젝트로 연결

## 폴더 구조
```txt
apps/
  web/
    index.html
    programs.html
    participate.html
    about.html
    support.html
    js/
  admin/
    index.html
    js/
supabase/
  schema.sql
  seed.sql
  functions/
```

## 주의
- 클라이언트에는 **Publishable Key만** 넣는다.
- `sb_secret_...` 또는 `service_role` 키는 절대 브라우저에 넣지 않는다.
- 이 스타터는 초기에 따라가기 쉽게 **빌드 없는 정적 HTML + ES Modules** 로 구성했다.
