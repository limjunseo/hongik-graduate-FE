import type { Application, CoverQuestion, Experience, ExperienceQuestion, ExperienceTag } from './types';

export const sampleExperiences: Experience[] = [
  { id: 'demo-exp-1', title: '캡스톤 프로젝트 · 팀 리더', tagCode: 'STAR', creationMethod: 'QUICK', status: 'COMPLETED', summary: '5인 팀을 이끌며 요구사항을 정의하고 서비스를 끝까지 구현한 경험', startedAt: '2026-03-01', endedAt: '2026-10-15', updatedAt: '2026-10-29T12:00:00Z' },
  { id: 'demo-exp-2', title: '학과 프로젝트의 협업 과정', tagCode: 'COLLABORATION', creationMethod: 'QUICK', status: 'DRAFT', summary: '의견 차이를 조율하며 공통의 목표를 찾아간 경험', updatedAt: '2026-10-27T12:00:00Z' },
  { id: 'demo-exp-3', title: '서비스 성능 개선 도전', tagCode: 'CHALLENGE', creationMethod: 'QUICK', status: 'COMPLETED', summary: '병목을 찾아 가설을 검증하고 개선한 경험', updatedAt: '2026-10-21T12:00:00Z' },
  { id: 'demo-exp-4', title: '스터디 운영 및 성장', tagCode: 'GROWTH_VALUES', creationMethod: 'QUICK', status: 'DRAFT', summary: '꾸준한 기록을 통해 팀의 학습 습관을 만든 경험', updatedAt: '2026-10-15T12:00:00Z' }
];
export const sampleApplications: Application[] = [
  { id: 'demo-app-1', companyName: '토스', positionName: 'Backend Developer', status: 'IN_PROGRESS', deadline: '2026-11-20', updatedAt: '2026-10-30T12:00:00Z' },
  { id: 'demo-app-2', companyName: '카카오', positionName: 'Server Engineer', status: 'DRAFT', deadline: '2026-11-28', updatedAt: '2026-10-28T12:00:00Z' },
  { id: 'demo-app-3', companyName: '네이버', positionName: 'Software Engineer', status: 'COMPLETED', deadline: '2026-11-05', updatedAt: '2026-10-20T12:00:00Z' }
];
export const sampleTags: ExperienceTag[] = [
  { code: 'STAR', name: 'STAR 경험', displayOrder: 1 },
  { code: 'COLLABORATION', name: '협업', displayOrder: 2 },
  { code: 'ACADEMIC_CAREER', name: '학업·진로', displayOrder: 3 },
  { code: 'CHALLENGE', name: '도전', displayOrder: 4 },
  { code: 'GROWTH_VALUES', name: '성장·가치관', displayOrder: 5 },
  { code: 'STRENGTH_WEAKNESS', name: '강점·약점', displayOrder: 6 }
];
export const sampleQuestions: ExperienceQuestion[] = [
  { id: 'sample-q-1', tagCode: 'STAR', questionText: '어떤 상황에서 시작된 경험인가요?', displayOrder: 1, required: true },
  { id: 'sample-q-2', tagCode: 'STAR', questionText: '맡은 과제와 목표는 무엇이었나요?', displayOrder: 2, required: true },
  { id: 'sample-q-3', tagCode: 'STAR', questionText: '구체적으로 어떤 행동을 했나요?', displayOrder: 3, required: true },
  { id: 'sample-q-4', tagCode: 'STAR', questionText: '어떤 결과와 배움이 있었나요?', displayOrder: 4, required: true }
];
export const sampleCoverQuestions: CoverQuestion[] = [
  { id: 'demo-question-1', coverLetterId: 'demo-app-1', questionText: '지원 직무에 관심을 갖게 된 계기와 지원 동기를 작성해 주세요.', characterLimit: 700, answerText: '기술로 일상의 불편을 해결하고 싶다는 생각에서 백엔드 개발을 시작했습니다. 팀 프로젝트에서 실제 사용자의 피드백을 반영하며 안정적인 서비스의 가치를 배웠습니다.', displayOrder: 1 },
  { id: 'demo-question-2', coverLetterId: 'demo-app-1', questionText: '가장 도전적이었던 경험과 이를 해결한 과정을 기술해 주세요.', characterLimit: 900, answerText: '', displayOrder: 2 }
];
export const demoJd = '고객 중심의 금융 서비스를 함께 만들어갈 Backend Developer를 찾습니다. Java / Spring 기반 백엔드 개발 경험, 문제 해결 능력, 팀 협업과 지속적인 개선 역량을 중요하게 생각합니다.';
