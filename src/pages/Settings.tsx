import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CircleHelp, ExternalLink, LockKeyhole, LogOut, Monitor, Server, ShieldCheck, Sparkles, UserRound } from 'lucide-react';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import type { Profile } from '../lib/types';
import { Button, Field, Loading, PageHeading } from '../components/UI';

declare const __STORI_BACKEND_PORT__: string;

export default function Settings() {
  const { demo, guardDemo, notify, leave } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [school, setSchool] = useState('');
  const [job, setJob] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(!demo);
  const [saving, setSaving] = useState(false);
  const [backend, setBackend] = useState<'online' | 'offline' | 'checking'>('checking');
  useEffect(() => {
    fetch('/v3/api-docs', { signal: AbortSignal.timeout(4000) })
      .then(r => setBackend(r.ok ? 'online' : 'offline')).catch(() => setBackend('offline'));
    if (demo) { setLoading(false); return; }
    api<Profile>('/api/members/me/profile').then(result => {
      setProfile(result); setSchool(result.school || ''); setJob(result.desiredJob || '');
      setAge(result.age ? String(result.age) : ''); setGender(result.gender || '');
    }).catch(e => notify(e instanceof Error ? e.message : '프로필 정보를 불러오지 못했어요.', 'error'))
      .finally(() => setLoading(false));
  }, [demo]);
  const save = async () => {
    if (guardDemo()) return;
    if (!school.trim() || !job.trim() || !gender || !age || Number(age) < 1 || Number(age) > 120) {
      notify('나이, 성별, 학교, 희망 직무를 모두 입력해 주세요.', 'error');
      return;
    }
    setSaving(true);
    try {
      await api('/api/members/me/profile/basic', { method: 'PUT', body: { age: Number(age), gender, school: school.trim() } });
      await api('/api/members/me/profile/job', { method: 'PUT', body: { desiredJob: job.trim() } });
      notify('프로필이 저장되었어요.', 'success');
    } catch (e) { notify(e instanceof Error ? e.message : '저장하지 못했어요.', 'error'); }
    finally { setSaving(false); }
  };
  const logout = async () => { await leave(); navigate('/login', { replace: true }); };
  return <div>
    <PageHeading eyebrow="PREFERENCES & ACCOUNT" title="환경 설정" description="프로필과 나의 워크스페이스 정보를 관리하세요."/>
    {loading ? <Loading/> : <div className="settings-layout">
      <div className="settings-main">
        <section className="content-card settings-card"><div className="settings-section-title"><div className="settings-icon"><UserRound size={20}/></div><div><h2>내 프로필</h2><p>기본 정보를 관리해 주세요.</p></div></div><div className="profile-banner"><div className="profile-avatar">{demo ? 'D' : (profile?.email?.charAt(0).toUpperCase() || 'M')}</div><div><strong>{demo ? 'Demo Workspace' : profile?.email || '내 계정'}</strong><span>{demo ? '샘플 미리보기 모드' : profile?.profileCompleted ? '프로필 입력 완료' : '프로필을 채워 주세요'}</span></div><span className="status status-blue">{demo ? 'Preview' : 'Active'}</span></div><div className="settings-fields"><Field label="학교"><input placeholder="예: 홍익대학교" value={school} onChange={e => setSchool(e.target.value)}/></Field><Field label="희망 직무"><input placeholder="예: 백엔드 개발자" value={job} onChange={e => setJob(e.target.value)}/></Field><Field label="나이"><input type="number" min={1} max={120} value={age} onChange={e => setAge(e.target.value)} placeholder="나이를 입력해 주세요"/></Field><Field label="성별"><select value={gender} onChange={e => setGender(e.target.value)}><option value="">선택 안 함</option><option value="MALE">남성</option><option value="FEMALE">여성</option><option value="OTHER">기타</option></select></Field></div><div className="settings-actions"><Button icon={<Check size={17}/>} disabled={saving} onClick={save}>{saving ? '저장 중...' : '변경사항 저장'}</Button></div></section>
        <section className="content-card settings-card"><div className="settings-section-title"><div className="settings-icon"><LockKeyhole size={20}/></div><div><h2>계정 및 보안</h2><p>내 계정과 사용 중인 세션을 관리합니다.</p></div></div><div className="setting-list"><div><span><ShieldCheck size={19}/> 인증 방식</span><strong>{demo ? '데모 모드' : 'JWT 로그인'}</strong></div><div><span><Monitor size={19}/> 현재 세션</span><strong>현재 브라우저 탭</strong></div></div><button className="settings-logout" onClick={logout}><LogOut size={17}/> {demo ? '미리보기 종료' : '로그아웃'} <ArrowRight size={16}/></button></section>
      </div>
      <aside className="settings-side"><div className="content-card system-card"><div className="card-heading-line"><h3>로컬 서버 상태</h3><span className={'connection-status ' + (backend === 'online' ? 'connection-online' : '')}>{backend === 'online' ? '연결됨' : backend === 'checking' ? '확인 중' : '연결 안 됨'}</span></div><div className="server-row"><Server size={19}/><span>Spring Boot API</span><strong>{'localhost:' + __STORI_BACKEND_PORT__}</strong></div><div className="server-row"><Monitor size={19}/><span>React Frontend</span><strong>localhost:5173</strong></div><p>프론트엔드는 Vite 프록시로 백엔드와 통신합니다. API 키는 백엔드에만 저장해야 합니다.</p></div><div className="content-card helper-card"><div className="settings-helper-icon"><Sparkles size={22}/></div><h3>AI 기능 사용 안내</h3><p>백엔드 <code>be/.env-local</code> 파일에 <code>AI_API_KEY</code>를 추가하면 AI 기능을 사용할 수 있어요. 프론트엔드 코드에는 API 키를 넣지 마세요.</p><a href="https://github.com/limjunseo/hongik-graduate-BE/blob/main/docs/AI_READY_GUIDE.md" target="_blank" rel="noopener noreferrer">설정 가이드 보기 <ExternalLink size={15}/></a></div><div className="help-caption"><CircleHelp size={18}/><span>팀원과 작업할 때는 각자의 로컬 환경에 시크릿을 관리해 주세요.</span></div></aside>
    </div>}
  </div>;
}
