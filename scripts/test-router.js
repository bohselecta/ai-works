'use strict';

const assert = require('assert');
const { detectEscalation, retrieve, validateModelChoice } = require('../lib/router');

function top(query) { return retrieve(query, 5)[0]?.id; }

assert.equal(top('where is my tax refund'), 'irs.refund-status');
assert.equal(top('renew my passport'), 'state.passport-renew');
assert.equal(top('replace my social security card'), 'ssa.card-replace');
assert.equal(top('file for unemployment'), 'dol.unemployment');
assert.equal(top('food stamps'), 'usda.snap-state-referral');
assert.equal(top('passport fast'), 'state.passport-expedite');
assert.equal(top('sponsor my wife for a green card'), 'uscis.i130');
assert.equal(top('my veteran husband died'), 'life.veteran-spouse-died');
assert.equal(detectEscalation('I want to kill myself')?.id, 'crisis.988');
assert.equal(detectEscalation('my child is missing')?.id, 'emergency.911');

const candidates = retrieve('renew passport', 3);
assert.equal(validateModelChoice({ choice: 1, confidence: 0.9 }, candidates).record.id, 'state.passport-renew');
assert.equal(validateModelChoice({ choice: 1, confidence: 0.4 }, candidates).record, null);
assert.equal(validateModelChoice({ choice: 99, confidence: 1 }, candidates).record, null);

console.log('router unit tests passed');
