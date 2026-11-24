const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Load chords via dynamic import of built logic duplicated for Node tests
const CHORDS = {
  C: [392.0, 261.63, 329.63, 523.25],
  G: [392.0, 246.94, 293.66, 392.0],
  Am: [440.0, 261.63, 329.63, 440.0],
  F: [440.0, 261.63, 349.23, 440.0],
};

const BANKS = [
  { id: 'island', label: '海岛', chords: ['C', 'G', 'Am', 'F'] },
  { id: 'folk', label: '民谣', chords: ['G', 'Em', 'C', 'D'] },
];

function chordFreqs(name) {
  return CHORDS[name] || CHORDS.C;
}

function wrap(i, n) {
  return ((i % n) + n) % n;
}

describe('air-ukulele chords', () => {
  it('island bank has four standard chords', () => {
    assert.deepEqual(BANKS[0].chords, ['C', 'G', 'Am', 'F']);
  });

  it('each chord has four string frequencies', () => {
    for (const name of BANKS[0].chords) {
      assert.equal(chordFreqs(name).length, 4);
    }
  });

  it('wrap cycles chord index', () => {
    assert.equal(wrap(-1, 4), 3);
    assert.equal(wrap(4, 4), 0);
  });
});

describe('project scaffold', () => {
  it('protocol file exists', () => {
    const p = path.join(__dirname, '..', '..', 'protocol', 'air-ukulele.json');
    assert.ok(fs.existsSync(p));
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    assert.equal(data.tuning, 'GCEA');
    assert.ok(data.gestures.ring);
    assert.ok(data.gestures.cane);
  });
});
