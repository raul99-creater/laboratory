# 귤귤 Supabase UI 스타터 · 초보자용 세팅 순서

## 0. 이번 버전부터 달라진 점
이전 스타터처럼 문서만 있는 게 아니라, 이번 버전은 **아무 설정 없이도 화면이 바로 열리고** 데모 데이터로 어드민/이용자 기능이 실제로 돌아간다.

즉 순서는 이렇다.

1. 먼저 브라우저에서 UI를 본다.
2. 그 다음 Supabase를 만든다.
3. 마지막에 config.js를 채운다.

---

## 1. 압축을 푼 뒤 어디부터 볼까
폴더는 이렇게 나뉜다.

- `apps/web` : 이용자용 사이트
- `apps/admin` : 관리자용 어드민
- `supabase/schema.sql` : 테이블/정책/RPC
- `supabase/seed.sql` : 샘플 데이터

### 바로 확인해보기
- `apps/web/index.html` 더블클릭
- `apps/admin/index.html` 더블클릭

둘 다 **데모 모드**로 바로 열린다.

---

## 2. 데모 모드에서 먼저 확인할 것
### web 에서
- 홈 화면이 뜨는지
- 프로그램 카드가 보이는지
- 참여하기 페이지에서 폼이 열리는지
- 제출 후 Google Calendar / ICS 버튼이 뜨는지

### admin 에서
- 이메일/비밀번호 아무거나 넣고 로그인 되는지
- 프로그램 추가가 되는지
- 폼 생성이 되는지
- 질문/선택지 편집이 되는지
- 최근 제출이 보이는지

이 단계는 **Supabase 없이도** 된다.

---

## 3. Supabase 프로젝트 만들기
1. Supabase 로그인
2. `New project` 클릭
3. 프로젝트 이름 입력
4. DB 비밀번호 설정
5. 지역 선택 후 생성

프로젝트 생성이 끝나면 `Project URL`과 `Publishable key`를 쓸 수 있다.

---

## 4. SQL 넣기
Supabase 왼쪽 메뉴에서 `SQL Editor`로 간다.

### 4-1. schema.sql 실행
- `supabase/schema.sql` 파일 전체 복사
- SQL Editor에 붙여넣기
- 실행

### 4-2. seed.sql 실행
- `supabase/seed.sql` 파일 전체 복사
- SQL Editor에 붙여넣기
- 실행

이렇게 하면 기본 샘플 데이터가 들어간다.

---

## 5. 관리자 이메일 등록
`schema.sql` 안에는 `public.admin_emails` 테이블이 있다.

실제 네 이메일을 넣어야 어드민 권한이 열린다.

예시 SQL:

```sql
insert into public.admin_emails(email, note)
values ('네이메일@example.com', '실제 관리자');
```

---

## 6. config.js 채우기
두 파일을 수정한다.

- `apps/web/js/config.js`
- `apps/admin/js/config.js`

기본값은 이렇게 들어 있다.

```js
export const APP_NAME = '귤귤';
export const SUPABASE_URL = 'https://YOUR_PROJECT_REF.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'YOUR_SUPABASE_PUBLISHABLE_KEY';
export const TIMEZONE = 'Asia/Seoul';
```

여기서 아래 두 개만 바꾸면 된다.
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

### 중요
- `Publishable Key`만 넣는다.
- `service_role`이나 secret key는 넣지 않는다.

---

## 7. admin에서 실제 로그인 테스트
1. `apps/admin/index.html` 열기
2. 회원가입 또는 로그인
3. 아까 `admin_emails`에 넣은 이메일 사용
4. 대시보드가 열리면 성공

---

## 8. web에서 실데이터 확인
1. `apps/web/index.html` 열기
2. 데모 배너가 사라졌는지 확인
3. 프로그램 목록이 seed 데이터와 같은지 확인
4. 참여하기 페이지에서 제출 테스트

---

## 9. GitHub에 올릴 때
### 저장소 업로드
압축 푼 폴더 전체를 GitHub 저장소에 올린다.

### 정적 배포
- web만 먼저 올릴 거면 `apps/web` 기준으로 GitHub Pages 또는 Vercel
- admin은 `apps/admin` 기준으로 별도 프로젝트

### 추천
- GitHub 저장소는 1개
- Vercel 프로젝트는 2개
  - 프로젝트 1: `apps/web`
  - 프로젝트 2: `apps/admin`

---

## 10. 막히기 쉬운 포인트
### 화면은 뜨는데 실데이터가 안 보임
- config.js 값 확인
- schema.sql 실행 여부 확인
- seed.sql 실행 여부 확인

### admin 로그인은 되는데 권한이 없음
- `public.admin_emails`에 네 이메일이 들어갔는지 확인
- 로그인 이메일과 등록 이메일이 같은지 확인

### 데모 배너가 계속 보임
- config.js placeholder 문자열이 그대로 남아 있는지 확인

---

## 11. 다음 확장
이 구조 위에 바로 붙이기 좋은 기능
- 카카오 로그인
- Supabase Storage 이미지 업로드
- 카카오 일정응답봇(Edge Functions)
- 개인 신청내역 조회
- 운영자 공지/배너 관리
