import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function moduleAt(path, require = () => { throw new Error('Unexpected import'); }) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  runInNewContext(code, { exports, require });
  return exports;
}
const options = moduleAt('../lib/options.ts');
const onboarding = moduleAt('../lib/onboarding.ts', id => {
  if (id === '@/lib/options') return options;
  throw new Error(`Unexpected import ${id}`);
});
const plain = value => JSON.parse(JSON.stringify(value));
const topics = ['savings_first_steps', 'mutual_funds', 'etf_funds', 'stocks', 'bonds', 'crypto', 'forex', 'derivatives'];
const context = { D1: 'other', D2: 'gt_75k', D3: 'undisclosed', D4: 'undisclosed', D5: 'undisclosed' };

test('reassessment retains sharing and studied tools even when knowledge and capital are zero', () => {
  const raw = { onboarding_policy: 'onboarding-sharing-2026-09-26', D5: 'not_yet', section_d: context,
    topic_competences_v2: { instruments: topics.map(topic => ({ topic, knowledge_level: 'K0', invested_amount_band: 'A0',
      wants_to_mentor: topic === 'forex', ...(topic === 'forex' || topic === 'etf_funds' ? { experience_duration: 'lt_6m' } : {}),
    })) },
  };
  const restored = onboarding.restoreAnswers(raw).answers;
  assert.deepEqual(plain(restored.selected), ['etf_funds', 'forex']);
  assert.equal(restored.selectionConfirmed, true);
  const output = onboarding.submittedAnswers(restored);
  assert.equal(output.topic_competences_v2.instruments.find(row => row.topic === 'forex').wants_to_mentor, true);
  assert.equal(output.section_d.D2, 'gt_75k');
  assert.equal(onboarding.surveyComplete(restored), true);
});

test('complete no-tool answers remain explicitly confirmed when reopened', () => {
  const raw = { onboarding_policy: 'onboarding-sharing-2026-09-26', D5: 'not_yet', section_d: context,
    topic_competences_v2: { instruments: topics.map(topic => ({ topic, knowledge_level: 'K0', invested_amount_band: 'A0', wants_to_mentor: false })) },
  };
  const restored = onboarding.restoreAnswers(raw).answers;
  assert.equal(restored.none, true);
  assert.equal(restored.selectionConfirmed, true);
  assert.equal(onboarding.surveyComplete(restored), true);
});

test('a missing newly required duration cannot silently complete an old draft', () => {
  const raw = { onboarding_policy: 'onboarding-essential-context-2026-09', essential_flow: {
    screen: 'review', answers: { selected: ['forex'], none: false, selectionConfirmed: true, context,
      autonomy: 'guided', topics: { forex: { knowledge_level: 'K3', invested_amount_band: 'A3', wants_to_mentor: true, safety_scenario_answer: 'old-exam' } },
    },
  } };
  const restored = onboarding.restoreAnswers(raw);
  assert.equal(restored.screen, 'topic:forex');
  assert.equal(onboarding.surveyComplete(restored.answers), false);
  const output = onboarding.submittedAnswers(restored.answers);
  assert.equal('safety_scenario_answer' in output.topic_competences_v2.instruments.find(row => row.topic === 'forex'), false);
});
