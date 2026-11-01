import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { api, clearTokens, getToken, saveTokens } from './api';
import type { TokenResponse } from './types';

type Notice = { message: string; kind: 'success' | 'error' | 'info' };
type SessionValue = {
  loggedIn: boolean; demo: boolean; notice: Notice | null;
  login: (email: string, password: string) => Promise<void>;
  enterDemo: () => void; leave: () => Promise<void>;
  notify: (message: string, kind?: Notice['kind']) => void;
  guardDemo: () => boolean;
};
const SessionContext = createContext<SessionValue | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(Boolean(getToken()));
  const [demo, setDemo] = useState(sessionStorage.getItem('stori.demo') === 'true');
  const [notice, setNotice] = useState<Notice | null>(null);
  const notify = (message: string, kind: Notice['kind'] = 'info') => setNotice({ message, kind });

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4100);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const expired = () => { setLoggedIn(false); setDemo(false); notify('세션이 만료되었어요. 다시 로그인해 주세요.', 'error'); };
    window.addEventListener('stori:session-expired', expired);
    return () => window.removeEventListener('stori:session-expired', expired);
  }, []);
  const login = async (email: string, password: string) => {
    const tokens = await api<TokenResponse>('/api/auth/login', { method: 'POST', body: { email, password } });
    saveTokens(tokens);
    sessionStorage.removeItem('stori.demo');
    setDemo(false); setLoggedIn(true);
  };
  const enterDemo = () => {
    clearTokens(); sessionStorage.setItem('stori.demo', 'true');
    setDemo(true); setLoggedIn(false);
  };
  const leave = async () => {
    clearTokens(); sessionStorage.removeItem('stori.demo');
    setLoggedIn(false); setDemo(false);
  };
  const guardDemo = () => {
    if (!demo) return false;
    notify('샘플 화면입니다. 실제 저장은 로그인 후 사용할 수 있어요.', 'info');
    return true;
  };
  return <SessionContext.Provider value={{ loggedIn, demo, notice, login, enterDemo, leave, notify, guardDemo }}>
    {children}
  </SessionContext.Provider>;
}
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('SessionProvider is missing');
  return ctx;
}
