import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, ChevronRight, CirclePlus, Search, Sparkles, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { sampleApplications } from '../lib/demo';
import { useSession } from '../lib/session';
import type { Application } from '../lib/types';
import { displayDate, initial } from '../lib/types';
import { Button, EmptyState, Field, Loading, Modal, PageHeading, StatusPill } from '../components/UI';

const tabs = [
  { value: 'ALL', label: '전체' }, { value: 'DRAFT', label: '작성 중' },
  { value: 'IN_PROGRESS', label: '진행 중' }, { value: 'COMPLETED', label: '완료' }
];
export default function Applications() {
  const { demo, guardDemo, notify } = useSession();
  const navigate = useNavigate();
  const [items, setItems] = useState<Application[]>(demo ? sampleApplications : []);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [open, setOpen] = useState(false);
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const load = () => api<Application[]>('/api/cover-letters?size=100').then(setItems);
  useEffect(() => {
    if (demo) return;
    let alive = true;
    load().catch(e => { if (alive) setError(e instanceof Error ? e.message : '불러오지 못했어요.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [demo]);
  const filtered = useMemo(() => items.filter(x => (filter === 'ALL' || x.status === filter) && (x.companyName.toLowerCase().includes(search.toLowerCase()) || x.positionName.toLowerCase().includes(search.toLowerCase()))), [items, search, filter]);
  const create = async () => {
    if (guardDemo()) return;
    if (!company.trim() || !position.trim()) { notify('기업명과 직무를 입력해 주세요.', 'error'); return; }
    setSaving(true);
    try {
      const result = await api<Application>('/api/cover-letters', { method: 'POST', body: { companyName: company.trim(), positionName: position.trim(), deadline: deadline || null, jdUrl: null } });
      setOpen(false); notify('지원 내역을 추가했어요.', 'success'); navigate('/applications/' + result.id);
    } catch (e) { notify(e instanceof Error ? e.message : '추가하지 못했어요.', 'error'); }
    finally { setSaving(false); }
  };
  const remove = async (id: string) => {
    if (guardDemo()) return;
    if (!window.confirm('이 지원 내역과 자기소개서 문항을 모두 삭제할까요?')) return;
    try { await api('/api/cover-letters/' + id, { method: 'DELETE' }); await load(); notify('지원 내역을 삭제했어요.', 'success'); }
    catch (e) { notify(e instanceof Error ? e.message : '삭제하지 못했어요.', 'error'); }
  };
  return <div>
    <PageHeading eyebrow="YOUR APPLICATIONS" title="지원 관리" description="관심 있는 기업부터 자기소개서까지, 한 곳에서 차근차근." action={<Button icon={<CirclePlus size={18}/>} onClick={() => setOpen(true)}>지원 추가하기</Button>}/>
    <div className="application-summary"><div className="summary-lead"><div className="summary-symbol"><BriefcaseBusiness size={25}/></div><div><strong>나의 지원 현황</strong><p>각 기회를 놓치지 않도록 정리해 보세요.</p></div></div><div className="summary-numbers"><div><strong>{items.length}</strong><span>전체 지원</span></div><div><strong>{items.filter(x => x.status === 'IN_PROGRESS').length}</strong><span>진행 중</span></div><div><strong>{items.filter(x => x.status === 'COMPLETED').length}</strong><span>완료</span></div></div></div>
    <div className="collection-toolbar"><div className="search-field"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="기업명 또는 직무 검색..." aria-label="지원 내역 검색"/></div></div>
    <div className="filter-pills">{tabs.map(t => <button className={filter === t.value ? 'filter-pill selected' : 'filter-pill'} key={t.value} onClick={() => setFilter(t.value)}>{t.label}<span>{t.value === 'ALL' ? items.length : items.filter(x => x.status === t.value).length}</span></button>)}</div>
    {loading ? <Loading/> : error ? <div className="inline-error">{error}</div> : filtered.length === 0 ?
      <div className="content-card"><EmptyState title={items.length ? '해당하는 지원이 없어요' : '첫 번째 지원을 추가해 보세요'} description={items.length ? '다른 필터로 찾아보세요.' : '기업명과 지원 직무만 입력해도 시작할 수 있어요.'} action={<Button variant="secondary" onClick={() => setOpen(true)} icon={<CirclePlus size={16}/>}>새 지원 만들기</Button>}/></div> :
      <div className="application-grid">{filtered.map((app, index) => <article className="application-card" key={app.id}><div className="application-top"><div className={'company-large company-' + index % 4}>{initial(app.companyName)}</div><StatusPill value={app.status}/></div><h3>{app.companyName}</h3><p className="app-position">{app.positionName}</p><div className="application-meta"><span><CalendarDays size={15}/> 마감 {displayDate(app.deadline)}</span><span>최근 수정 {displayDate(app.updatedAt)}</span></div><div className="application-footer"><button onClick={() => remove(app.id)} aria-label="지원 삭제" className="row-delete"><Trash2 size={16}/></button><Link to={'/applications/' + app.id}>자소서 편집하기 <ArrowRight size={17}/></Link></div></article>)}</div>}
    <div className="experience-bottom-banner"><div className="bottom-banner-symbol"><Sparkles size={22}/></div><div><strong>지원할 기업의 요구사항을 읽어보세요.</strong><span>JD 분석과 경험 연결로 더 구체적인 자기소개서를 준비할 수 있어요.</span></div><Link to={filtered[0] ? '/applications/' + filtered[0].id : '/applications'}>시작하기 <ArrowUpRight size={17}/></Link></div>
    <Modal open={open} title="새 지원 준비하기" subtitle="기업과 직무 정보를 먼저 입력해 주세요." onClose={() => setOpen(false)} footer={<><Button variant="secondary" onClick={() => setOpen(false)}>취소</Button><Button disabled={saving} onClick={create} icon={<ChevronRight size={17}/>}>{saving ? '생성 중...' : '지원 만들기'}</Button></>}>
      <div className="stack-fields"><Field label="기업명"><input autoFocus value={company} onChange={e => setCompany(e.target.value)} maxLength={150} placeholder="예: 토스"/></Field><Field label="지원 직무"><input value={position} onChange={e => setPosition(e.target.value)} maxLength={150} placeholder="예: Backend Developer"/></Field><Field label="지원 마감일 (선택)"><input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}/></Field></div>
    </Modal>
  </div>;
}
