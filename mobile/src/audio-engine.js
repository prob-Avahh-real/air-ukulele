/**
 * Web Audio ukulele — strum + single-string pluck with pitch bend.
 */
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.active = [];
    /** @type {{osc: OscillatorNode, harm: OscillatorNode, base: number} | null} */
    this.lastVoice = null;
  }

  async ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 0.55, this.ctx.currentTime, 0.02);
    }
  }

  stopAll() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    for (const n of this.active) {
      try {
        n.gain.gain.cancelScheduledValues(now);
        n.gain.gain.setTargetAtTime(0.0001, now, 0.03);
        n.osc.stop(now + 0.12);
        if (n.harm) n.harm.stop(now + 0.12);
      } catch {
        /* already stopped */
      }
    }
    this.active = [];
    this.lastVoice = null;
  }

  /**
   * @param {number[]} freqs
   * @param {{ direction?: 'down'|'up', velocity?: number }} opts
   */
  async strum(freqs, opts = {}) {
    await this.ensure();
    if (this.muted) return;

    const direction = opts.direction === 'up' ? 'up' : 'down';
    const velocity = Math.min(1.2, Math.max(0.35, opts.velocity ?? 0.8));
    const order = direction === 'down' ? [...freqs] : [...freqs].reverse();
    const stagger = 0.028;
    const now = this.ctx.currentTime;

    this.stopAll();

    order.forEach((freq, i) => {
      this._pluck(freq, now + i * stagger, velocity * (1 - i * 0.06));
    });
  }

  /**
   * Single string pluck (真弹).
   * @param {number} freq
   * @param {{ velocity?: number }} opts
   */
  async pluckOne(freq, opts = {}) {
    await this.ensure();
    if (this.muted) return;
    const velocity = Math.min(1.2, Math.max(0.35, opts.velocity ?? 0.8));
    this._pluck(freq, this.ctx.currentTime, velocity);
  }

  /**
   * Bend last plucked/strummed voice in semitones.
   */
  bend(semis) {
    if (!this.ctx || !this.lastVoice) return;
    const f = this.lastVoice.base * Math.pow(2, Math.max(-2, Math.min(2, semis)) / 12);
    const now = this.ctx.currentTime;
    try {
      this.lastVoice.osc.frequency.setTargetAtTime(f, now, 0.04);
      this.lastVoice.harm.frequency.setTargetAtTime(f * 2, now, 0.04);
    } catch {
      /* ignore */
    }
  }

  _pluck(freq, start, velocity) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.value = freq;

    const harm = this.ctx.createOscillator();
    const harmGain = this.ctx.createGain();
    harm.type = 'sine';
    harm.frequency.value = freq * 2;
    harmGain.gain.value = 0.12 * velocity;

    filter.type = 'lowpass';
    filter.frequency.value = 1800 + velocity * 1200;
    filter.Q.value = 0.7;

    const peak = 0.22 * velocity;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(peak * 0.35, start + 0.18);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.6);

    osc.connect(filter);
    filter.connect(gain);
    harm.connect(harmGain);
    harmGain.connect(gain);
    gain.connect(this.master);

    osc.start(start);
    harm.start(start);
    osc.stop(start + 1.7);
    harm.stop(start + 1.7);

    const node = { osc, harm, gain };
    this.active.push(node);
    this.lastVoice = { osc, harm, base: freq };
    setTimeout(() => {
      this.active = this.active.filter((n) => n !== node);
      if (this.lastVoice && this.lastVoice.osc === osc) this.lastVoice = null;
    }, 1800);
  }
}
