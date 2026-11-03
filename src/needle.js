import { randomIndex, randomInt } from './rng.js';

// Small, fixed word list used to build a deterministic "secret" value.
// Combined with a seeded number, this gives an answer string that is
// unlikely to appear by chance anywhere in the filler haystack.
export const NEEDLE_WORDS = [
  'amber',
  'birch',
  'cobalt',
  'delta',
  'ember',
  'falcon',
  'granite',
  'harbor',
  'ivory',
  'jasper',
  'kestrel',
  'lumen',
  'meridian',
  'nimbus',
  'opal',
  'pebble',
  'quartz',
  'raven',
  'sable',
  'tundra',
];

export const NEEDLE_QUESTION = 'What is the secret passphrase mentioned in the text?';

/**
 * Deterministically create a "needle" fact: a sentence stating a secret
 * passphrase, the question that asks for it, and the expected answer.
 * @param {() => number} rng
 * @returns {{ sentence: string, question: string, answer: string }}
 */
export function createNeedle(rng) {
  const word = NEEDLE_WORDS[randomIndex(rng, NEEDLE_WORDS.length)];
  const number = randomInt(rng, 1000, 9999);
  const answer = `${word}-${number}`;
  const sentence = `The secret passphrase is ${answer}.`;
  return { sentence, question: NEEDLE_QUESTION, answer };
}
