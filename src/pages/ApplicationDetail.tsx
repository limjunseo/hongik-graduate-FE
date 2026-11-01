import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, ClipboardCheck, FilePenLine, ListChecks, LoaderCircle, MessageCircle, Plus, Save, Sparkles, WandSparkles } from 'lucide-react';
import { api } from '../lib/api';
import { demoJd, sampleApplications, sampleCoverQuestions, sampleExperiences } from '../lib/demo';
import { useSession } from '../lib/session';
import type { AiPreview, ApplicationDetail as Detail, CoverQuestion, EditTurn, Experience, Posting } from '../lib/types';
import { QUESTION_TYPES, REVISION_TYPES, displayDate } from '../lib/types';
import { Button, EmptyState, Field, Loading, Modal, StatusPill } from '../components/UI';

type LinkRow = { id: string; experienceId: string };
export default function ApplicationDetail() {
  const { id = '' } = useParams();
  const { demo, guardDemo, notify } = useSession();
  const [detail, setDetail] = useState<Detail | null>(demo ? { coverLetter: sampleApplications.find(x => x.id === id) || sampleApplications[0], questions: sampleCoverQuestions } : null);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  const [questionId, setQuestionId] = useState(demo ? 'demo-question-1' : '');
  const [tab, setTab] = useState<'editor' | 'posting'>('editor');
  const [draft, setDraft] = useState(demo ? sampleCoverQuestions[0].answerText : '');
  const [questionType, setQuestionType] = useState<string>('MOTIVATION');
  const [revisionType, setRevisionType] = useState<string>('GENERAL');
  const [instruction, setInstruction] = useState('');
  const [preview, setPreview] = useState<AiPreview | null>(null);
  const [suggestion, setSuggestion] = useState<AiPreview | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>(demo ? sampleExperiences : []);
  const [posting, setPosting] = useState<Posting>(demo ? { jdOriginal: demoJd } : {});
  const [aiTurnList, setAiTurnList] = useState<EditTurn[]>([]);
  const [companyUrl, setCompanyUrl] = useState('');
  const [companyText, setCompanyText] = useState('');
  const [questionModal, setQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newLimit, setNewLimit] = useState(700);
  const [working, setWorking] = useState('');
  const current = detail?.questions.find(q => q.id === questionId) || detail?.questions[0];
  const cover = detail?.coverLetter;

  const load = async (preferQuestion?: string) => {
    const response = await api<Detail>('/api/cover-letters/' + id);
    setDetail(response);
    const selected = response.questions.find(q => q.id === preferQuestion) || response.questions[0];
    if (selected) { setQuestionId(selected.id); setDraft(selected.answerText || ''); }
    const [p, exp] = await Promise.all([
      api<Posting>('/api/cover-letters/' + id + '/posting').catch(() => ({} as Posting)),
      api<Experience[]>('/api/experiences?size=100').catch(() => [] as Experience[])
    ]);
    setPosting(p); setExperiences(exp);
  };
  useEffect(() => {
    if (demo) return;
    let alive = true;
    load().catch(e => { if (alive) setError(e instanceof Error ? e.message : '불러오지 못했어요.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [demo, id]);
  useEffect(() => {
    if (!questionId || demo) return;
    let alive = true;
    Promise.all([
      api<LinkRow[]>('/api/cover-letters/' + id + '/questions/' + questionId + '/experiences'),
      api<EditTurn[]>('/api/cover-letters/' + id + '/questions/' + questionId + '/ai-chat/turns?size=50')
    ]).then(([rows, turns]) => {
      if (alive) { setLinks(rows); setSelectedIds(rows.map(r => r.experienceId)); setAiTurnList(turns); }
    }).catch(e => { if (alive) notify(e instanceof Error ? e.message : '연결된 경험을 불러오지 못했어요.', 'error'); });
    return () => { alive = false; };
  }, [demo, id, questionId]);
  const switchQuestion = (q: CoverQuestion) => {
    setQuestionId(q.id); setDraft(q.answerText || ''); setPreview(null); setSuggestion(null);
  };
  const run = async (key: string, fn: () => Promise<void>) => {
    if (guardDemo()) return;
    setWorking(key);
    try { await fn(); } catch (e) { notify(e instanceof Error ? e.message : '요청에 실패했어요.', 'error'); }
    finally { setWorking(''); }
  };
  const saveAnswer = () => run('save', async () => {
    if (!current) return;
    const count = Array.from(draft).length;
    if (count > current.characterLimit) { notify('글자 수 제한을 초과했어요.', 'error'); return; }
    await api('/api/cover-letters/' + id + '/questions/' + current.id, { method: 'PATCH', body: { answerText: draft } });
    setDetail(v => v && ({ ...v, questions: v.questions.map(q => q.id === current.id ? { ...q, answerText: draft } : q) }));
    notify('자기소개서 답변이 저장되었어요.', 'success');
  });
  const addQuestion = () => run('add', async () => {
    const row = await api<CoverQuestion>('/api/cover-letters/' + id + '/questions', { method: 'POST', body: { questionText: newQuestion, characterLimit: newLimit } });
    setQuestionModal(false); setNewQuestion(''); await load(row.id); setTab('editor'); notify('문항을 추가했어요.', 'success');
  });
  const saveJd = () => run('jd', async () => {
    await api('/api/cover-letters/' + id + '/posting', { method: 'PUT', body: { url: posting.url || null, jdOriginal: posting.jdOriginal || null, qualifications: posting.qualifications || null, preferences: posting.preferences || null, hiringProcess: posting.hiringProcess || null } });
    notify('채용공고를 저장했어요.', 'success');
  });
  const jdAi = (action: 'analyze' | 'role-analyze') => run(action, async () => {
    const result = await api<AiPreview>('/api/cover-letters/' + id + '/posting/' + action, { method: 'POST' });
    setSuggestion(result); notify('분석 결과를 확인해 주세요.', 'info');
  });
  const companyAi = () => run('company', async () => {
    const result = await api<AiPreview>('/api/cover-letters/' + id + '/company/analyze', { method: 'POST', body: { sourceUrl: companyUrl, sourceText: companyText } });
    setSuggestion(result);
  });
  const ai = (kind: 'analyze' | 'draft' | 'revise' | 'strategy' | 'chat') => run(kind, async () => {
    if (!current) return;
    const base = '/api/cover-letters/' + id + '/questions/' + current.id;
    const body = { questionType, experienceIds: selectedIds };
    const endpoint = kind === 'chat' ? '/ai-chat/turns' : '/' + kind;
    const input = kind === 'draft' || kind === 'strategy' ? body
      : kind === 'revise' ? { ...body, originalText: draft, revisionType, instruction }
      : kind === 'chat' ? { ...body, currentDraft: draft, revisionType, instruction, requestId: crypto.randomUUID() }
      : undefined;
    const response = await api<AiPreview & EditTurn>(base + endpoint, { method: 'POST', body: input });
    if (kind === 'analyze') {
      if (response.questionType) setQuestionType(response.questionType);
      setSuggestion(response);
    } else if (kind === 'strategy') setSuggestion(response);
    else {
      setPreview({ ...response, text: kind === 'chat' || kind === 'revise' ? response.revisedText : response.text });
      if (kind === 'chat') setAiTurnList(v => [...v, response]);
    }
  });
  const toggleExperience = (expId: string) => run('link', async () => {
    const path = '/api/cover-letters/' + id + '/questions/' + questionId + '/experiences';
    if (links.some(link => link.experienceId === expId)) await api(path + '/' + expId, { method: 'DELETE' });
    else await api(path, { method: 'POST', body: { experienceId: expId } });
    const updated = await api<LinkRow[]>(path); setLinks(updated); setSelectedIds(updated.map(l => l.experienceId));
  });
  const saveVersion = () => run('version', async () => {
    await api('/api/cover-letters/' + id + '/versions', { method: 'POST', body: { label: '수동 저장 · ' + new Date().toLocaleString('ko-KR') } });
    notify('현재 자기소개서를 버전으로 보관했어요.', 'success');
  });

  if (loading) return <Loading/>;
  if (error || !cover) return <div className="inline-error">{error || '지원 내역을 찾을 수 없어요.'}</div>;
  const count = Array.from(draft).length;
  return <div className="application-detail">
    <Link to="/applications" className="back-link"><ArrowLeft size={17}/> 지원 관리로 돌아가기</Link>
    <div className="detail-heading"><div><span className="eyebrow">APPLICATION WORKSPACE</span><h1>{cover.companyName} <span className="heading-light">/ {cover.positionName}</span></h1><p>마감일 {displayDate(cover.deadline)} · 기업에 맞는 나만의 이야기를 준비하세요.</p></div><div className="detail-heading-actions"><StatusPill value={cover.status}/><Button variant="secondary" onClick={saveVersion} disabled={Boolean(working)} icon={<Save size={16}/>}>버전 보관</Button></div></div>
    <div className="workspace-tabs"><button className={tab === 'editor' ? 'workspace-tab active' : 'workspace-tab'} onClick={() => setTab('editor')}><FilePenLine size={17}/> 자기소개서 편집</button><button className={tab === 'posting' ? 'workspace-tab active' : 'workspace-tab'} onClick={() => setTab('posting')}><ClipboardCheck size={17}/> 채용공고 분석</button></div>
    {tab === 'editor' ? <div className="editor-layout">
      <aside className="question-sidebar content-card"><div className="question-sidebar-head"><h3>자소서 문항</h3><span>{detail?.questions.length || 0}</span></div>{detail?.questions.length ? detail.questions.map((q, index) => <button key={q.id} className={'question-nav ' + (current?.id === q.id ? 'selected' : '')} onClick={() => switchQuestion(q)}><span>Q{index + 1}</span><strong>{q.questionText}</strong><ChevronRight size={16}/></button>) : <p className="quiet-text">아직 문항이 없어요.</p>}<button className="add-question-btn" onClick={() => setQuestionModal(true)}><Plus size={16}/> 문항 추가하기</button><div className="question-tip"><Sparkles size={18}/><span>문항에 맞는 경험을 연결하면 더 구체적인 초안을 만들 수 있어요.</span></div></aside>
      <section className="editor-center">{current ? <div className="content-card editor-main"><div className="editor-header"><span className="eyebrow">QUESTION EDITOR</span><span className="small-label">Q{(detail?.questions.findIndex(q => q.id === current.id) || 0) + 1}</span></div><h2>{current.questionText}</h2><div className="editor-controls"><label>문항 유형 <select value={questionType} onChange={e => setQuestionType(e.target.value)}>{QUESTION_TYPES.map(x => <option key={x.value} value={x.value}>{x.label}</option>)}</select></label><button onClick={() => ai('analyze')} disabled={Boolean(working)}><Sparkles size={16}/> AI 문항 분석</button></div><div className="editor-text-heading"><strong>나의 답변</strong><span className={count > current.characterLimit ? 'count-over' : ''}>{count} / {current.characterLimit}자</span></div><textarea className="answer-editor" value={draft} onChange={e => setDraft(e.target.value)} placeholder="여기에 나만의 이야기를 작성해 보세요.&#10;&#10;무엇을 했는지보다, 왜 그렇게 생각했고 어떻게 행동했는지에 집중해 보세요."/><div className="editor-bottom"><span>AI 제안은 저장되지 않아요. 직접 검토한 뒤 저장해 주세요.</span><Button icon={<Save size={17}/>} onClick={saveAnswer} disabled={Boolean(working)}>답변 저장</Button></div></div> : <div className="content-card"><EmptyState title="문항을 추가해 주세요" description="작성할 자기소개서 질문을 먼저 등록해 주세요." action={<Button onClick={() => setQuestionModal(true)}>문항 추가</Button>}/></div>}
      {current && <div className="content-card linked-experiences"><div className="card-heading-line"><div><span className="eyebrow">STORY CONNECTION</span><h3>연결할 경험 선택</h3></div><Link to="/experiences" className="subtle-link">경험 관리 <ArrowRight size={15}/></Link></div><p>저장된 구조화 경험과 문항을 연결해야 AI 초안에서 활용할 수 있어요.</p><div className="linked-chips">{experiences.length ? experiences.map(exp => <button key={exp.id} className={'linked-chip ' + (selectedIds.includes(exp.id) ? 'on' : '')} onClick={() => toggleExperience(exp.id)}><span className="chip-check">{selectedIds.includes(exp.id) ? <Check size={13}/> : <Plus size={13}/>}</span>{exp.title}</button>) : <span className="quiet-text">저장된 경험이 없습니다. 내 경험에서 먼저 기록해 주세요.</span>}</div></div>}
      {preview?.text && <div className="content-card ai-preview-panel"><div className="card-heading-line"><div><span className="eyebrow">AI SUGGESTION · NOT SAVED</span><h3>AI 작성 제안</h3></div>{preview.isMock && <span className="status status-neutral">Mock</span>}</div><p>결과를 읽고 사실관계를 확인해 주세요. 적용해도 저장 전에는 원문이 변경되지 않습니다.</p><div className="ai-preview-text">{preview.text}</div><div className="editor-bottom"><Button variant="secondary" onClick={() => setPreview(null)}>닫기</Button><Button onClick={() => { setDraft(preview.text || ''); setPreview(null); notify('편집기에 반영했어요. 답변 저장을 눌러 확정해 주세요.', 'info'); }}>편집기에 적용 <ArrowRight size={16}/></Button></div></div>}
      </section>
      <aside className="editor-ai-panel"><div className="assistant-panel-head"><div className="assistant-icon"><Sparkles size={22}/></div><span className="eyebrow">STORI AI ASSISTANT</span><h3>더 나은 한 문장을<br/>함께 만들어요.</h3><p>내 경험을 토대로 초안부터 첨삭까지 도와드릴게요.</p></div><div className="assistant-feature-buttons"><button onClick={() => ai('draft')} disabled={!current || Boolean(working)}><WandSparkles size={18}/><span><strong>초안 생성</strong><small>연결된 경험으로 첫 문장 시작</small></span><ArrowRight size={16}/></button><button onClick={() => ai('strategy')} disabled={!current || Boolean(working)}><ListChecks size={18}/><span><strong>지원 전략</strong><small>강점과 보완할 근거 분석</small></span><ArrowRight size={16}/></button></div><div className="assistant-edit"><h4>AI 첨삭 · 대화</h4><label className="field"><span className="field-label">첨삭 방향</span><select value={revisionType} onChange={e => setRevisionType(e.target.value)}>{REVISION_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}</select></label><label className="field"><span className="field-label">추가 요청</span><textarea value={instruction} onChange={e => setInstruction(e.target.value)} rows={3} placeholder="예: 직무와 연결되는 부분을 강조해 줘" maxLength={1000}/></label><div className="assistant-action-pair"><button onClick={() => ai('revise')} disabled={Boolean(working) || !draft.trim()}>첨삭하기</button><button onClick={() => ai('chat')} disabled={Boolean(working) || !draft.trim() || !instruction.trim()}><MessageCircle size={15}/> 이어서 대화</button></div>{aiTurnList.length > 0 && <div className="chat-history-preview"><strong>첨삭 대화 {aiTurnList.length}개</strong>{aiTurnList.slice(-2).map((t, i) => <p key={i}><span>요청:</span> {t.instruction}</p>)}</div>}</div>{working && <div className="assistant-working"><LoaderCircle size={17} className="spinning"/> AI 기능 처리 중...</div>}</aside>
    </div> : <div className="posting-layout"><section className="content-card posting-main"><div className="card-heading-line"><div><span className="eyebrow">JOB DESCRIPTION</span><h2>채용공고 원문</h2></div><span className="small-label"><BookOpen size={15}/> 저장 후 분석</span></div><p className="intro-copy">공고에 적힌 요구사항을 그대로 입력해 주세요. 출처 없는 정보는 AI가 임의로 만들지 않습니다.</p><Field label="공고 URL (선택)"><input type="url" value={posting.url || ''} onChange={e => setPosting(v => ({ ...v, url: e.target.value }))} placeholder="https://..."/></Field><Field label="채용공고 본문"><textarea className="jd-editor" rows={13} value={posting.jdOriginal || ''} onChange={e => setPosting(v => ({ ...v, jdOriginal: e.target.value }))} placeholder="기업의 채용공고 내용을 붙여 넣어 주세요."/></Field><div className="card-save-row"><span>변경한 내용은 분석 전 저장해야 반영됩니다.</span><Button icon={<Save size={16}/>} onClick={saveJd} disabled={Boolean(working)}>채용공고 저장</Button></div></section><aside className="posting-tools"><div className="ai-assistant-card"><div className="assistant-icon"><Sparkles size={22}/></div><span className="eyebrow">AI JOB INSIGHTS</span><h3>채용공고를<br/>더 깊이 이해해요.</h3><p>요구 역량과 담당 업무를 근거와 함께 살펴볼 수 있어요.</p><div className="assistant-action-stack"><button onClick={() => jdAi('analyze')} disabled={Boolean(working)}><ClipboardCheck size={17}/> JD 핵심 분석 <ArrowRight size={16}/></button><button onClick={() => jdAi('role-analyze')} disabled={Boolean(working)}><ListChecks size={17}/> 직무 분석 <ArrowRight size={16}/></button></div></div><div className="content-card company-source"><h3>기업 자료 분석</h3><p>기업 소개 자료의 URL과 본문을 직접 입력해 주세요.</p><Field label="출처 URL"><input type="url" placeholder="https://..." value={companyUrl} onChange={e => setCompanyUrl(e.target.value)}/></Field><Field label="자료 본문"><textarea rows={5} placeholder="분석할 공식 자료 본문 붙여 넣기" value={companyText} onChange={e => setCompanyText(e.target.value)}/></Field><Button variant="secondary" full onClick={companyAi} disabled={Boolean(working)}>기업 자료 AI 분석 <ArrowRight size={16}/></Button></div></aside></div>}
    {suggestion && <div className="content-card analysis-result"><div className="card-heading-line"><div><span className="eyebrow">AI INSIGHT · UNVERIFIED</span><h2>AI 분석 미리보기</h2></div><button className="text-button" onClick={() => setSuggestion(null)}>닫기</button></div>{suggestion.isMock && <p className="review-notice">Mock 응답입니다. 실제 AI가 생성한 분석이 아닙니다.</p>}<pre>{JSON.stringify(suggestion.analysis || suggestion, null, 2)}</pre></div>}
    <Modal open={questionModal} title="자기소개서 문항 추가" subtitle="기업에서 요구한 질문을 그대로 입력해 주세요." onClose={() => setQuestionModal(false)} footer={<><Button variant="secondary" onClick={() => setQuestionModal(false)}>취소</Button><Button disabled={!newQuestion.trim() || Boolean(working)} onClick={addQuestion}>문항 추가 <ArrowRight size={16}/></Button></>}><div className="stack-fields"><Field label="문항 내용"><textarea rows={4} value={newQuestion} onChange={e => setNewQuestion(e.target.value)} placeholder="지원 동기와 입사 후 포부를 작성해 주세요."/></Field><Field label="글자 수 제한"><input type="number" min={1} max={10000} value={newLimit} onChange={e => setNewLimit(Number(e.target.value))}/></Field></div></Modal>
  </div>;
}
