import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Compass, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useSession } from '../lib/session';
import { Brand } from '../components/Layout';
import { Button, Field } from '../components/UI';

export default function Auth() {
  const session = useSession();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [stage, setStage] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handle = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'login') {
        await session.login(email, password);
        navigate('/dashboard', { replace: true });
      } else if (stage === 0) {
        await api('/api/auth/email/send', { method: 'POST', body: { email } });
        setStage(1);
      } else if (stage === 1) {
        await api('/api/auth/email/verify', { method: 'POST', body: { email, code } });
        setStage(2);
      } else {
        await api('/api/auth/signup', { method: 'POST', body: { email, password } });
        session.notify('가입이 완료되었어요. 로그인해 주세요.', 'success');
        setMode('login'); setStage(0);
      }
    } catch (e) { setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.'); }
    finally { setBusy(false); }
  };
  const switchMode = () => { setError(''); setStage(0); setMode(v => v === 'login' ? 'signup' : 'login'); };
  const demo = () => { session.enterDemo(); navigate('/dashboard', { replace: true }); };
  return <div className="auth-shell">
    <div className="auth-story">
      <div className="auth-brand"><Brand/></div>
      <div className="auth-story-inner">
        <div className="auth-kicker"><Sparkles size={16}/> YOUR NEXT CHAPTER STARTS HERE</div>
        <h1>당신의 이야기가<br/><span>가능성이 되는 곳.</span></h1>
        <p>지나온 경험을 가장 나다운 언어로 정리하고,<br/>다가올 기회를 자신 있게 준비해 보세요.</p>
        <div className="auth-art">
          <div className="auth-art-ring ring-outer"/><div className="auth-art-ring ring-middle"/>
          <div className="auth-art-orb"><div className="orb-core"/></div>
          <div className="floating-note note-top"><span>✦</span><div><strong>경험 발견</strong><small>나만의 강점 찾기</small></div></div>
          <div className="floating-note note-bottom"><span>↗</span><div><strong>새로운 기회</strong><small>다음 스토리로 연결</small></div></div>
        </div>
      </div>
      <div className="auth-story-footer">A more thoughtful way to prepare for what's next. <span>© 2026 stori.</span></div>
    </div>
    <div className="auth-form-side">
      <div className="auth-form-card">
        <div className="auth-form-symbol"><Compass size={22}/></div>
        <div className="auth-heading"><span className="eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'GET STARTED'}</span><h2>{mode === 'login' ? '다시 만나 반가워요.' : '새로운 시작을 함께해요.'}</h2><p>{mode === 'login' ? '당신의 커리어 워크스페이스에 로그인하세요.' : ['이메일 인증부터 시작할게요.', '이메일로 보낸 인증번호를 입력해 주세요.', '사용할 비밀번호를 설정해 주세요.'][stage]}</p></div>
        <form onSubmit={handle} className="auth-form">
          {(mode === 'login' || stage === 0) && <Field label="이메일 주소"><div className="input-with-icon"><Mail size={18}/><input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)}/></div></Field>}
          {mode === 'signup' && stage === 1 && <Field label="이메일 인증번호"><div className="input-with-icon"><ShieldCheck size={18}/><input required inputMode="numeric" placeholder="인증번호 입력" value={code} onChange={e => setCode(e.target.value)}/></div><button type="button" className="text-button" onClick={() => setStage(0)}>이메일 다시 입력하기</button></Field>}
          {(mode === 'login' || stage === 2) && <Field label="비밀번호"><div className="input-with-icon"><LockKeyhole size={18}/><input minLength={mode === 'signup' ? 8 : undefined} required type={visible ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="비밀번호를 입력해 주세요" value={password} onChange={e => setPassword(e.target.value)}/><button type="button" className="reveal-button" aria-label={visible ? '비밀번호 숨기기' : '비밀번호 보기'} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></Field>}
          {error && <div className="form-error" role="alert">{error}</div>}
          <Button full type="submit" disabled={busy} icon={<ArrowRight size={17}/>} className="auth-submit">{busy ? '처리 중...' : mode === 'login' ? '로그인' : ['인증번호 받기', '인증하기', '회원가입 완료'][stage]}</Button>
        </form>
        <div className="auth-switch">{mode === 'login' ? '아직 계정이 없나요?' : '이미 계정이 있나요?'} <button onClick={switchMode}>{mode === 'login' ? '회원가입' : '로그인'}</button></div>
        <div className="auth-divider"><span>또는</span></div>
        <button className="demo-entry" onClick={demo}><div><span className="demo-entry-icon"><Eye size={19}/></span><span><strong>화면 먼저 둘러보기</strong><small>로그인 없이 샘플 UI 확인하기</small></span></div><ArrowRight size={18}/></button>
        <div className="auth-footnote"><CheckCircle2 size={16}/> 미리보기는 샘플 데이터이며, 실제 저장은 되지 않습니다.</div>
      </div>
      <div className="auth-legal">홍익대학교 졸업 프로젝트 · Designed for thoughtful growth</div>
    </div>
  </div>;
}
