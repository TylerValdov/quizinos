export interface Card {
  id: string;
  term: string;
  definition: string;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  cards: Card[];
  createdAt: number;
  updatedAt: number;
}

export type CardStatus = 'new' | 'learning' | 'mastered';

export interface CardProgress {
  status: CardStatus;
  correctStreak: number;
  timesSeen: number;
  timesCorrect: number;
}

export type StudyDirection = 'term-to-def' | 'def-to-term';

export type QuestionMode = 'mixed' | 'multiple-choice' | 'written';

export interface LearnProgress {
  setId: string;
  direction: StudyDirection;
  questionMode: QuestionMode;
  cards: Record<string, CardProgress>;
  round: number;
  roundsToMastery: number;
  updatedAt: number;
}
