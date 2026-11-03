import { createRng } from './rng.js';
import { buildHaystack } from './haystack.js';
import { createNeedle } from './needle.js';

/**
 * @typedef {Object} Fixture
 * @property {string} seed - seed used to generate this fixture
 * @property {string} prompt - full prompt text (haystack + needle sentence)
 * @property {string} question - question to ask about the needle
 * @property {string} answer - expected exact-match answer
 * @property {number} needleIndex - sentence index where the needle was inserted
 * @property {number} sentenceCount - total number of sentences in the prompt
 */

/**
 * Generate a deterministic needle-in-a-haystack fixture.
 *
 * The same seed and options always produce the exact same prompt, question,
 * and answer, which is what makes golden-output tests possible without
 * calling any model.
 *
 * @param {Object} [options]
 * @param {string} [options.seed='default'] - seed for the deterministic rng
 * @param {number} [options.haystackLength=10] - number of filler sentences
 * @param {number} [options.needleDepth=0.5] - fraction (0-1) of the way
 *   through the haystack where the needle sentence is inserted
 * @returns {Fixture}
 */
export function generateFixture(options = {}) {
  const { seed = 'default', haystackLength = 10, needleDepth = 0.5 } = options;

  if (!Number.isInteger(haystackLength) || haystackLength < 0) {
    throw new RangeError('haystackLength must be a non-negative integer');
  }
  if (needleDepth < 0 || needleDepth > 1) {
    throw new RangeError('needleDepth must be between 0 and 1');
  }

  const rng = createRng(seed);
  const needle = createNeedle(rng);
  const haystack = buildHaystack(rng, haystackLength);

  const needleIndex = Math.min(
    haystackLength,
    Math.round(haystackLength * needleDepth)
  );

  const sentences = [
    ...haystack.slice(0, needleIndex),
    needle.sentence,
    ...haystack.slice(needleIndex),
  ];

  return {
    seed: String(seed),
    prompt: sentences.join(' '),
    question: needle.question,
    answer: needle.answer,
    needleIndex,
    sentenceCount: sentences.length,
  };
}
