import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <Compass className="mb-4 h-12 w-12 text-navy-400" />
      <h1 className="text-4xl font-extrabold">Page not found</h1>
      <p className="mt-2 text-slate-500">The page you're looking for doesn't exist or was moved.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </div>
  );
}
