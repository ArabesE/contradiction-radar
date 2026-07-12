import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { classifyPair } from '../src/domain/classifier.js';
import { LocalNliEngine } from '../src/nli/model.js';
import type { Evidence, RadarLabel } from '../src/types.js';

interface Fixture { id: string; category: string; previous: string; current: string; expected: RadarLabel }

const fixturePath = resolve(process.cwd(), 'tests/fixtures/evaluation.json');
const fixtures = JSON.parse(await readFile(fixturePath, 'utf8')) as Fixture[];
const engine = new LocalNliEngine();
const rows: Array<{ id: string; expected: RadarLabel; predicted: RadarLabel; correct: boolean; source: string }> = [];
for (const [index, fixture] of fixtures.entries()) {
  const current: Evidence = { channelId: 'EVAL', messageTs: `${index + 1}.2`, permalink: `https://example.invalid/current/${fixture.id}`, text: fixture.current };
  const previous: Evidence = { channelId: 'EVAL', messageTs: `${index + 1}.1`, permalink: `https://example.invalid/previous/${fixture.id}`, text: fixture.previous };
  const scores = await engine.score(previous.text, current.text);
  const finding = classifyPair(current, previous, scores);
  rows.push({ id: fixture.id, expected: fixture.expected, predicted: finding.label, correct: fixture.expected === finding.label, source: scores.source });
}
const exact = rows.filter((row) => row.correct).length;
const predictedConflict = rows.filter((row) => row.predicted === 'Direct contradiction' || row.predicted === 'Requirement conflict');
const trueConflict = predictedConflict.filter((row) => row.expected === 'Direct contradiction' || row.expected === 'Requirement conflict');
console.log(JSON.stringify({
  evaluatedAt: new Date().toISOString(),
  modelId: process.env.NLI_MODEL_ID ?? 'Xenova/nli-deberta-v3-xsmall',
  pairs: rows.length,
  exactCorrect: exact,
  exactAccuracy: exact / rows.length,
  conflictPrecision: predictedConflict.length ? trueConflict.length / predictedConflict.length : null,
  fallbackCount: rows.filter((row) => row.source === 'deterministic-fallback').length,
  errors: rows.filter((row) => !row.correct),
}, null, 2));
