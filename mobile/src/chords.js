/**
 * Ukulele GCEA chord voicings (Hz).
 * Order: G string, C string, E string, A string.
 */
export const CHORDS = {
  C: [392.0, 261.63, 329.63, 523.25],
  G: [392.0, 246.94, 293.66, 392.0],
  Am: [440.0, 261.63, 329.63, 440.0],
  F: [440.0, 261.63, 349.23, 440.0],
  D: [440.0, 293.66, 369.99, 440.0],
  Em: [392.0, 246.94, 329.63, 392.0],
  Dm: [440.0, 293.66, 349.23, 440.0],
  A: [440.0, 277.18, 329.63, 440.0],
  E7: [415.3, 246.94, 329.63, 392.0],
  Cmaj7: [392.0, 261.63, 329.63, 246.94],
  Dm7: [440.0, 293.66, 349.23, 523.25],
  G7: [392.0, 246.94, 293.66, 349.23],
  Am7: [392.0, 261.63, 329.63, 440.0],
};

export const BANKS = [
  { id: 'island', label: '海岛', chords: ['C', 'G', 'Am', 'F'] },
  { id: 'folk', label: '民谣', chords: ['G', 'Em', 'C', 'D'] },
  { id: 'blues', label: '蓝调', chords: ['A', 'D', 'E7', 'Am'] },
  { id: 'jazz', label: '爵士', chords: ['Cmaj7', 'Dm7', 'G7', 'Am7'] },
];

export function chordFreqs(name) {
  return CHORDS[name] || CHORDS.C;
}

export function bankByIndex(i) {
  const n = BANKS.length;
  return BANKS[((i % n) + n) % n];
}
