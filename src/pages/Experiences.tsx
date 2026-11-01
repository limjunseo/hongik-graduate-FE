import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, Check, ChevronRight, Lightbulb, Plus, Search, SlidersHorizontal, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { sampleExperiences, sampleTags } from '../lib/demo';
import { useSession } from '../lib/session';
import type { Experience, ExperienceTag } from '../lib/types';
import { displayDate, TAG_NAMES } from '../lib/types';
import { Button, EmptyState, Field, Loading, Modal, PageHeading, StatusPill } from '../components/UI';

export default function Experiences() {
  const { demo, guardDemo, notify } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState<Experience[]>(demo ? sampleExperiences : []);
  const [tags, setTags] = useState<ExperienceTag[]>(sampleTags);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [tag, setTag] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [chosenTag, setChosenTag] = useState('STAR');
  const [saving, setSaving] = useState(false);
  const load = () => api<Experience[]>('/api/experiences?size=100').then(setItems);
  useEffect(() => {
    if (demo) return;
    let alive = true;
    Promise.all([api<Experience[]>('/api/experiences?size=100'), api<ExperienceTag[]>('/api/experience-tags')])
      .then(([exp, tagList]) => { if (alive) { setItems(exp); setTags(tagList); } })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : '불러오지 못했어요.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [demo]);
  const filtered = useMemo(() => items.filter(x => (tag === 'ALL' || x.tagCode === tag) && (x.title.toLowerCase().includes(query.toLowerCase()) || (x.summary || '').toLowerCase().includes(query.toLowerCase()))), [items, query, tag]);
  const create = async () => {
    if (guardDemo()) return;
    if (!title.trim()) { notify('경험 제목을 입력해 주세요.', 'error'); return; }
    setSaving(true);
    try {
      const result = await api<Experience>('/api/experiences', { method: 'POST', body: { title: title.trim(), tagCode: chosenTag, creationMethod: 'QUICK', startedAt: null, endedAt: null } });
      notify('새 경험이 추가되었어요.', 'success'); setOpen(false); setTitle('');
      navigate('/experiences/' + result.id);
    } catch (e) { notify(e instanceof Error ? e.message : '경험을 추가하지 못했어요.', 'error'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    if (guardDemo()) return;
    if (!window.confirm('이 경험과 관련된 답변을 모두 삭제할까요?')) return;
    try { await api('/api/experiences/' + id, { method: 'DELETE' }); await load(); notify('경험을 삭제했어요.', 'success'); }
    catch (e) { notify(e instanceof Error ? e.message : '삭제하지 못했어요.', 'error'); }
  };
  return <div>
    <PageHeading eyebrow="YOUR EXPERIENCE LIBRARY" title="내 경험" description="작은 순간들도 모이면, 당신만의 이야기가 돼요." action={<Button icon={<Plus size={18}/>} onClick={() => setOpen(true)}>새 경험 추가</Button>}/>
    <div className="collection-intro"><div className="intro-icon"><BookOpen size={24}/></div><div><strong>모든 경험은 자산이 됩니다.</strong><p>프로젝트, 협업, 도전 등 어떤 경험이든 좋아요. 기록이 곧 나만의 경쟁력이에요.</p></div><span className="intro-count">{items.length} <small>기록</small></span></div>
    <div className="collection-toolbar"><div className="search-field"><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="내 경험 검색하기..." aria-label="경험 검색"/></div><div className="filter-icon"><SlidersHorizontal size={18}/></div></div>
    <div className="filter-pills" role="group" aria-label="경험 유형"><button className={tag === 'ALL' ? 'filter-pill selected' : 'filter-pill'} onClick={() => setTag('ALL')}>전체 <span>{items.length}</span></button>{tags.map(t => <button key={t.code} className={tag === t.code ? 'filter-pill selected' : 'filter-pill'} onClick={() => setTag(t.code)}>{t.name}</button>)}</div>
    {loading ? <Loading/> : error ? <div className="inline-error">{error}</div> : filtered.length === 0 ?
      <div className="content-card"><EmptyState title={items.length === 0 ? '첫 번째 경험을 기록해 보세요' : '일치하는 경험이 없어요'} description={items.length === 0 ? '프로젝트, 동아리, 수업 등 어떤 경험이든 시작해 보세요.' : '다른 검색어 또는 필터를 선택해 보세요.'} action={<Button variant="secondary" onClick={() => setOpen(true)} icon={<Plus size={16}/>}>경험 추가</Button>}/></div> :
      <div className="experience-grid">{filtered.map((exp, idx) => <article className="experience-card" key={exp.id}><div className="experience-card-top"><div className={'experience-art exp-art-' + (idx % 5)}><Lightbulb size={25}/></div><StatusPill value={exp.status}/></div><div className="experience-card-meta">{TAG_NAMES[exp.tagCode] || exp.tagCode}</div><h3>{exp.title}</h3><p>{exp.summary || '이 경험의 핵심을 짧게 정리해 보세요.'}</p><div className="experience-card-footer"><span>{displayDate(exp.updatedAt)}</span><div><button className="row-delete" title="경험 삭제" aria-label="경험 삭제" onClick={() => remove(exp.id)}><Trash2 size={16}/></button><Link to={'/experiences/' + exp.id} aria-label={exp.title + ' 상세 보기'} className="circle-next"><ChevronRight size={19}/></Link></div></div></article>)}</div>}
    <div className="experience-bottom-banner"><div className="bottom-banner-symbol"><Sparkles size={21}/></div><div><strong>AI와 함께 경험을 더 선명하게</strong><span>이야기에 부족한 부분을 질문으로 찾아드려요.</span></div><Link to={filtered[0] ? '/experiences/' + filtered[0].id : '/experiences'}>살펴보기 <ArrowUpRight size={16}/></Link></div>
    <Modal open={open} title="새 경험 기록하기" subtitle="먼저 경험의 제목과 유형을 정해 보세요." onClose={() => setOpen(false)} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>취소</Button><Button onClick={create} disabled={saving} icon={<Check size={17}/>}>{saving ? '추가 중...' : '경험 만들기'}</Button></>}>
      <div className="stack-fields"><Field label="경험 제목"><input value={title} onChange={e => setTitle(e.target.value)} maxLength={150} placeholder="예: 졸업 프로젝트에서 팀을 이끈 경험" autoFocus/></Field><Field label="경험 유형"><select value={chosenTag} onChange={e => setChosenTag(e.target.value)}>{tags.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}</select></Field></div>
    </Modal>
  </div>;
}
