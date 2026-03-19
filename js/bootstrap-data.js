
function pad(value) {
  return String(value).padStart(2, '0');
}

function toLocalInputValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function uid(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function getBootstrapData() {
  const now = new Date();
  const day = 24 * 60 * 60 * 1000;

  const programOpenHouse = { id: uid('lec'), name: '귤귤 오픈하우스', description: '브랜드 소개, 공간 투어, 짧은 네트워킹이 함께 있는 오프라인 프로그램', createdAt: new Date().toISOString() };
  const programRound = { id: uid('lec'), name: '커뮤니티 라운드', description: '작은 그룹으로 운영되는 신청형 밋업과 실무 대화 세션', createdAt: new Date().toISOString() };
  const programShowcase = { id: uid('lec'), name: '브랜드 쇼케이스', description: '협업 파트너와 진행하는 공개 행사, 전시, 팝업 알림용 프로그램', createdAt: new Date().toISOString() };

  const formOpenHouse = {
    id: uid('form'),
    lectureId: programOpenHouse.id,
    title: '4월 오픈하우스 신청',
    description: '방문 시간대에 맞춰 신청해 주세요. 시간대별 정원과 마감 시각이 다릅니다.',
    globalDeadlineAt: toLocalInputValue(new Date(now.getTime() + 10 * day)),
    maxResponses: 80,
    isPublished: true,
    questions: [
      { id: uid('q'), type: 'short', title: '이름', description: '', required: true, options: [] },
      { id: uid('q'), type: 'short', title: '연락처', description: '', required: true, options: [] },
      {
        id: uid('q'), type: 'single', title: '참여 시간대 선택', description: '가능한 시간대를 하나 선택해 주세요.', required: true,
        options: [
          { id: uid('opt'), label: '토요일 14:00 공간 투어', deadlineAt: toLocalInputValue(new Date(now.getTime() + 6 * day)), capacity: 20, eventStartAt: toLocalInputValue(new Date(now.getTime() + 8 * day + 14 * 60 * 60 * 1000)), eventEndAt: toLocalInputValue(new Date(now.getTime() + 8 * day + 16 * 60 * 60 * 1000)) },
          { id: uid('opt'), label: '토요일 17:00 네트워킹', deadlineAt: toLocalInputValue(new Date(now.getTime() + 6 * day)), capacity: 24, eventStartAt: toLocalInputValue(new Date(now.getTime() + 8 * day + 17 * 60 * 60 * 1000)), eventEndAt: toLocalInputValue(new Date(now.getTime() + 8 * day + 19 * 60 * 60 * 1000)) },
          { id: uid('opt'), label: '일요일 13:00 라이트 투어', deadlineAt: toLocalInputValue(new Date(now.getTime() + 7 * day)), capacity: 18, eventStartAt: toLocalInputValue(new Date(now.getTime() + 9 * day + 13 * 60 * 60 * 1000)), eventEndAt: toLocalInputValue(new Date(now.getTime() + 9 * day + 14.5 * 60 * 60 * 1000)) }
        ]
      },
      { id: uid('q'), type: 'paragraph', title: '남기고 싶은 메모', description: '', required: false, options: [] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const formRound = {
    id: uid('form'),
    lectureId: programRound.id,
    title: '커뮤니티 라운드 좌석 신청',
    description: '소규모 라운드라 좌석별 정원이 작습니다. 마감된 선택지는 비활성화됩니다.',
    globalDeadlineAt: toLocalInputValue(new Date(now.getTime() + 14 * day)),
    maxResponses: 50,
    isPublished: true,
    questions: [
      { id: uid('q'), type: 'short', title: '이름', description: '', required: true, options: [] },
      {
        id: uid('q'), type: 'dropdown', title: '원하는 라운드 선택', description: '주제에 맞는 라운드를 하나 선택해 주세요.', required: true,
        options: [
          { id: uid('opt'), label: '브랜드 톤 정리 라운드', deadlineAt: toLocalInputValue(new Date(now.getTime() + 9 * day)), capacity: 10, eventStartAt: toLocalInputValue(new Date(now.getTime() + 12 * day + 19 * 60 * 60 * 1000)), eventEndAt: toLocalInputValue(new Date(now.getTime() + 12 * day + 21 * 60 * 60 * 1000)) },
          { id: uid('opt'), label: '오프라인 운영 체크 라운드', deadlineAt: toLocalInputValue(new Date(now.getTime() + 10 * day)), capacity: 12, eventStartAt: toLocalInputValue(new Date(now.getTime() + 13 * day + 14 * 60 * 60 * 1000)), eventEndAt: toLocalInputValue(new Date(now.getTime() + 13 * day + 16 * 60 * 60 * 1000)) },
          { id: uid('opt'), label: '커뮤니티 실험 회의', deadlineAt: toLocalInputValue(new Date(now.getTime() + 11 * day)), capacity: 14, eventStartAt: toLocalInputValue(new Date(now.getTime() + 14 * day + 20 * 60 * 60 * 1000)), eventEndAt: toLocalInputValue(new Date(now.getTime() + 14 * day + 22 * 60 * 60 * 1000)) }
        ]
      },
      { id: uid('q'), type: 'multi', title: '관심 있는 운영 포인트', description: '복수 선택 가능', required: false, options: [
        { id: uid('opt'), label: '브랜딩', deadlineAt: '', capacity: '', eventStartAt: '', eventEndAt: '' },
        { id: uid('opt'), label: '현장 운영', deadlineAt: '', capacity: '', eventStartAt: '', eventEndAt: '' },
        { id: uid('opt'), label: '콘텐츠 흐름', deadlineAt: '', capacity: '', eventStartAt: '', eventEndAt: '' }
      ] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const formShowcase = {
    id: uid('form'),
    lectureId: programShowcase.id,
    title: '브랜드 쇼케이스 알림 신청',
    description: '행사 소식과 공개 일정 알림을 받을 수 있는 간단한 폼입니다.',
    globalDeadlineAt: '',
    maxResponses: '',
    isPublished: true,
    questions: [
      { id: uid('q'), type: 'short', title: '이름', description: '', required: true, options: [] },
      { id: uid('q'), type: 'short', title: '이메일 또는 연락처', description: '', required: true, options: [] },
      { id: uid('q'), type: 'paragraph', title: '보고 싶은 테마', description: '', required: false, options: [] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return {
    lectures: [programOpenHouse, programRound, programShowcase],
    forms: [formOpenHouse, formRound, formShowcase],
    submissions: []
  };
}
