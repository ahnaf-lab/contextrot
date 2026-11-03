import { randomIndex } from './rng.js';

// A fixed pool of unrelated, generic filler sentences. These stand in for
// irrelevant context padding a retrieval/QA prompt. The pool is static so
// that output is fully determined by the seed and the rng's sequence of
// picks, never by platform randomness.
export const FILLER_SENTENCES = [
  'The quarterly report was filed three days ahead of schedule.',
  'A light rain fell over the harbor for most of the afternoon.',
  'The committee postponed its vote until the following session.',
  'Several maple trees along the avenue were trimmed last week.',
  'The museum extended its hours for the summer exhibition.',
  'A new bakery opened on the corner of Fifth and Union.',
  'The train was delayed by eleven minutes due to signal work.',
  'Researchers catalogued over two hundred species in the survey.',
  'The library added a reading room on its third floor.',
  'Traffic on the bridge slowed during the evening commute.',
  'The orchestra rehearsed the second movement twice more.',
  'A mild breeze kept the kites aloft well past sunset.',
  'The warehouse inventory was reconciled at the end of the month.',
  'Local volunteers repainted the community center fence.',
  'The satellite completed its scheduled orbital adjustment.',
  'A farmers market now runs every Saturday in the square.',
  'The printer in the east wing was replaced on Tuesday.',
  'The hiking trail reopened after the washed-out section was repaired.',
  'A new ferry route connects the two islands twice daily.',
  'The conference agenda was shortened to fit one afternoon.',
  'The bakery ran out of sourdough before noon again.',
  'The city council approved funding for two new parks.',
  'A power outage briefly affected three blocks downtown.',
  'The archive digitized another decade of newspaper clippings.',
  'The marathon route was adjusted to avoid the construction zone.',
  'A pair of swans returned to the pond this spring.',
  'The theater replaced its seating ahead of the fall season.',
  'The warehouse added a second loading dock last quarter.',
  'The weather service issued a minor advisory for coastal fog.',
  'The university opened a new wing for its engineering labs.',
];

/**
 * Deterministically build a haystack of filler sentences by drawing
 * `count` picks from FILLER_SENTENCES using the given rng.
 * @param {() => number} rng
 * @param {number} count
 * @returns {string[]}
 */
export function buildHaystack(rng, count) {
  const sentences = [];
  for (let i = 0; i < count; i++) {
    const index = randomIndex(rng, FILLER_SENTENCES.length);
    sentences.push(FILLER_SENTENCES[index]);
  }
  return sentences;
}
