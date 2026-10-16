import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ListTodo, UserRound, LogOut, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.jsx';

const links = [['/dashboard', 'Dashboard', LayoutDashboard], ['/tasks', 'Tasks', ListTodo], ['/profile', 'Profile', UserRound]];
export default function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const initials = (user?.name || 'User').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
  const navigation = (mobile = false) => links.map(([to, label, Icon]) => <NavLink key={to} to={to} className={({ isActive }) => `${mobile ? 'flex-1 flex-col gap-1 px-2 py-2 text-xs' : 'gap-3 px-4 py-3 text-sm'} flex items-center justify-center rounded-xl font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Icon size={20} />{label}</NavLink>);
  return <div className="min-h-screen bg-slate-50 md:flex">
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-5 md:flex">
      <div className="mb-10 flex items-center gap-3 px-3 py-3 text-xl font-bold tracking-tight"><span className="rounded-xl bg-indigo-600 p-2 text-white"><CheckCheck size={22} /></span>TaskFlow</div>
      <nav className="space-y-2">{navigation()}</nav>
      <div className="mt-auto border-t border-slate-100 pt-5">
        <NavLink to="/profile" className="flex min-w-0 items-center gap-3 rounded-xl p-2 hover:bg-slate-50"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{initials}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold">{user?.name || 'Your profile'}</span><span className="block truncate text-xs text-slate-500">{user?.email}</span></span></NavLink>
        <button onClick={logout} className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm text-slate-600"><LogOut size={16} />Logout</button>
      </div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden"><span className="flex items-center gap-2 font-bold"><CheckCheck className="text-indigo-600" size={22} />TaskFlow</span><button aria-label="Logout" onClick={logout} className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm text-slate-500"><LogOut size={18} />Logout</button></header>
      <main className="mx-auto w-full max-w-7xl p-4 pb-28 sm:p-6 sm:pb-28 md:p-8">{children}</main>
    </div>
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-30 flex border-t border-slate-200 bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">{navigation(true)}</nav>
  </div>;
}
