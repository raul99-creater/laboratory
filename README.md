# 귤귤 GitHub Pages + Supabase 준비본

이 저장소는 **메인 이용자 페이지**와 **어드민 페이지**를 한 저장소에 넣어, 먼저 **GitHub Pages에서 바로 확인**하고 그다음 **Supabase를 연결**할 수 있게 만든 버전입니다.

## 폴더 구조
- `/` : 이용자용 사이트
- `/admin` : 어드민
- `/supabase/schema.sql` : DB 스키마 + RLS + 트리거
- `/docs/SETUP_KR.md` : 초보자용 세팅 순서

## 배포 구조
- GitHub Pages에서 저장소 루트를 그대로 배포
- 메인: `https://사용자명.github.io/저장소명/`
- 어드민: `https://사용자명.github.io/저장소명/admin/`

GitHub Pages는 저장소의 정적 HTML/CSS/JS 파일을 그대로 게시할 수 있고, 브랜치/폴더를 게시 원본으로 지정할 수 있습니다. citeturn297110search4turn297110search7

## 지금 상태
- Supabase 설정값이 비어 있으면: **로컬 데모 모드**
- Supabase 설정값을 넣으면: **같은 UI 그대로 실데이터 모드**
- 메인은 `site_state` + `submission_public`을 읽음
- 어드민은 이메일 로그인 후 `site_state`, `submissions`를 관리함

## 가장 쉬운 시작 순서
1. 이 폴더를 GitHub 새 저장소에 업로드
2. GitHub Pages를 **Deploy from a branch / root**로 켬
3. 사이트가 뜨는지 먼저 확인
4. Supabase에서 `schema.sql` 실행
5. `js/config.js`와 `admin/js/config.js`에 Supabase URL / Publishable Key 입력
6. 어드민에서 이메일 회원가입 → Supabase DB의 `admin_emails`에 내 이메일 추가
7. 어드민에서 **Supabase에 업로드** 버튼으로 현재 구성 밀어넣기

## 주의
- 브라우저 코드에는 **Publishable key**만 넣어야 합니다. Supabase는 브라우저/클라이언트에는 publishable key를 쓰고, 비밀 키는 서버 전용으로 안내합니다. citeturn297110search2turn297110search8
- 현재 어드민 동기화는 **명시적 버튼 방식**입니다. 폼을 고친 뒤 `Supabase에 업로드`를 눌러야 메인 사이트에 반영됩니다.
