import TaskHoverPreview from '../components/common/TaskHoverPreview.jsx';
import TaskDetails from '../components/common/TaskDetails.jsx';
import Modal from '../components/common/Modal.jsx';
import AppLayout from '../components/common/AppLayout.jsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const statusOptions = ['all', 'pending', 'in-progress', 'completed'];
const priorityOptions = ['all', 'low', 'medium', 'high'];

const TasksPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestVersion = useRef(0);
  const savingRef = useRef(false);
  const deletingRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order] = useState('desc');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, totalTasks: 0, page: 1, limit: 10 });
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState('');
  const detailsVersion = useRef(0);
  const viewDetails = async (id) => {
    const version = ++detailsVersion.current;
    setDetails({}); setDetailsLoading(true); setDetailsError('');
    try {
      const response = await api.get(`/tasks/${id}`);
      if (version === detailsVersion.current) setDetails(response.data.data);
    } catch (error) {
      if (version === detailsVersion.current) setDetailsError(error.response?.data?.message || 'Unable to load task details.');
    } finally {
      if (version === detailsVersion.current) setDetailsLoading(false);
    }
  };
  const [showForm, setShowForm] = useState(searchParams.get('create') === '1');
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    dueDate: '',
  });

  const fetchTasks = async (nextPage = page, query = { search, status, priority, sortBy, order }) => {
    const version = ++requestVersion.current;
    try {
      setLoading(true);
      setError('');

      const params = {
        page: nextPage,
        limit: 10,
        search: query.search,
        status: query.status !== 'all' ? query.status : '',
        priority: query.priority !== 'all' ? query.priority : '',
        sortBy: query.sortBy === 'dueDate' ? 'dueDate' : 'createdAt',
        order: query.order,
      };

      const response = await api.get('/tasks', { params });
      if (version !== requestVersion.current) return;
      if (nextPage > response.data.pagination.totalPages) { setPage(response.data.pagination.totalPages); return; }
      setTasks(response.data.data || []);
      setPagination(response.data.pagination || { totalPages: 1, totalTasks: 0, page: 1, limit: 10 });
    } catch (loadError) {
      if (version !== requestVersion.current) return;
      setError(loadError.response?.data?.message || 'Unable to load tasks. Please try again.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(page, { search, status, priority, sortBy, order });
    return () => { requestVersion.current++; };
  }, [page, search, status, priority, sortBy, order]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    setError('');
    const payload = { ...form, dueDate: form.dueDate || null };

    try {
      if (editingTask) {
        await api.put(`/tasks/${editingTask._id}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      setShowForm(false);
      setEditingTask(null);
      setForm({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' });
      fetchTasks(page, { search, status, priority, sortBy, order });
    } catch (submitError) {
      setError(submitError.response?.data?.message || 'Unable to save task.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (deletingRef.current) return;
    const confirmed = window.confirm('Delete this task? This action cannot be undone.');
    if (!confirmed) return;
    deletingRef.current = taskId;
    setDeletingId(taskId);
    setError('');

    try {
      await api.delete(`/tasks/${taskId}`);
      fetchTasks(page, { search, status, priority, sortBy, order });
    } catch (deleteError) {
      setError(deleteError.response?.data?.message || 'Unable to delete task.');
    } finally {
      deletingRef.current = null;
      setDeletingId(null);
    }
  };

  const visibleStatus = useMemo(() => {
    switch (status) {
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      default: return 'All statuses';
    }
  }, [status]);

  return (
    <AppLayout>
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tasks</h1>
              <p className="text-sm text-slate-500">Welcome back, {user?.name || 'User'}.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">
              <Plus size={16} /> Create task
            </button>
          </div>

          <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                placeholder="Search tasks"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-slate-800"
              />
            </div>
            <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800">
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All statuses' : option === 'in-progress' ? 'In Progress' : option.charAt(0).toUpperCase() + option.slice(1)}</option>
              ))}
            </select>
            <select value={priority} onChange={(e) => { setPage(1); setPriority(e.target.value); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800">
              {priorityOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All priorities' : option.charAt(0).toUpperCase() + option.slice(1)}</option>
              ))}
            </select>
            <select value={sortBy === 'dueDate' ? 'dueDate' : 'createdAt'} onChange={(e) => { setPage(1); setSortBy(e.target.value); }} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-800">
              <option value="createdAt">Newest first</option>
              <option value="dueDate">Due date</option>
            </select>
          </div>

          {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading tasks...</div>
          ) : error ? null : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-slate-500">
              <div className="mb-2 text-lg font-medium text-slate-700">No tasks found</div>
              <div>{search || status !== 'all' || priority !== 'all' ? `No results for ${visibleStatus.toLowerCase()} tasks.` : 'You have no tasks yet.'}</div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="task-table min-w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Task</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Due date</th>
                      <th className="px-4 py-3">Created</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <TaskHoverPreview as="tr" task={task} key={task._id} className="border-t border-slate-200 hover:bg-slate-50 focus-visible:outline-indigo-500">
                        <td data-label="Task" className="px-4 py-4">
                          <div className="font-semibold text-slate-900">{task.title}</div>
                          <div className="mt-1 max-w-xs truncate text-xs text-slate-500">{task.description || 'No description provided.'}</div>
                        </td>
                        <td data-label="Status" className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : task.status === 'in-progress' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                            {task.status}
                          </span>
                        </td>
                        <td data-label="Priority" className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td data-label="Due date" className="px-4 py-4">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}</td>
                        <td data-label="Created" className="px-4 py-4">{new Date(task.createdAt).toLocaleDateString()}</td>
                        <td data-label="Actions" className="px-4 py-4">
                          <div className="flex gap-2">
                            <button aria-label="View task details" onClick={() => viewDetails(task._id)} className="rounded-lg border border-slate-200 p-2"><Eye size={15} /></button>
                            <button aria-label="Edit task" onClick={() => { setEditingTask(task); setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '' }); setShowForm(true); }} className="rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100">
                              <Pencil size={15} />
                            </button>
                            <button disabled={deletingId !== null} aria-label={deletingId === task._id ? "Deleting task" : "Delete task"} onClick={() => handleDelete(task._id)} className="rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100">
                              {deletingId === task._id ? 'Deleting...' : <Trash2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </TaskHoverPreview>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-xs text-slate-500">{pagination.totalTasks} tasks</div>
                <div className="flex gap-2">
                  <button disabled={page <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50">Previous</button>
                  <span className="px-3 py-1.5 text-sm text-slate-600">{pagination.page || page} / {pagination.totalPages || 1}</span>
                  <button disabled={page >= (pagination.totalPages || 1)} onClick={() => setPage((prev) => prev + 1)} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-50">Next</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {details ? <TaskDetails task={details} loading={detailsLoading} error={detailsError} onClose={() => { detailsVersion.current++; setDetails(null); }} onEdit={task => { detailsVersion.current++; setDetails(null); setEditingTask(task); setForm({ title: task.title, description: task.description || '', status: task.status, priority: task.priority, dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '' }); setShowForm(true); }} /> : null}
        {showForm ? (
          <Modal label={editingTask ? "Edit task" : "Create task"} busy={saving} onClose={() => { setShowForm(false); setEditingTask(null); setForm({ title: "", description: "", status: "pending", priority: "medium", dueDate: "" }); }} className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">{editingTask ? 'Edit task' : 'Create task'}</h2>
                <button disabled={saving} onClick={() => { setShowForm(false); setEditingTask(null); setForm({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' }); }} className="text-slate-500">✕</button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error ? <div role="alert" className="text-red-600">{error}</div> : null}
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Title</label>
                  <input disabled={saving} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" required />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                  <textarea disabled={saving} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                    <select disabled={saving} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Priority</label>
                    <select disabled={saving} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Due date</label>
                  <input type="date" disabled={saving} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5" />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" disabled={saving} onClick={() => { setShowForm(false); setEditingTask(null); setForm({ title: '', description: '', status: 'pending', priority: 'medium', dueDate: '' }); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">Cancel</button>
                  <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">{saving ? 'Saving...' : editingTask ? 'Save changes' : 'Create task'}</button>
                </div>
              </form>
          </Modal>
        ) : null}
    </AppLayout>
  );
};

export default TasksPage;
