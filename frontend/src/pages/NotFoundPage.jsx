import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-xs">
      <div className="text-4xl font-bold text-slate-900">404</div>
      <h1 className="mt-3 text-2xl font-semibold text-slate-800">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you requested does not exist.</p>
      <Link to="/dashboard" className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white">
        Back to dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
