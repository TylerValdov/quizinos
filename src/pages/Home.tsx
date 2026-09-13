import { Link } from 'react-router-dom';
import { useSets } from '../context/SetsContext';

export default function Home() {
  const { sets } = useSets();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your sets</h1>
        <div className="flex gap-2">
          <Link
            to="/sets/new?import=1"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
          >
            Import from Quizlet
          </Link>
          <Link
            to="/sets/new"
            className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            + Create set
          </Link>
        </div>
      </div>

      {sets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          <p className="mb-4">No sets yet. Create one from scratch, or import a set you exported from Quizlet.</p>
          <div className="flex justify-center gap-2">
            <Link
              to="/sets/new"
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Create a set
            </Link>
            <Link
              to="/sets/new?import=1"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Import from Quizlet
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sets.map((set) => (
            <Link
              key={set.id}
              to={`/sets/${set.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md hover:border-brand transition"
            >
              <h2 className="font-semibold text-lg truncate">{set.title}</h2>
              {set.description && (
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{set.description}</p>
              )}
              <p className="text-xs text-slate-400 mt-3">{set.cards.length} terms</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
