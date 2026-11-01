import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, CircleHelp, LoaderCircle, MessageCircle, Save, Send, Sparkles, WandSparkles } from 'lucide-react';
import { api } from '../lib/api';
import { sampleExperiences, sampleQuestions } from '../lib/demo';
import { useSession } from '../lib/session';
import type { AiPreview, ChatTurn, ExperienceDetail as Detail, ExperienceQuestion, Summary } from '../lib/types';
import { TAG_NAMES } from '../lib/types';
import { Button, Loading, StatusPill } from '../components/UI';

const fields: { key: keyof Summary; label: string }[] = [
  { key: 'situation', label: '상황 (Situation)' }, { key: 'task', label: '과제 (Task)' },
  { key: 'action', label: '행동 (Action)' }, { key: 'result', label: '결과 (Result)' },
  { key: 'role', label: '역할' }, { key: 'conflict', label: '갈등' }, { key: 'learned', label: '배운 점' }
];
export default function ExperienceDetail() {
  const { id = '' } = useParams();
  const { demo, guardDemo, notify } = useSession();
  const [detail, setDetail] = useState<Detail | null>(demo ? { experience: sampleExperiences.find(x => x.id === id) || sampleExperiences[0], answers: [], progress: 50 } : null);
  const [questions, setQuestions] = useState<ExperienceQuestion[]>(demo ? sampleQuestions : []);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [note, setNote] = useState(detail?.experience.summary || '');
  const [preview, setPreview] = useState<Summary | null>(null);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState<AiPreview | null>(null);
  const [loading, setLoading] = useState(!demo);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    if (demo) return;
    let alive = true;
    const load = async () => {
      const data = await api<Detail>('/api/experiences/' + id);
      const [q, history] = await Promise.all([
        api<ExperienceQuestion[]>('/api/experience-tags/' + data.experience.tagCode + '/questions'),
        api<ChatTurn[]>('/api/experiences/' + id + '/ai-chat/messages?size=40').catch(() => [] as ChatTurn[])
      ]);
      if (!alive) return;
      setDetail(data); setQuestions(q); setChat(history); setNote(data.experience.summary || '');
      setAnswers(Object.fromEntries(data.answers.filter(a => a.questionId).map(a => [a.questionId!, a.content])));
    };
    load().catch(e => { if (alive) setError(e instanceof Error ? e.message : '불러오지 못했어요.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [demo, id]);
  const run = async (label: string, action: () => Promise<void>) => {
    if (guardDemo()) return;
    setWorking(label);
    try { await action(); } catch (e) { notify(e instanceof Error ? e.message : '요청에 실패했어요.', 'error'); }
    finally { setWorking(''); }
  };
  const save = () => run('save', async () => {
    await api('/api/experiences/' + id, { method: 'PATCH', body: { summary: note } });
    await api('/api/experiences/' + id + '/answers', { method: 'PUT', body: { answers: [
      ...questions.map(q => ({ questionId: q.id, customLabel: null, content: answers[q.id] || '', displayOrder: q.displayOrder })),
      ...(detail?.answers.filter(a => !a.questionId).map(a => ({ questionId: null, customLabel: a.customLabel, content: a.content, displayOrder: a.displayOrder })) || [])
    ] } });
    notify('경험이 저장되었어요.', 'success');
  });
  const askNext = () => run('next', async () => {
    const response = await api<AiPreview>('/api/experiences/' + id + '/ai-chat/next-question', { method: 'POST' });
    setSuggestion(response);
  });
  const summarize = () => run('summary', async () => {
    const response = await api<{ summary: Summary }>('/api/experiences/' + id + '/ai-summary:generate', { method: 'POST' });
    setPreview(response.summary); notify('AI 요약을 만들었어요. 내용을 확인해 주세요.', 'info');
  });
  const confirmSummary = () => run('confirm', async () => {
    if (!preview) return;
    await api('/api/experiences/' + id + '/structured-summary', { method: 'PUT', body: preview });
    notify('검토한 경험 요약을 저장했어요.', 'success'); setPreview(null);
  });
  const send = () => run('chat', async () => {
    if (!prompt.trim()) return;
    const response = await api<{ user: ChatTurn; assistant: ChatTurn }>('/api/experiences/' + id + '/ai-chat/messages', { method: 'POST', body: { message: prompt.trim(), requestId: crypto.randomUUID() } });
    setChat(previous => [...previous, response.user, response.assistant]); setPrompt('');
  });
  if (loading) return <Loading/>;
  if (error || !detail) return <div className="inline-error">{error || '경험을 찾을 수 없어요.'}</div>;
  const experience = detail.experience;
  return <div>
    <Link to="/experiences" className="back-link"><ArrowLeft size={17}/> 내 경험으로 돌아가기</Link>
    <div className="detail-heading"><div><span className="eyebrow">{TAG_NAMES[experience.tagCode] || experience.tagCode}</span><h1>{experience.title}</h1><p>경험을 구체적으로 기록하고 강점을 발견해 보세요.</p></div><div className="detail-heading-actions"><StatusPill value={experience.status}/><Button onClick={save} disabled={Boolean(working)} icon={<Save size={17}/>}>{working === 'save' ? '저장 중...' : '저장하기'}</Button></div></div>
    <div className="detail-two-columns">
      <section className="detail-primary"><div className="content-card detail-card"><div className="card-heading-line"><div><span className="eyebrow">THE STORY</span><h2>경험의 이야기</h2></div><span className="small-label"><BookOpen size={15}/> 빠른 기록</span></div><label className="field"><span className="field-label">한 줄 요약</span><textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="이 경험에서 가장 중요했던 점은 무엇인가요?" maxLength={20000}/></label><div className="form-divider"/><div className="section-intro"><h3>차근차근 답해 보세요.</h3><p>완벽한 문장일 필요 없어요. 기억나는 사실부터 적으면 됩니다.</p></div><div className="question-fields">{questions.map((q, idx) => <label className="question-field" key={q.id}><div className="q-number">{String(idx + 1).padStart(2, '0')}</div><div className="q-body"><strong>{q.prompt || q.questionText || q.label || q.code}</strong>{q.required && <span className="required-mark">필수</span>}<textarea rows={4} value={answers[q.id] || ''} maxLength={5000} onChange={e => setAnswers(v => ({ ...v, [q.id]: e.target.value }))} placeholder="당시 상황을 구체적으로 작성해 보세요."/></div></label>)}</div><div className="card-save-row"><span>입력 내용은 저장 버튼을 눌러야 반영됩니다.</span><Button variant="secondary" onClick={save} disabled={Boolean(working)} icon={<Check size={16}/>}>변경사항 저장</Button></div></div>
      {preview && <div className="content-card summary-review"><div className="card-heading-line"><div><span className="eyebrow">REVIEW FIRST</span><h2>AI 구조화 요약 검토</h2></div><span className="status status-blue">미적용 미리보기</span></div><p className="review-notice">생성 결과는 사실과 다를 수 있어요. 직접 확인·수정한 뒤 저장해 주세요.</p>{fields.map(f => <label className="field" key={f.key}><span className="field-label">{f.label}</span><textarea rows={2} value={String(preview[f.key] || '')} onChange={e => setPreview(v => v ? { ...v, [f.key]: e.target.value || null } : null)}/></label>)}<div className="card-save-row"><Button variant="secondary" onClick={() => setPreview(null)}>취소</Button><Button disabled={Boolean(working)} onClick={confirmSummary}>확인하고 저장</Button></div></div>}
      </section>
      <aside className="detail-aside"><div className="ai-assistant-card"><div className="assistant-icon"><Sparkles size={22}/></div><span className="eyebrow">AI WRITING COMPANION</span><h3>경험을 더 깊이<br/>들여다볼까요?</h3><p>놓친 순간을 발견하고, 생각을 구체적인 이야기로 바꿔보세요.</p><div className="assistant-action-stack"><button disabled={Boolean(working)} onClick={askNext}><WandSparkles size={18}/> 다음 질문 추천 <ArrowRight size={16}/></button><button disabled={Boolean(working)} onClick={summarize}><BookOpen size={18}/> STAR 요약 미리보기 <ArrowRight size={16}/></button></div>{suggestion && <div className="ai-suggestion"><span>추천 질문 · {suggestion.targetField || '다음 단계'}</span><strong>{suggestion.question || '필수 항목을 모두 작성했어요.'}</strong>{suggestion.isMock && <small>Mock 응답 · 실제 AI 아님</small>}</div>}</div>
      <div className="content-card chat-card"><div className="chat-card-header"><span><MessageCircle size={18}/> AI 경험 대화</span><span className="small-label">{chat.length} messages</span></div><div className="chat-scroller">{chat.length ? chat.map((t, i) => <div className={'chat-bubble ' + (t.role === 'USER' ? 'bubble-user' : 'bubble-ai')} key={i}><span>{t.role === 'USER' ? '나' : 'AI'}</span><p>{t.content}</p></div>) : <div className="chat-placeholder"><Sparkles size={23}/><strong>경험에 대해 이야기해 보세요.</strong><p>AI가 질문하며 경험을 구체화하는 데 도움을 줄 거예요.</p></div>}</div><form className="chat-compose" onSubmit={e => { e.preventDefault(); send(); }}><input aria-label="경험 대화 입력" value={prompt} onChange={e => setPrompt(e.target.value)} maxLength={2000} placeholder="경험에 대해 자유롭게 이야기해 보세요"/><button disabled={!prompt.trim() || Boolean(working)} type="submit" aria-label="메시지 전송">{working === 'chat' ? <LoaderCircle size={18} className="spinning"/> : <Send size={18}/>}</button></form></div>
      <div className="aside-info"><CircleHelp size={18}/><p>AI는 제안만 합니다. 모든 내용은 본인이 검토하고 직접 저장해야 해요.</p></div></aside>
    </div>
  </div>;
}
