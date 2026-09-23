import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSets } from '../context/SetsContext';
import type { Card } from '../types';
import { shuffle } from '../lib/learnEngine';

export default function Flashcards() {
  const { id } = useParams();
  const { getSet } = useSets();
  const set = id ? getSet(id) : undefined;

  const [order, setOrder] = useState<Card[]>(set?.cards ?? []);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);

  const card = order[index];
  const progressLabel = useMemo(() => `${Math.min(index + 1, order.length)} / ${order.length}`, [index, order.length]);

  if (!set) {
    return (
      <div className="text-center text-slate-500 py-16">
        <p className="mb-3">That set doesn't exist.</p>
        <Link to="/" className="text-brand underline">
          Back to your sets
        </Link>
      </div>
    );
  }

  if (set.cards.length === 0) {
    return <p className="text-slate-500">This set has no cards yet.</p>;
  }

  function goTo(newIndex: number) {
    setFlipped(false);
    setIndex((newIndex + order.length) % order.length);
  }

  function toggleShuffle() {
    if (shuffled) {
      setOrder(set!.cards);
    } else {
      setOrder(shuffle(set!.cards));
    }
    setShuffled(!shuffled);
    setIndex(0);
    setFlipped(false);
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <Link to={`/sets/${set.id}`} className="text-sm text-slate-500 hover:text-brand">
          ← {set.title}
        </Link>
        <span className="text-sm text-slate-400">{progressLabel}</span>
      </div>

      <div
        className="relative h-72 cursor-pointer [perspective:1200px]"
        onClick={() => setFlipped((f) => !f)}
      >
        <div className={`flip-card-inner relative h-full w-full ${flipped ? 'flipped' : ''}`}>
          <div className="flip-card-face absolute inset-0 flex items-center justify-center overflow-y-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-center text-xl font-medium whitespace-pre-line">{card?.term}</p>
          </div>
          <div className="flip-card-face back absolute inset-0 flex items-center justify-center overflow-y-auto rounded-2xl border border-brand bg-brand/5 p-8 shadow-sm">
            <p className="text-center text-xl whitespace-pre-line">{card?.definition}</p>
          </div>
        </div>
      </div>
      <p className="text-center text-xs text-slate-400 mt-2">Click the card to flip it</p>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          onClick={() => goTo(index - 1)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          ← Prev
        </button>
        <button
          onClick={toggleShuffle}
          className={`rounded-md border px-4 py-2 text-sm ${
            shuffled ? 'border-brand text-brand bg-brand/5' : 'border-slate-300 bg-white hover:bg-slate-50'
          }`}
        >
          Shuffle
        </button>
        <button
          onClick={() => goTo(index + 1)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
