import { useEffect } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, Inbox, LoaderCircle, X } from 'lucide-react';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: ReactNode; full?: boolean;
};
export function Button({ variant = 'primary', icon, full, className = '', children, ...rest }: ButtonProps) {
  return <button className={['btn', 'btn-' + variant, full ? 'btn-full' : '', className].join(' ')} {...rest}>
    {icon}{children}
  </button>;
}
export function IconButton({ children, label, onClick, className = '' }: {
  children: ReactNode; label: string; onClick?: () => void; className?: string;
}) {
  return <button type="button" className={'icon-btn ' + className} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}
export function StatusPill({ value }: { value: string }) {
  const complete = value === 'COMPLETED';
  const inProgress = value === 'IN_PROGRESS';
  return <span className={'status ' + (complete ? 'status-green' : inProgress ? 'status-blue' : 'status-neutral')}>
    <span className="status-dot"/>
    {complete ? '완료' : inProgress ? '진행 중' : '작성 중'}
  </span>;
}
export function Modal({ open, title, subtitle, onClose, children, footer }: {
  open: boolean; title: string; subtitle?: string; onClose: () => void;
  children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal-panel" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><IconButton label="닫기" onClick={onClose}><X size={20}/></IconButton></div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>;
}
export function EmptyState({ title, description, action, icon }: {
  title: string; description: string; action?: ReactNode; icon?: ReactNode;
}) {
  return <div className="empty-state">
    <div className="empty-icon">{icon ?? <Inbox size={24}/>}</div>
    <h3>{title}</h3><p>{description}</p>{action}
  </div>;
}
export function Loading({ label = '불러오는 중...' }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle size={22} className="spinning"/><span>{label}</span></div>;
}
export function PageHeading({ eyebrow, title, description, action }: {
  eyebrow: string; title: string; description?: string; action?: ReactNode;
}) {
  return <div className="page-heading">
    <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1>{description && <p>{description}</p>}</div>
    {action && <div className="heading-action">{action}</div>}
  </div>;
}
export function SectionHeading({ title, action }: { title: string; action?: ReactNode }) {
  return <div className="section-heading"><h2>{title}</h2>{action}</div>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span>{children}{hint && <span className="field-hint">{hint}</span>}</label>;
}
export function RowLink({ children, to, className = '' }: { children: ReactNode; to: string; className?: string }) {
  return <a className={'inline-link ' + className} href={to}>{children}<ArrowRight size={16}/></a>;
}
