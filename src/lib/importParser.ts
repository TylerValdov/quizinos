export interface ParsedCard {
  term: string;
  definition: string;
}

export const TERM_SEPARATORS = [
  { label: 'Tab', value: '\t' },
  { label: 'Comma', value: ',' },
  { label: 'Dash ( - )', value: ' - ' },
  { label: 'Custom', value: 'custom' },
] as const;

export const CARD_SEPARATORS = [
  { label: 'New line', value: '\n' },
  { label: 'Semicolon', value: ';' },
  { label: 'Custom', value: 'custom' },
] as const;

/**
 * Mirrors Quizlet's own import dialog: raw text is split into "cards" on
 * cardSeparator, then each card is split into term/definition on the first
 * occurrence of termSeparator. A chunk with no term separator can't be a new
 * card on its own — Quizlet exports a multi-answer definition (e.g. a
 * numbered list) as several bare lines after the first, with no separator on
 * the continuation lines — so it's folded into the previous card's
 * definition instead of being dropped. A chunk before any card has been
 * found yet (stray leading text) is still skipped.
 */
export function parseImportText(
  text: string,
  termSeparator: string,
  cardSeparator: string,
): ParsedCard[] {
  if (!text.trim() || !termSeparator) return [];

  const rawCards = cardSeparator === '\n' ? text.split(/\r?\n/) : text.split(cardSeparator);

  const cards: ParsedCard[] = [];
  for (const raw of rawCards) {
    const line = raw.trim();
    if (!line) continue;
    const idx = line.indexOf(termSeparator);
    if (idx === -1) {
      const prev = cards[cards.length - 1];
      if (prev) prev.definition += `\n${line}`;
      continue;
    }
    const term = line.slice(0, idx).trim();
    const definition = line.slice(idx + termSeparator.length).trim();
    if (term && definition) cards.push({ term, definition });
  }
  return cards;
}
