import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSets } from '../context/SetsContext';

export default function SetDetail() {
  const { id } = useParams();
  const { getSet } = useSets();
  const navigate = useNavigate();
  const set = id ? getSet(id) : undefined;

  if (!set) {
    return (
      <div className="text-center text-slate-500 py-16">
        <p className="mb-3">That set doesn't exist.</p>
        <button onClick={() => navigate('/')} className="text-brand underline">
          Back to your sets
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold">{set.title}</h1>
          {set.description && <p className="text-slate-500 mt-1">{set.description}</p>}
          <p className="text-sm text-slate-400 mt-1">{set.cards.length} terms</p>
        </div>
        <Link
          to={`/sets/${set.id}/edit`}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
        >
          Edit
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 my-6">
        <Link
          to={`/sets/${set.id}/learn`}
          className="rounded-xl bg-brand text-white p-5 hover:bg-brand-dark transition"
        >
          <h2 className="text-lg font-semibold">Learn</h2>
          <p className="text-sm text-white/80 mt-1">
            Adaptive quiz that mixes multiple choice and written questions until you've mastered
            every term.
          </p>
        </Link>
        <Link
          to={`/sets/${set.id}/flashcards`}
          className="rounded-xl border border-slate-200 bg-white p-5 hover:border-brand transition"
        >
          <h2 className="text-lg font-semibold">Flashcards</h2>
          <p className="text-sm text-slate-500 mt-1">Flip through cards at your own pace.</p>
        </Link>
      </div>

      <h3 className="font-semibold mb-2">Terms in this set</h3>
      <div className="rounded-xl border border-slate-200 bg-white divide-y">
        {set.cards.map((card) => (
          <div key={card.id} className="flex px-4 py-3 gap-4">
            <span className="flex-1">{card.term}</span>
            <span className="flex-1 text-slate-500">{card.definition}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
