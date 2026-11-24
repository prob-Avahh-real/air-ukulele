import { BANKS, chordFreqs } from './chords.js';
import { AudioEngine } from './audio-engine.js';
import { WearableInput } from './wearable-input.js';

const $ = (id) => document.getElementById(id);

const audio = new AudioEngine();
const state = {
  bankIndex: 0,
  chordIndex: 0,
  muted: false,
  lastChord: 'C',
};

function currentBank() {
  return BANKS[state.bankIndex];
}

function currentChord() {
  const bank = currentBank();
  return bank.chords[state.chordIndex] || bank.chords[0];
}

function wrap(i, n) {
  return ((i % n) + n) % n;
}

function showToast(msg) {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => el.classList.remove('show'), 1400);
}

function haptic() {
  try {
    if (navigator.vibrate) navigator.vibrate(12);
  } catch {
    /* ignore */
  }
}

function render() {
  const bank = currentBank();
  const chord = currentChord();
  state.lastChord = chord;

  $('bank-name').textContent = bank.label;
  $('chord-name').textContent = chord;
  $('chord-hint').textContent = `${state.chordIndex + 1} / ${bank.chords.length}`;

  const grid = $('chord-grid');
  grid.innerHTML = bank.chords
    .map(
      (c, i) => `
      <button type="button" class="chord-btn ${i === state.chordIndex ? 'active' : ''}" data-i="${i}">
        ${c}
      </button>`
    )
    .join('');

  const banks = $('bank-tabs');
  banks.innerHTML = BANKS.map(
    (b, i) => `
    <button type="button" class="bank-tab ${i === state.bankIndex ? 'active' : ''}" data-i="${i}">
      ${b.label}
    </button>`
  ).join('');

  $('mute-btn').classList.toggle('on', state.muted);
  $('mute-btn').textContent = state.muted ? '已静音' : '静音';
  $('uke').classList.toggle('strumming', false);
}

async function playStrum(detail = {}) {
  await audio.ensure();
  const chord = currentChord();
  const freqs = chordFreqs(chord);
  await audio.strum(freqs, detail);
  haptic();

  const uke = $('uke');
  uke.classList.remove('strumming');
  void uke.offsetWidth;
  uke.classList.add('strumming');
  $('ripple').classList.remove('go');
  void $('ripple').offsetWidth;
  $('ripple').classList.add('go');
  showToast(`♪ ${chord}`);
}

async function playPluck(stringIndex, detail = {}) {
  await audio.ensure();
  const freqs = chordFreqs(currentChord());
  const i = ((stringIndex % 4) + 4) % 4;
  await audio.pluckOne(freqs[i], detail);
  haptic();
  showToast(`弦 ${i + 1}`);
}

function setMuted(muted) {
  state.muted = muted;
  audio.setMuted(muted);
  if (muted) audio.stopAll();
  render();
  showToast(muted ? '已静音' : '取消静音');
}

function selectChord(i) {
  state.chordIndex = wrap(i, currentBank().chords.length);
  render();
  haptic();
}

function selectBank(i) {
  state.bankIndex = wrap(i, BANKS.length);
  state.chordIndex = 0;
  render();
  showToast(`音组 · ${currentBank().label}`);
}

function handleGesture(gesture, detail) {
  switch (gesture) {
    case 'prev_chord':
      selectChord(state.chordIndex - 1);
      break;
    case 'next_chord':
      selectChord(state.chordIndex + 1);
      break;
    case 'prev_bank':
      selectBank(state.bankIndex - 1);
      break;
    case 'next_bank':
      selectBank(state.bankIndex + 1);
      break;
    case 'strum':
      playStrum(detail || { direction: 'down', velocity: 0.85 });
      break;
    case 'mute':
      audio.stopAll();
      showToast('止音');
      break;
    case 'toggle_mute':
      setMuted(!state.muted);
      break;
    default:
      break;
  }
}

const wearable = new WearableInput({
  onGesture: handleGesture,
  onBadge: (kind, text, active) => {
    const el = $(`${kind}-badge`);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('active', active);
  },
});

function bindUi() {
  $('chord-grid').addEventListener('click', (e) => {
    const btn = e.target.closest('.chord-btn');
    if (!btn) return;
    selectChord(Number(btn.dataset.i));
  });

  $('bank-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.bank-tab');
    if (!btn) return;
    selectBank(Number(btn.dataset.i));
  });

  $('strum-btn').addEventListener('click', () => {
    playStrum({ direction: 'down', velocity: 0.9 });
  });

  $('strum-up-btn').addEventListener('click', () => {
    playStrum({ direction: 'up', velocity: 0.7 });
  });

  $('mute-btn').addEventListener('click', () => setMuted(!state.muted));

  // Swipe / pluck on uke body: horizontal = strum, tap zone = single string, vertical drag = bend
  const stage = $('stage');
  let startX = null;
  let startY = null;
  let didBend = false;
  stage.addEventListener(
    'pointerdown',
    (e) => {
      startX = e.clientX;
      startY = e.clientY;
      didBend = false;
      const rect = stage.getBoundingClientRect();
      const t = (e.clientY - rect.top) / rect.height;
      state._pluckIdx = Math.min(3, Math.max(0, Math.floor(t * 4)));
    },
    { passive: true }
  );
  stage.addEventListener(
    'pointermove',
    (e) => {
      if (startY == null) return;
      const dy = e.clientY - startY;
      const dx = e.clientX - startX;
      if (Math.abs(dy) > 18 && Math.abs(dy) > Math.abs(dx)) {
        didBend = true;
        audio.bend(dy / 60);
      }
    },
    { passive: true }
  );
  stage.addEventListener(
    'pointerup',
    (e) => {
      if (startX == null) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = null;
      startY = null;
      if (didBend) return;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) {
        playStrum({ direction: dx > 0 ? 'down' : 'up', velocity: Math.min(1.1, Math.abs(dx) / 120) });
      } else if (Math.abs(dx) < 24 && Math.abs(dy) < 24) {
        playPluck(state._pluckIdx ?? 0, { velocity: 0.85 });
      }
    },
    { passive: true }
  );

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') {
      e.preventDefault();
      playStrum({ direction: 'down', velocity: 0.85 });
    } else if (e.key >= '1' && e.key <= '4') {
      playPluck(Number(e.key) - 1, { velocity: 0.9 });
    } else if (e.key === 'ArrowLeft') selectChord(state.chordIndex - 1);
    else if (e.key === 'ArrowRight') selectChord(state.chordIndex + 1);
    else if (e.key === 'ArrowUp') selectBank(state.bankIndex - 1);
    else if (e.key === 'ArrowDown') selectBank(state.bankIndex + 1);
    else if (e.key === 'm' || e.key === 'M') setMuted(!state.muted);
  });
}

render();
bindUi();
wearable.setupRing();
wearable.setupCane();

// Unlock audio on first interaction
document.body.addEventListener(
  'pointerdown',
  () => {
    audio.ensure();
  },
  { once: true }
);
