import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateFixture } from '../src/fixtures.js';

test('generateFixture is deterministic for the same seed and options', () => {
  const a = generateFixture({ seed: 'golden-1', haystackLength: 8, needleDepth: 0.5 });
  const b = generateFixture({ seed: 'golden-1', haystackLength: 8, needleDepth: 0.5 });
  assert.deepEqual(a, b);
});

test('generateFixture golden output: seed "golden-1", length 8, depth 0.5', () => {
  const fixture = generateFixture({ seed: 'golden-1', haystackLength: 8, needleDepth: 0.5 });
  assert.deepEqual(fixture, {
    seed: 'golden-1',
    prompt:
      'Researchers catalogued over two hundred species in the survey. ' +
      'A light rain fell over the harbor for most of the afternoon. ' +
      'Traffic on the bridge slowed during the evening commute. ' +
      'The warehouse added a second loading dock last quarter. ' +
      'The secret passphrase is quartz-5026. ' +
      'The theater replaced its seating ahead of the fall season. ' +
      'The museum extended its hours for the summer exhibition. ' +
      'Several maple trees along the avenue were trimmed last week. ' +
      'A pair of swans returned to the pond this spring.',
    question: 'What is the secret passphrase mentioned in the text?',
    answer: 'quartz-5026',
    needleIndex: 4,
    sentenceCount: 9,
  });
});

test('generateFixture golden output: needle at the very start (depth 0)', () => {
  const fixture = generateFixture({ seed: 'golden-2', haystackLength: 4, needleDepth: 0 });
  assert.equal(fixture.needleIndex, 0);
  assert.equal(fixture.answer, 'birch-5791');
  assert.ok(fixture.prompt.startsWith('The secret passphrase is birch-5791.'));
});

test('generateFixture golden output: needle at the very end (depth 1)', () => {
  const fixture = generateFixture({ seed: 'golden-3', haystackLength: 4, needleDepth: 1 });
  assert.equal(fixture.needleIndex, 4);
  assert.equal(fixture.answer, 'amber-5711');
  assert.ok(fixture.prompt.endsWith('The secret passphrase is amber-5711.'));
});

test('generateFixture scales sentence count with haystackLength', () => {
  const small = generateFixture({ seed: 'scale', haystackLength: 2 });
  const large = generateFixture({ seed: 'scale', haystackLength: 50 });
  assert.equal(small.sentenceCount, 3);
  assert.equal(large.sentenceCount, 51);
  assert.ok(large.prompt.length > small.prompt.length);
});

test('generateFixture defaults to seed "default" and length 10', () => {
  const fixture = generateFixture();
  assert.equal(fixture.seed, 'default');
  assert.equal(fixture.sentenceCount, 11);
});

test('generateFixture rejects an out-of-range needleDepth', () => {
  assert.throws(() => generateFixture({ needleDepth: 1.5 }), RangeError);
  assert.throws(() => generateFixture({ needleDepth: -0.1 }), RangeError);
});

test('generateFixture rejects a negative haystackLength', () => {
  assert.throws(() => generateFixture({ haystackLength: -1 }), RangeError);
});
