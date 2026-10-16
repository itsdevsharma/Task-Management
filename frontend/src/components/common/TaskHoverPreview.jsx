import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const formatDate = value => value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

export default function TaskHoverPreview({ task, as: Tag = 'div', children, ...props }) {
  const id = useId();
  const anchor = useRef(null);
  const timer = useRef(null);
  const [position, setPosition] = useState(null);
  const close = () => setPosition(null);
  const cancelClose = () => clearTimeout(timer.current);
  const scheduleClose = () => { cancelClose(); timer.current = setTimeout(close, 120); };
  const open = () => {
    cancelClose();
    const rect = anchor.current.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom >= 300;
    setPosition({
      left: Math.max(12, Math.min(rect.left, window.innerWidth - 372)),
      ...(below ? { top: rect.bottom + 8, maxHeight: window.innerHeight - rect.bottom - 20 } : { bottom: window.innerHeight - rect.top + 8, maxHeight: rect.top - 20 }),
    });
  };

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!position) return;
    const escape = event => { if (event.key === 'Escape') close(); };
    const scroll = event => { if (!document.getElementById(id)?.contains(event.target)) close(); };
    window.addEventListener('keydown', escape);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', scroll, true);
    return () => {
      window.removeEventListener('keydown', escape);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [position, id]);

  return <>
    <Tag {...props} ref={anchor} tabIndex={0} aria-describedby={position ? id : undefined}
      onMouseEnter={open} onMouseLeave={scheduleClose} onFocus={open}
      onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) scheduleClose(); }}
      onClick={close}>{children}</Tag>
    {position && createPortal(<aside id={id} role="tooltip" onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
      style={{ ...position, width: 'min(360px, calc(100vw - 24px))' }}
      className="fixed z-40 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-xl">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-600">Task details</p>
      <h3 className="break-words text-lg font-semibold text-slate-900">{task.title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium capitalize text-indigo-700">{task.status?.replace('-', ' ')}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize">{task.priority} priority</span>
      </div>
      <p className="mt-4 whitespace-pre-wrap break-words leading-6">{task.description || 'No description provided.'}</p>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs">
        <dt>Due date</dt><dd>{task.dueDate ? formatDate(task.dueDate) : 'No due date'}</dd>
        <dt>Created</dt><dd>{formatDate(task.createdAt)}</dd>
        <dt>Last updated</dt><dd>{formatDate(task.updatedAt)}</dd>
      </dl>
    </aside>, document.body)}
  </>;
}
