import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, BookOpen, BriefcaseBusiness, CircleHelp, Command, Compass, LayoutDashboard, LogOut, Menu, Search, Settings2, Sparkles, X } from 'lucide-react';
import { Modal } from './UI';
import { useSession } from '../lib/session';

const links = [
  { path: '/dashboard', name: '대시보드', icon: LayoutDashboard },
  { path: '/experiences', name: '내 경험', icon: BookOpen },
  { path: '/applications', name: '지원 관리', icon: BriefcaseBusiness }
];
const extras = [
  { path: '/settings', name: '환경 설정', icon: Settings2 }
];
export function Brand() {
  return <div className="brand"><div className="brand-mark"><span/><span/><span/><span/></div><span className="brand-word">stori<span>.</span></span></div>;
}
export default function Layout() {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [command, setCommand] = useState(false);
  const [search, setSearch] = useState('');
  const isDeepPage = /^\/(experiences|applications)\/[^/]+/.test(location.pathname);
  useEffect(() => { setMenu(false); }, [location.pathname]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setCommand(v => !v);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  const go = (path: string) => { navigate(path); setCommand(false); setSearch(''); };
  const logout = async () => { await session.leave(); navigate('/login', { replace: true }); };
  const current = [...links, ...extras].find(l => location.pathname.startsWith(l.path));
  return <div className="app-shell">
    <aside className={'sidebar ' + (menu ? 'sidebar-open' : '')}>
      <div className="sidebar-brand"><Brand/><button className="sidebar-close" aria-label="메뉴 닫기" onClick={() => setMenu(false)}><X size={20}/></button></div>
      <div className="workspace-selector"><div className="workspace-avatar"><Compass size={18}/></div><div className="workspace-text"><strong>My Workspace</strong><span>나의 커리어 공간</span></div><span className="workspace-chevron">⌄</span></div>
      <div className="nav-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="주 메뉴">
        {links.map(link => <NavLink key={link.path} to={link.path} className={({ isActive }) => 'nav-link ' + (isActive ? 'nav-active' : '')}><link.icon size={19} strokeWidth={1.9}/><span>{link.name}</span></NavLink>)}
      </nav>
      <div className="nav-label nav-label-space">ACCOUNT</div>
      <nav className="sidebar-nav" aria-label="계정 메뉴">
        {extras.map(link => <NavLink key={link.path} to={link.path} className={({ isActive }) => 'nav-link ' + (isActive ? 'nav-active' : '')}><link.icon size={19} strokeWidth={1.9}/><span>{link.name}</span></NavLink>)}
      </nav>
      <div className="sidebar-spacer"/>
      <div className="side-helper"><span className="helper-emoji"><Sparkles size={19}/></span><strong>당신의 이야기가<br/>가능성이 되도록.</strong><p>경험을 기록하고, 다음 기회를 준비하세요.</p><button onClick={() => go('/experiences')}>경험 정리하기 <ArrowUpRight size={14}/></button></div>
      <div className="sidebar-account"><div className="account-avatar">{session.demo ? 'D' : 'M'}</div><div><strong>{session.demo ? 'Demo Workspace' : 'My Account'}</strong><span>{session.demo ? '샘플 데이터 탐색 중' : '로그인된 계정'}</span></div><button aria-label="로그아웃" onClick={logout}><LogOut size={17}/></button></div>
    </aside>
    {menu && <div className="sidebar-scrim" onClick={() => setMenu(false)}/>}
    <div className="main-area">
      <header className="topbar">
        <div className="top-left"><button className="mobile-menu-btn" aria-label="메뉴 열기" onClick={() => setMenu(true)}><Menu size={21}/></button><div className="top-location"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{current?.name || (isDeepPage ? '상세 보기' : '홈')}</strong></div></div>
        <div className="top-actions"><button className="search-trigger" onClick={() => setCommand(true)}><Search size={17}/><span>무엇을 찾고 계신가요?</span><kbd>⌘ K</kbd></button>{session.demo && <span className="demo-top-pill">미리보기 모드</span>}<button className="top-avatar" onClick={() => go('/settings')} title="환경 설정">{session.demo ? 'D' : 'M'}</button></div>
      </header>
      <main className="page-content"><Outlet/></main>
      <footer className="app-footer"><span>© 2026 stori. Make your next story.</span><span><CircleHelp size={14}/> Hongik Graduate Project</span></footer>
    </div>
    <nav className="bottom-nav" aria-label="모바일 메뉴">{links.map(link => <NavLink key={link.path} to={link.path} className={({ isActive }) => isActive ? 'bottom-link bottom-active' : 'bottom-link'}><link.icon size={20}/><span>{link.name}</span></NavLink>)}<NavLink to="/settings" className={({ isActive }) => isActive ? 'bottom-link bottom-active' : 'bottom-link'}><Settings2 size={20}/><span>설정</span></NavLink></nav>
    {session.notice && <div className={'toast toast-' + session.notice.kind} role="status">{session.notice.kind === 'success' ? '✓' : session.notice.kind === 'error' ? '!' : 'i'}<span>{session.notice.message}</span><button onClick={() => session.notify('', 'info')} aria-label="알림 닫기"><X size={15}/></button></div>}
    <Modal open={command} title="빠른 이동" subtitle="화면 이름을 입력해 이동하세요." onClose={() => setCommand(false)}>
      <div className="command-search"><Search size={18}/><input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="대시보드, 경험, 지원 관리..."/></div>
      <div className="command-results">{[...links, ...extras].filter(item => item.name.includes(search) || item.path.includes(search.toLowerCase())).map(item => <button key={item.path} onClick={() => go(item.path)}><item.icon size={18}/><span>{item.name}</span><ArrowUpRight size={16}/></button>)}</div>
      <div className="command-hint"><Command size={14}/> Ctrl / ⌘ + K로 언제든 열기</div>
    </Modal>
  </div>;
}
