import { useEffect, useRef, useState } from 'react';
import { UserRound, Save, Mail, MapPin, BriefcaseBusiness } from 'lucide-react';
import AppLayout from '../components/common/AppLayout.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

const empty = { name: '', email: '', phone: '', location: '', jobTitle: '', bio: '' };
export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    api.get('/auth/me').then(({ data }) => { if (active) setForm(Object.fromEntries(Object.keys(empty).map(key => [key, data.data[key] || '']))); }).catch(error => { if (active) setError(error.response?.data?.message || 'Unable to load profile. Please reload to try again.'); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const save = async event => {
    event.preventDefault();
    if (pending.current) return;
    pending.current = true; setSaving(true); setError(''); setSuccess('');
    try {
      const { data } = await api.put('/auth/me', form);
      setUser(data.data); setForm(Object.fromEntries(Object.keys(empty).map(key => [key, data.data[key] || ''])));
      setSuccess('Your profile has been updated.');
    } catch (error) { setError(error.response?.data?.message || 'Unable to save profile. Please try again.'); }
    finally { pending.current = false; setSaving(false); }
  };
  const field = (key, label, type = 'text', max = 120) => <div><label htmlFor={`profile-${key}`} className="mb-2 block text-sm font-medium text-slate-700">{label}</label><input id={`profile-${key}`} name={key} type={type} required={key === 'name' || key === 'email'} minLength={key === 'name' ? 2 : undefined} maxLength={max} disabled={saving} value={form[key]} onChange={event => { setSuccess(''); setForm({ ...form, [key]: event.target.value }); }} className="min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" /></div>;
  return <AppLayout><div className="mb-7"><p className="mb-2 text-xs font-semibold uppercase tracking-widest text-indigo-600">Your account</p><h1 className="text-3xl font-bold tracking-tight">My profile</h1><p className="mt-2 text-sm text-slate-500">A little about you. Keep your personal and contact details up to date.</p></div>
    <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-6"><div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-100 text-2xl font-bold text-indigo-700">{(user?.name || 'U').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()}</div><h2 className="break-words text-xl font-semibold">{user?.name}</h2><div className="mt-4 space-y-3 break-words text-sm text-slate-500"><p className="flex items-start gap-2"><Mail size={17} className="shrink-0" />{user?.email}</p>{user?.jobTitle && <p className="flex gap-2"><BriefcaseBusiness size={17} className="shrink-0" />{user.jobTitle}</p>}{user?.location && <p className="flex gap-2"><MapPin size={17} className="shrink-0" />{user.location}</p>}</div></aside>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="flex items-center gap-2 text-lg font-semibold"><UserRound size={20} className="text-indigo-600" />Personal information</h2><p className="mt-1 text-sm text-slate-500">Name and email are required. Everything else is optional.</p>
        {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{success && <p role="status" className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}
        {loading ? <p className="py-10 text-slate-500">Loading profile...</p> : <form onSubmit={save} className="mt-6 space-y-5"><div className="grid gap-5 sm:grid-cols-2">{field('name', 'Full name', 'text', 100)}{field('email', 'Email address', 'email', 254)}{field('phone', 'Phone number', 'tel', 30)}{field('location', 'Location')}{field('jobTitle', 'Job title')}</div><div><label htmlFor="profile-bio" className="mb-2 block text-sm font-medium text-slate-700">About you</label><textarea id="profile-bio" name="bio" maxLength={600} rows={4} value={form.bio} disabled={saving} onChange={e => { setSuccess(''); setForm({ ...form, bio: e.target.value }); }} placeholder="Tell us a little about yourself…" className="w-full rounded-xl border border-slate-200 p-4 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100" /><p className="mt-1 text-right text-xs text-slate-400">{form.bio.length}/600</p></div><div className="border-t border-slate-100 pt-5"><button disabled={saving} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50 sm:w-auto"><Save size={18} />{saving ? 'Saving profile...' : 'Save changes'}</button></div></form>}
      </section>
    </div></AppLayout>;
}
