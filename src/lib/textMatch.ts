export function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:'"()[\]]/g, '')
    .replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Quizlet's written mode forgives tiny typos but not wrong words. We require
 * an exact match on short answers and allow a distance-1 typo once the
 * answer is long enough that a single-character slip isn't ambiguous.
 */
export function isAnswerCorrect(input: string, answer: string): boolean {
  const a = normalize(input);
  const b = normalize(answer);
  if (!a) return false;
  if (a === b) return true;
  if (b.length >= 5 && levenshtein(a, b) <= 1) return true;
  return false;
}

/**
 * Used for the "retype the correct answer" gate after a miss — no typo
 * tolerance here, since the point is to make sure it's typed exactly right.
 */
export function isExactMatch(input: string, answer: string): boolean {
  const a = normalize(input);
  if (!a) return false;
  return a === normalize(answer);
}
