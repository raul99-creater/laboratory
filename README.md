# 귤귤 Supabase UI 스타터

이번 압축본은 **보이는 UI까지 구현된 버전**이다.

## 이번 버전 핵심
- `apps/web` 이용자용 공개 사이트
- `apps/admin` 관리자용 어드민
- `supabase/schema.sql`, `supabase/seed.sql` 포함
- **config.js를 비워둬도 데모 모드로 바로 동작**
- Supabase 값을 넣으면 같은 UI가 실데이터를 읽음

## 먼저 해볼 것
1. `apps/web/index.html` 먼저 연다.
2. `apps/admin/index.html`도 연다.
3. 데모 모드에서 UI와 기능을 먼저 확인한다.
4. 괜찮으면 Supabase 프로젝트를 만들고 SQL을 실행한다.
5. `apps/web/js/config.js`, `apps/admin/js/config.js`에 URL/Key를 넣는다.

자세한 순서는 `docs/SETUP_KR.md` 참고.
