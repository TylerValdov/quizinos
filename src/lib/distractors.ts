const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'to', 'in', 'on', 'at', 'for', 'and', 'or', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'this', 'that', 'these', 'those', 'it', 'its', 'as', 'by', 'with', 'from',
  'has', 'have', 'had', 'not', 'but', 'if', 'than', 'then', 'so', 'such', 'which', 'who', 'whom',
  'what', 'when', 'where', 'why', 'how', 'into', 'onto', 'about', 'also', 'can', 'will', 'used',
]);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function ngrams(text: string, n = 3): Set<string> {
  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');
  const grams = new Set<string>();
  if (clean.length < n) {
    if (clean) grams.add(clean);
    return grams;
  }
  for (let i = 0; i <= clean.length - n; i++) grams.add(clean.slice(i, i + n));
  return grams;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

interface SimilarityInput {
  term: string;
  definition: string;
}

/**
 * How good a "plausible wrong answer" `candidate` is for `target`: shared
 * vocabulary between definitions (same-topic words like "cell", "organelle"
 * for related biology terms) plus shared letter chunks between terms
 * (catches family resemblance like prokaryote/eukaryote even when the
 * definitions don't overlap much). Both components are in [0, 1].
 */
export function similarity(target: SimilarityInput, candidate: SimilarityInput): number {
  const wordScore = jaccard(new Set(words(target.definition)), new Set(words(candidate.definition)));
  const ngramScore = jaccard(ngrams(target.term), ngrams(candidate.term));
  return wordScore * 0.5 + ngramScore * 0.5;
}

/** Small enough that it only reorders near-ties, not genuine differences in score. */
const JITTER = 0.05;

/**
 * Picks `count` distractor strings for `answerField` from `pool`, biased
 * toward the ones most similar to `target` instead of a plain random pick.
 * A clear best match (like "eukaryote" for "prokaryote") wins every time;
 * jitter only reshuffles which options fill the remaining slots when several
 * candidates score about the same (or, for an unrelated set, all score
 * zero), so the same set of options doesn't appear on every attempt.
 */
export function pickDistractors<T extends SimilarityInput>(
  target: T,
  pool: T[],
  answerField: 'term' | 'definition',
  count: number,
): string[] {
  return pool
    .map((candidate) => ({
      text: candidate[answerField],
      sortKey: similarity(target, candidate) + Math.random() * JITTER,
    }))
    .sort((a, b) => b.sortKey - a.sortKey)
    .slice(0, count)
    .map((s) => s.text);
}
