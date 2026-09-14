import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSets } from '../context/SetsContext';
import { useAuth } from '../context/AuthContext';
import { loadProgress, saveProgress, clearProgress } from '../lib/firestoreProgress';
import {
  buildQuestion,
  buildRoundQueue,
  initLearnProgress,
  isSessionComplete,
  masteredCount,
  reconcileProgress,
  recordAnswer,
  type LearnQuestion,
} from '../lib/learnEngine';
import { isAnswerCorrect } from '../lib/textMatch';
import type { LearnProgress, StudyDirection } from '../types';
import type { Card } from '../types';

interface QueueState {
  queue: string[];
  question: LearnQuestion | null;
}

function pickNext(cards: Card[], q: string[], prog: LearnProgress): QueueState {
  let currentQueue = q;
  if (currentQueue.length === 0) {
    if (isSessionComplete(cards, prog)) return { queue: [], question: null };
    currentQueue = buildRoundQueue(cards, prog);
  }
  const [nextId, ...rest] = currentQueue;
  const card = cards.find((c) => c.id === nextId);
  if (!card) return pickNext(cards, rest, prog);
  return { queue: rest, question: buildQuestion(card, cards, prog) };
}

export default function Learn() {
  const { id } = useParams();
  const { getSet } = useSets();
  const { user } = useAuth();
  const uid = user?.uid;
  const set = id ? getSet(id) : undefined;

  const [progress, setProgress] = useState<LearnProgress | null>(null);
  const [state, setState] = useState<QueueState>({ queue: [], question: null });
  const [progressLoading, setProgressLoading] = useState(true);

  const [writtenInput, setWrittenInput] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [sessionAnswers, setSessionAnswers] = useState(0);
  const [canOverride, setCanOverride] = useState(false);

  // Holds everything needed to advance once "Next question" is clicked, and
  // to recompute the answer if it gets overridden to correct in the meantime.
  const pendingQueueRef = useRef<string[] | null>(null);
  const progressBeforeAnswerRef = useRef<LearnProgress | null>(null);
  const baseQueueRef = useRef<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!uid || !set) return;
    setProgressLoading(true);
    loadProgress(uid, set.id).then((stored) => {
      if (cancelled) return;
      const prog = stored
        ? reconcileProgress(stored, set.cards)
        : initLearnProgress(set.id, set.cards, 'term-to-def');
      setProgress(prog);
      setState(pickNext(set.cards, buildRoundQueue(set.cards, prog), prog));
      setProgressLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, set?.id]);

  const total = set?.cards.length ?? 0;
  const mastered = useMemo(
    () => (set && progress ? masteredCount(set.cards, progress) : 0),
    [set, progress],
  );

  const resetQuestionUi = useCallback(() => {
    setWrittenInput('');
    setSelectedChoice(null);
    setFeedback(null);
    setRevealedAnswer(null);
    setCanOverride(false);
    setLocked(false);
    pendingQueueRef.current = null;
    progressBeforeAnswerRef.current = null;
    baseQueueRef.current = null;
  }, []);

  const restart = useCallback(
    (direction: StudyDirection) => {
      if (!set || !uid) return;
      void clearProgress(uid, set.id);
      const fresh = initLearnProgress(set.id, set.cards, direction);
      setProgress(fresh);
      setState(pickNext(set.cards, buildRoundQueue(set.cards, fresh), fresh));
      resetQuestionUi();
      setSessionAnswers(0);
    },
    [set, uid, resetQuestionUi],
  );

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

  if (set.cards.length < 2) {
    return (
      <div className="text-center text-slate-500 py-16">
        <p>Learn mode needs at least 2 cards. Add more terms to this set first.</p>
        <Link to={`/sets/${set.id}/edit`} className="text-brand underline">
          Edit set
        </Link>
      </div>
    );
  }

  if (progressLoading || !progress) {
    return <div className="text-center text-slate-400 py-16 text-sm">Loading…</div>;
  }

  function commitAnswer(correct: boolean, answerShown: string, allowOverride: boolean) {
    if (!state.question || locked || !progress || !set || !uid) return;
    setLocked(true);
    setFeedback(correct ? 'correct' : 'incorrect');
    setRevealedAnswer(answerShown);
    setCanOverride(!correct && allowOverride);
    setSessionAnswers((n) => n + 1);

    const cardId = state.question.cardId;
    progressBeforeAnswerRef.current = progress;
    baseQueueRef.current = state.queue;

    const newProgress = recordAnswer(progress, cardId, correct);
    setProgress(newProgress);
    saveProgress(uid, newProgress);

    let newQueue = state.queue;
    if (!correct) {
      const insertAt = Math.min(3, newQueue.length);
      newQueue = [...newQueue.slice(0, insertAt), cardId, ...newQueue.slice(insertAt)];
    }
    pendingQueueRef.current = newQueue;
  }

  function handleChoiceClick(choice: string) {
    if (!state.question) return;
    setSelectedChoice(choice);
    commitAnswer(choice === state.question.answer, state.question.answer, false);
  }

  function handleWrittenSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!state.question || !writtenInput.trim()) return;
    commitAnswer(isAnswerCorrect(writtenInput, state.question.answer), state.question.answer, true);
  }

  function handleDontKnow() {
    if (!state.question) return;
    commitAnswer(false, state.question.answer, false);
  }

  function handleMarkCorrect() {
    if (!state.question || !uid || !progressBeforeAnswerRef.current || !baseQueueRef.current) return;
    const cardId = state.question.cardId;
    const corrected = recordAnswer(progressBeforeAnswerRef.current, cardId, true);
    setProgress(corrected);
    saveProgress(uid, corrected);
    setFeedback('correct');
    setCanOverride(false);
    pendingQueueRef.current = baseQueueRef.current;
  }

  function handleNext() {
    if (!pendingQueueRef.current || !progress || !set) return;
    setState(pickNext(set.cards, pendingQueueRef.current, progress));
    resetQuestionUi();
  }

  const finished = !state.question;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center justify-between mb-3">
        <Link to={`/sets/${set.id}`} className="text-sm text-slate-500 hover:text-brand">
          ← {set.title}
        </Link>
        {!finished && (
          <select
            className="text-xs rounded-md border border-slate-300 px-2 py-1"
            value={progress.direction}
            onChange={(e) => restart(e.target.value as StudyDirection)}
          >
            <option value="term-to-def">Answer with definition</option>
            <option value="def-to-term">Answer with term</option>
          </select>
        )}
      </div>

      <div className="w-full h-2 rounded-full bg-slate-200 mb-6 overflow-hidden">
        <div
          className="h-full bg-brand transition-all"
          style={{ width: `${total ? (mastered / total) * 100 : 0}%` }}
        />
      </div>

      {finished ? (
        <div className="text-center rounded-xl border border-slate-200 bg-white p-10">
          <h2 className="text-2xl font-bold mb-2">Set complete! 🎉</h2>
          <p className="text-slate-500 mb-6">
            You mastered all {total} terms in {progress.round} round
            {progress.round === 1 ? '' : 's'} ({sessionAnswers} answers this session).
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => restart(progress.direction)}
              className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Study again
            </button>
            <Link
              to={`/sets/${set.id}`}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              Back to set
            </Link>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-xs text-slate-400 mb-1">
            Round {progress.round} · {mastered}/{total} mastered
          </p>
          <div className="rounded-xl border border-slate-200 bg-white p-6 mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              {state.question!.type === 'multiple-choice' ? 'Choose the match' : 'Type the answer'}
            </p>
            <p className="text-xl font-medium">{state.question!.prompt}</p>
          </div>

          {state.question!.type === 'multiple-choice' ? (
            <div className="grid gap-2">
              {state.question!.choices!.map((choice, i) => {
                const isAnswer = choice === state.question!.answer;
                const isSelected = choice === selectedChoice;
                let style = 'border-slate-300 bg-white hover:border-brand';
                if (feedback && isAnswer) style = 'border-green-500 bg-green-50';
                else if (feedback === 'incorrect' && isSelected) style = 'border-red-400 bg-red-50';
                return (
                  <button
                    key={i}
                    disabled={locked}
                    onClick={() => handleChoiceClick(choice)}
                    className={`text-left rounded-md border px-4 py-3 text-sm transition ${style} ${
                      locked ? 'cursor-default' : ''
                    }`}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          ) : (
            <form onSubmit={handleWrittenSubmit} className="space-y-2">
              <input
                autoFocus
                disabled={locked}
                value={writtenInput}
                onChange={(e) => setWrittenInput(e.target.value)}
                placeholder="Type your answer"
                className={`w-full rounded-md border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand ${
                  feedback === 'correct'
                    ? 'border-green-500 bg-green-50'
                    : feedback === 'incorrect'
                      ? 'border-red-400 bg-red-50'
                      : 'border-slate-300'
                }`}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={locked}
                  className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  Answer
                </button>
                <button
                  type="button"
                  onClick={handleDontKnow}
                  disabled={locked}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Don't know
                </button>
              </div>
            </form>
          )}

          {feedback && (
            <div
              className={`mt-3 rounded-md px-4 py-2 text-sm flex items-center justify-between gap-3 flex-wrap ${
                feedback === 'correct' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}
            >
              <span>
                {feedback === 'correct' ? 'Correct!' : `Not quite — the answer was "${revealedAnswer}"`}
              </span>
              {canOverride && (
                <button
                  onClick={handleMarkCorrect}
                  className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 whitespace-nowrap"
                >
                  This answer is correct
                </button>
              )}
            </div>
          )}

          {feedback && (
            <button
              onClick={handleNext}
              autoFocus
              className="mt-4 w-full rounded-md bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
            >
              Next question →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
