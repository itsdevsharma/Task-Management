import TaskHoverPreview from '../components/common/TaskHoverPreview.jsx';
import AppLayout from '../components/common/AppLayout.jsx';
import { useEffect, useState } from 'react';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleDashed, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import api from '../services/api.js';

const cardStyles = {
  total: { label: 'Total Tasks', color: 'bg-slate-100 text-slate-700', icon: BriefcaseBusiness },
  pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700', icon: CircleDashed },
  inProgress: { label: 'In Progress', color: 'bg-sky-100 text-sky-700', icon: TrendingUp },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 });
  const [recentTasks, setRecentTasks] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, tasksRes] = await Promise.all([
          api.get('/tasks/stats'),
          api.get('/tasks?limit=5&sortBy=createdAt&order=desc'),
        ]);
        setStats(statsRes.data.data);
        setRecentTasks(tasksRes.data.data || []);
      } catch (error) {
        setError(error.response?.data?.message || 'Unable to load dashboard. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const greeting = new Date().getHours() < 12 ? 'Good morning' : 'Good afternoon';

  return (
    <AppLayout>
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{greeting}, {user?.name?.split(' ')[0] || 'there'}</h1>
            <p className="mt-1 text-slate-500">Here's an overview of your tasks.</p>
          </div>
          <Link to="/tasks?create=1" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs">
            <Plus size={16} /> New task
          </Link>
        </div>

        {error ? <div role="alert">{error}</div> : null}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {Object.entries(cardStyles).map(([key, config]) => {
            const Icon = config.icon;
            const value = stats[key] ?? 0;

            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{config.label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">{loading ? '…' : error ? '—' : value}</p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.color}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Recent tasks</h2>
            <Link to="/tasks" className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
              View all <ArrowRight size={16} />
            </Link>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Loading tasks...</div>
          ) : error ? null : recentTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No tasks yet. Create your first task to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <TaskHoverPreview task={task} key={task._id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 hover:bg-slate-50 focus-visible:outline-indigo-500 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{task.title}</div>
                    <div className="mt-1 text-xs text-slate-500">{new Date(task.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">{task.status}</span>
                    <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">{task.priority}</span>
                    <span className="text-xs text-slate-500">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</span>
                  </div>
                </TaskHoverPreview>
              ))}
            </div>
          )}
        </div>
    </AppLayout>
  );
};

export default DashboardPage;
