export type Experience = {
  id: string; title: string; tagCode: string; creationMethod: string;
  status: string; summary?: string | null; startedAt?: string | null;
  endedAt?: string | null; createdAt?: string; updatedAt?: string;
};
export type ExperienceTag = { code: string; name: string; displayOrder: number };
export type ExperienceQuestion = {
  id: string; tagCode: string; code?: string; questionText?: string; text?: string;
  prompt?: string; label?: string; content?: string; displayOrder: number; required?: boolean;
};
export type ExperienceAnswer = {
  id: string; questionId: string | null; content: string; displayOrder: number;
  customLabel?: string | null;
};
export type ExperienceDetail = { experience: Experience; answers: ExperienceAnswer[]; progress: number };
export type Application = {
  id: string; companyName: string; positionName: string; status: string;
  deadline?: string | null; jdUrl?: string | null; createdAt?: string; updatedAt?: string;
};
export type CoverQuestion = {
  id: string; coverLetterId: string; questionText: string; characterLimit: number;
  answerText: string; displayOrder: number;
};
export type ApplicationDetail = { coverLetter: Application; questions: CoverQuestion[] };
export type Posting = {
  id?: string; url?: string | null; jdOriginal?: string | null;
  qualifications?: string | null; preferences?: string | null;
  hiringProcess?: string | null;
};
export type Profile = {
  memberId: string; email: string; age?: number | null; gender?: string | null;
  school?: string | null; desiredJob?: string | null;
  profileCompleted: boolean; onboardingStep: string;
};
export type TokenResponse = { accessToken: string; refreshToken: string; tokenType: string };
export type ChatTurn = { role: string; content: string; sequenceNo: number; provider?: string; isMock?: boolean };
export type Summary = {
  schemaVersion: string; situation: string | null; task: string | null;
  action: string | null; result: string | null; role: string | null;
  conflict: string | null; learned: string | null;
  skills: string[]; keywords: string[]; evidenceSources: unknown[];
};
export type AiPreview = {
  text?: string; revisedText?: string; question?: string; summary?: Summary;
  provider?: string; isMock?: boolean; warnings?: string[];
  questionType?: string; evaluationIntent?: string;
  changeReasons?: string[]; nextActions?: string[]; strengths?: string[];
  evidenceGaps?: string[]; targetField?: string; completionPercent?: number;
  analysis?: Record<string, unknown>; reason?: string;
};
export type EditTurn = {
  sequenceNo: number; originalText: string; instruction: string;
  revisedText: string; changeReasons: string[]; warnings: string[];
  isMock: boolean;
};
export const QUESTION_TYPES = [
  { value: 'MOTIVATION', label: '지원 동기' }, { value: 'JOB_COMPETENCY', label: '직무 역량' },
  { value: 'COLLABORATION', label: '협업 경험' }, { value: 'PROBLEM_SOLVING', label: '문제 해결' },
  { value: 'CHALLENGE', label: '도전 경험' }, { value: 'STRENGTH_WEAKNESS', label: '성격의 장단점' },
  { value: 'GROWTH', label: '성장 과정' }, { value: 'FUTURE_PLAN', label: '입사 후 포부' }
] as const;
export const REVISION_TYPES = [
  { value: 'GENERAL', label: '전체 개선' }, { value: 'LOGIC', label: '논리 다듬기' },
  { value: 'CONCISE', label: '간결하게' }, { value: 'JOB_FIT', label: '직무 적합성' },
  { value: 'GRAMMAR', label: '맞춤법·문장' }, { value: 'IMPACT', label: '임팩트 강화' }
] as const;
export const TAG_NAMES: Record<string, string> = {
  STAR: 'STAR 경험', COLLABORATION: '협업', ACADEMIC_CAREER: '학업·진로',
  CHALLENGE: '도전', GROWTH_VALUES: '성장·가치관', STRENGTH_WEAKNESS: '강점·약점'
};
export function displayDate(value?: string | null) {
  if (!value) return '미정';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}
export function initial(value: string) { return (value || '?').trim().charAt(0).toUpperCase(); }
