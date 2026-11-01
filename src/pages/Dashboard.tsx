import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen, BriefcaseBusiness, CalendarDays, Check, ChevronRight, Layers3, Plus, Sparkles, WandSparkles } from 'lucide-react';
import { api } from '../lib/api';
import { sampleApplications, sampleExperiences } from '../lib/demo';
import { useSession } from '../lib/session';
import type { Application, Experience } from '../lib/types';
import { displayDate, initial, TAG_NAMES } from '../lib/types';
import { EmptyState, Loading, PageHeading, SectionHeading, StatusPill } from '../components/UI';

export default function Dashboard() {
  const { demo } = useSession();
  const [experiences, setExperiences] = useState<Experience[]>(demo ? sampleExperiences : []);
  const [applications, setApplications] = useState<Application[]>(demo ? sampleApplications : []);
  const [loading, setLoading] = useState(!demo);
  const [error, setError] = useState('');
  useEffect(() => {
    if (demo) return;
    let alive = true;
    Promise.all([
      api<Experience[]>('/api/experiences?size=100'),
      api<Application[]>('/api/cover-letters?size=100')
    ]).then(([exp, app]) => { if (alive) { setExperiences(exp); setApplications(app); } })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : '데이터를 불러오지 못했어요.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [demo]);
  const completed = experiences.filter(x => x.status === 'COMPLETED').length;
  const active = applications.filter(x => x.status === 'IN_PROGRESS').length;
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  return <div className="dashboard-page">
    <PageHeading eyebrow={today} title="좋은 아침이에요. 👋" description="당신의 다음 기회를 위해, 오늘도 한 걸음씩."/>
    {demo && <div className="preview-note"><span className="preview-note-dot"/> 현재 샘플 워크스페이스를 둘러보고 있어요. 로그인하면 실제 데이터를 확인할 수 있습니다.</div>}
    <section className="hero-panel">
      <div className="hero-copy"><span className="hero-tag"><Sparkles size={14}/> YOUR STORY, YOUR FUTURE</span><h2>당신의 경험에는<br/><em>아직 발견하지 못한</em><br/>가능성이 있어요.</h2><p>흩어진 경험을 정리하고, 나만의 강점을 발견하세요.<br/>그 이야기가 다음 기회의 시작이 될 거예요.</p><Link to="/experiences" className="hero-cta">내 경험 정리하기 <ArrowUpRight size={18}/></Link></div>
      <div className="hero-visual" aria-hidden="true"><div className="hero-glow"/><div className="hero-circle circle-a"/><div className="hero-circle circle-b"/><div className="hero-orb"><div className="hero-orb-shine"/></div><div className="hero-visual-label label-one">Your potential <span>↗</span></div><div className="hero-visual-label label-two"><span>✦</span> A new chapter</div></div>
    </section>
    {loading ? <Loading/> : error ? <div className="inline-error">{error}</div> : <>
      <section className="stats-grid" aria-label="워크스페이스 요약">
        <div className="metric-card"><div className="metric-top"><span>정리한 경험</span><div className="metric-icon metric-blue"><BookOpen size={19}/></div></div><div className="metric-number">{experiences.length}<small>개</small></div><p>기록이 쌓일수록 강점이 선명해져요.</p></div>
        <div className="metric-card"><div className="metric-top"><span>완성한 경험</span><div className="metric-icon metric-mint"><Check size={20}/></div></div><div className="metric-number">{completed}<small>개</small></div><p>자소서에 활용할 준비가 되었어요.</p></div>
        <div className="metric-card"><div className="metric-top"><span>준비 중인 지원</span><div className="metric-icon metric-violet"><BriefcaseBusiness size={19}/></div></div><div className="metric-number">{active}<small>건</small></div><p>차근차근 다음 커리어를 준비해요.</p></div>
      </section>
      <div className="dashboard-columns">
        <section className="content-card dashboard-list-card">
          <SectionHeading title="최근 기록한 경험" action={<Link to="/experiences" className="subtle-link">전체 보기 <ArrowRight size={15}/></Link>}/>
          {experiences.length === 0 ? <EmptyState title="아직 기록한 경험이 없어요" description="첫 번째 경험을 남겨 보세요." action={<Link to="/experiences" className="mini-action"><Plus size={16}/> 기록하기</Link>}/> :
            <div className="recent-list">{experiences.slice(0, 4).map((exp, index) => <Link className="recent-row" to={'/experiences/' + exp.id} key={exp.id}><div className={'recent-exp-icon exp-palette-' + index % 4}><Layers3 size={19}/></div><div className="recent-row-body"><strong>{exp.title}</strong><span>{TAG_NAMES[exp.tagCode] || exp.tagCode} · {displayDate(exp.updatedAt)}</span></div><StatusPill value={exp.status}/><ChevronRight className="row-chevron" size={17}/></Link>)}</div>}
          <Link className="card-bottom-link" to="/experiences"><Plus size={17}/> 새 경험 기록하기 <ArrowRight size={16}/></Link>
        </section>
        <section className="content-card dashboard-list-card">
          <SectionHeading title="진행 중인 지원" action={<Link to="/applications" className="subtle-link">전체 보기 <ArrowRight size={15}/></Link>}/>
          {applications.length === 0 ? <EmptyState title="아직 지원 내역이 없어요" description="관심 있는 기업을 추가해 보세요." action={<Link to="/applications" className="mini-action"><Plus size={16}/> 추가하기</Link>}/> :
            <div className="recent-list">{applications.slice(0, 4).map((app, index) => <Link className="recent-row" to={'/applications/' + app.id} key={app.id}><div className={'company-avatar company-' + index % 4}>{initial(app.companyName)}</div><div className="recent-row-body"><strong>{app.companyName}</strong><span>{app.positionName}</span></div><div className="recent-date"><CalendarDays size={14}/>{app.deadline ? displayDate(app.deadline) : '마감일 미정'}</div><ChevronRight className="row-chevron" size={17}/></Link>)}</div>}
          <Link className="card-bottom-link" to="/applications"><Plus size={17}/> 새 지원 준비하기 <ArrowRight size={16}/></Link>
        </section>
      </div>
      <section className="next-step-card"><div className="step-badge"><WandSparkles size={22}/></div><div><span className="eyebrow">THE NEXT STEP</span><h3>준비한 경험을, 설득력 있는 자기소개서로.</h3><p>나의 경험과 채용공고를 연결해 조금 더 나다운 이야기를 완성해 보세요.</p></div><Link to="/applications" className="outline-action">자소서 작성하러 가기 <ArrowRight size={17}/></Link></section>
    </>}
  </div>;
}
