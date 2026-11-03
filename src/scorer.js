/**
 * Normalize a string for exact-match comparison: trim, lowercase, collapse
 * internal whitespace, and strip trailing sentence punctuation. This lets
 * "Amber-1234." and "  amber-1234 " count as the same answer without doing
 * any fuzzy/semantic matching.
 * @param {string} value
 * @returns {string}
 */
export function normalize(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/, '');
}

/**
 * Score a single prediction against the expected answer.
 * @param {string} predicted
 * @param {string} expected
 * @returns {boolean} true if they match after normalization
 */
export function exactMatch(predicted, expected) {
  return normalize(predicted) === normalize(expected);
}

/**
 * Score a batch of {predicted, expected} pairs and return the fraction
 * that match exactly, along with the per-item results.
 * @param {Array<{ predicted: string, expected: string }>} pairs
 * @returns {{ accuracy: number, results: boolean[] }}
 */
export function scoreBatch(pairs) {
  const results = pairs.map((pair) => exactMatch(pair.predicted, pair.expected));
  const correct = results.filter(Boolean).length;
  const accuracy = pairs.length === 0 ? 0 : correct / pairs.length;
  return { accuracy, results };
}
