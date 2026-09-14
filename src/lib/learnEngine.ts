import type { Card, CardProgress, LearnProgress, StudyDirection } from '../types';
import { pickDistractors } from './distractors';

/** Consecutive correct answers (across question types) needed to master a card. */
export const MASTERY_STREAK = 2;

export function initLearnProgress(
  setId: string,
  cards: Card[],
  direction: StudyDirection,
): LearnProgress {
  const progress: Record<string, CardProgress> = {};
  for (const c of cards) {
    progress[c.id] = { status: 'new', correctStreak: 0, timesSeen: 0, timesCorrect: 0 };
  }
  return {
    setId,
    direction,
    cards: progress,
    round: 1,
    roundsToMastery: MASTERY_STREAK,
    updatedAt: Date.now(),
  };
}

/** Progress may be stale after cards were added/removed since the last session. */
export function reconcileProgress(progress: LearnProgress, cards: Card[]): LearnProgress {
  const next: Record<string, CardProgress> = {};
  for (const c of cards) {
    next[c.id] = progress.cards[c.id] ?? {
      status: 'new',
      correctStreak: 0,
      timesSeen: 0,
      timesCorrect: 0,
    };
  }
  return { ...progress, cards: next };
}

export function activeCardIds(cards: Card[], progress: LearnProgress): string[] {
  return cards.filter((c) => progress.cards[c.id]?.status !== 'mastered').map((c) => c.id);
}

export function masteredCount(cards: Card[], progress: LearnProgress): number {
  return cards.filter((c) => progress.cards[c.id]?.status === 'mastered').length;
}

export function isSessionComplete(cards: Card[], progress: LearnProgress): boolean {
  return activeCardIds(cards, progress).length === 0;
}

export function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildRoundQueue(cards: Card[], progress: LearnProgress): string[] {
  return shuffle(activeCardIds(cards, progress));
}

export type QuestionType = 'multiple-choice' | 'written';

export interface LearnQuestion {
  cardId: string;
  type: QuestionType;
  prompt: string;
  answer: string;
  choices?: string[];
}

/**
 * A card is quizzed multiple-choice until its first correct answer, then
 * written for the rest of the way — mirrors Quizlet Learn's "recognize,
 * then recall" progression toward mastery.
 */
export function buildQuestion(
  card: Card,
  allCards: Card[],
  progress: LearnProgress,
): LearnQuestion {
  const cp = progress.cards[card.id];
  const enoughCardsForChoices = allCards.length >= 4;
  const type: QuestionType =
    cp.correctStreak === 0 && enoughCardsForChoices ? 'multiple-choice' : 'written';

  const [promptField, answerField]: ['term' | 'definition', 'term' | 'definition'] =
    progress.direction === 'term-to-def' ? ['term', 'definition'] : ['definition', 'term'];

  const prompt = card[promptField];
  const answer = card[answerField];

  if (type === 'written') {
    return { cardId: card.id, type, prompt, answer };
  }

  const candidatePool = allCards.filter((c) => c.id !== card.id);
  const distractors = pickDistractors(card, candidatePool, answerField, 3);
  const choices = shuffle([answer, ...distractors]);
  return { cardId: card.id, type, prompt, answer, choices };
}

export function recordAnswer(progress: LearnProgress, cardId: string, correct: boolean): LearnProgress {
  const cp = progress.cards[cardId];
  const nextStreak = correct ? cp.correctStreak + 1 : 0;
  const updatedCp: CardProgress = {
    status: correct && nextStreak >= progress.roundsToMastery ? 'mastered' : 'learning',
    correctStreak: nextStreak,
    timesSeen: cp.timesSeen + 1,
    timesCorrect: cp.timesCorrect + (correct ? 1 : 0),
  };
  return {
    ...progress,
    cards: { ...progress.cards, [cardId]: updatedCp },
    updatedAt: Date.now(),
  };
}
