import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center py-20 px-4">
      <div className="animate-fade-in">
        <div className="text-8xl mb-6">🔧</div>
        <h1 className="text-5xl font-display font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-2">Page Not Found</p>
        <p className="text-gray-400 mb-8 max-w-sm mx-auto">
          Looks like this tool isn't in our inventory. Let's get you back on track.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-primary">Go Home</Link>
          <Link to="/tools" className="btn-secondary">Browse Tools</Link>
        </div>
      </div>
    </div>
  );
}
