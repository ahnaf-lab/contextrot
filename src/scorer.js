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
 * @typedef {(predicted: string, expected: string) => boolean} Scorer
 *
 * A Scorer judges one prediction against the expected answer and returns
 * whether it counts as correct. This is the pluggable interface: the test
 * suite and sweeps default to `exactMatch` (deterministic, no API key
 * needed), but any real model-backed caller can supply its own Scorer -
 * for example one that tolerates a verbose sentence wrapped around the
 * answer - without changing `scoreBatch` or `runSweep` at all.
 */

/**
 * Score a single prediction against the expected answer.
 * @type {Scorer}
 * @param {string} predicted
 * @param {string} expected
 * @returns {boolean} true if they match after normalization
 */
export function exactMatch(predicted, expected) {
  return normalize(predicted) === normalize(expected);
}

/**
 * A looser Scorer for verbose callers (e.g. a real LLM that answers in a
 * full sentence instead of a bare value): correct if the normalized
 * expected answer appears anywhere inside the normalized prediction.
 * @type {Scorer}
 * @param {string} predicted
 * @param {string} expected
 * @returns {boolean}
 */
export function containsMatch(predicted, expected) {
  const normalizedExpected = normalize(expected);
  if (normalizedExpected.length === 0) {
    return normalize(predicted).length === 0;
  }
  return normalize(predicted).includes(normalizedExpected);
}

/**
 * Score a batch of {predicted, expected} pairs and return the fraction
 * that the given Scorer judges correct, along with the per-item results.
 * @param {Array<{ predicted: string, expected: string }>} pairs
 * @param {Scorer} [scorer=exactMatch] - pluggable correctness judge; defaults
 *   to the deterministic exact-match scorer used by test mode
 * @returns {{ accuracy: number, results: boolean[] }}
 */
export function scoreBatch(pairs, scorer = exactMatch) {
  if (typeof scorer !== 'function') {
    throw new TypeError('scorer must be a function(predicted, expected) => boolean');
  }
  const results = pairs.map((pair) => scorer(pair.predicted, pair.expected));
  const correct = results.filter(Boolean).length;
  const accuracy = pairs.length === 0 ? 0 : correct / pairs.length;
  return { accuracy, results };
}
