# 귤귤 Supabase 준비 순서 (초보자용)

## 0) 이 프로젝트가 어떻게 나뉘는지 먼저 이해하기
- `apps/web` : 이용자용 사이트
- `apps/admin` : 관리자용 사이트
- 둘 다 정적 HTML이라서 GitHub에 올리기 쉽다.
- 데이터는 브라우저 저장이 아니라 **Supabase DB** 에 저장된다.

## 1) Supabase 프로젝트 만들기
1. Supabase 로그인
2. **New project** 클릭
3. 프로젝트 이름 입력
4. DB 비밀번호 입력 후 저장
5. 프로젝트가 준비될 때까지 기다린다

## 2) SQL 붙여넣기
1. 좌측 메뉴 **SQL Editor** 로 이동
2. `supabase/schema.sql` 파일 전체 복사 후 실행
3. 이어서 `supabase/seed.sql` 파일도 실행

## 3) 관리자 이메일 바꾸기
`schema.sql` 안에 기본 예시 이메일이 들어 있다.

```sql
insert into public.admin_emails(email, note)
values ('admin@example.com', '첫 관리자 이메일')
on conflict (email) do nothing;
```

이 부분을 네 실제 관리자 이메일로 바꿔서 다시 실행하거나,
대시보드 SQL Editor에서 아래 한 줄만 따로 실행하면 된다.

```sql
insert into public.admin_emails(email, note)
values ('네이메일@example.com', '실사용 관리자');
```

## 4) URL / 키 찾기
Supabase 프로젝트에서 다음 2개가 필요하다.
- Project URL
- Publishable Key

이 값은 API Keys 화면에서 찾는다.

## 5) config.js 입력
다음 2개 파일을 열어 값을 넣는다.
- `apps/web/js/config.js`
- `apps/admin/js/config.js`

```js
export const SUPABASE_URL = 'https://프로젝트ref.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_xxx';
```

## 6) 관리자 회원가입
1. `apps/admin/index.html` 을 로컬 서버로 연다
2. 이메일 / 비밀번호 입력
3. **회원가입** 또는 **로그인**
4. 로그인 후 프로그램/폼/FAQ를 등록한다

## 7) 로컬에서 테스트하는 방법
파일을 더블클릭해서 열지 말고, 폴더 기준으로 간단한 서버를 띄운다.

### Python이 있으면
```bash
cd apps/web
python -m http.server 8080
```
다른 터미널에서는
```bash
cd apps/admin
python -m http.server 8081
```

브라우저에서
- `http://localhost:8080`
- `http://localhost:8081`
열면 된다.

## 8) GitHub 올리기
1. 새 저장소 생성
2. 이 프로젝트 파일 전체 업로드
3. 커밋/푸시

## 9) Vercel 배포
이 저장소 하나로 프로젝트 2개를 만든다.
- Project 1 Root Directory: `apps/web`
- Project 2 Root Directory: `apps/admin`

각 프로젝트에 똑같이 환경변수를 넣을 수도 있지만,
이 스타터는 먼저 따라가기 쉽게 `config.js` 직접 입력 방식으로 만들어 둔 상태다.

## 10) 다음 단계 추천
지금 단계가 안정되면 그다음에 붙이면 좋은 것:
- 카카오 로그인
- 카카오톡 채널 챗봇용 Edge Function
- 신청자 개인 조회 페이지
- 이미지 업로드용 Storage
- 관리자/스태프 권한 분리
