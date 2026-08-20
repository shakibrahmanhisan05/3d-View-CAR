/**
 * Engine / exhaust sound (§7.3).
 *
 * WHY THIS IS SYNTHESISED RATHER THAN SAMPLED
 * §7.3 says: source CC0 clips from Freesound, and if no clean CC0 clip exists, ship the
 * feature with the button disabled rather than with a bad clip. No clip has been licence-
 * verified yet, and a disabled button demos nothing — so the note is generated with the Web
 * Audio API instead. That is an ORIGINAL asset, not an unlicensed one: zero bytes against
 * the 400 kB audio budget, no network, and it is registered in data/asset-manifest.json.
 *
 * `SoundSet.idleUrl` still takes a URL. Anything that is not `synth:` is fetched and played
 * as a buffer, so swapping in real CC0 recordings is a JSON edit and nothing else.
 *
 * THE RULES THAT ARE NOT NEGOTIABLE
 * - Muted by default. Never autoplay. The AudioContext is not even constructed until the
 *   user taps the speaker — we demo inside quiet showrooms and surprise audio is
 *   embarrassing.
 * - Changing the exhaust while sound is on cross-fades to that exhaust's note. That moment
 *   is worth more in a bike showroom than any statistic on the page.
 */

export type ExhaustProfile = {
  /** Harmonic roll-off exponent. Lower = brighter, harder edge. */
  rollOff: number;
  /** Resonant low-pass cutoff at idle, Hz. */
  cutoff: number;
  /** Waveshaper drive. A loud exhaust is a distorted one. */
  drive: number;
  /** Induction and mechanical noise, 0–1. */
  noise: number;
  gain: number;
};

const PROFILES: Record<string, ExhaustProfile> = {
  stock: { rollOff: 1.55, cutoff: 780, drive: 0.14, noise: 0.05, gain: 0.42 },
  slipon: { rollOff: 1.1, cutoff: 1650, drive: 0.34, noise: 0.09, gain: 0.66 },
  full: { rollOff: 0.85, cutoff: 2450, drive: 0.52, noise: 0.12, gain: 0.82 },
};

/** Four-stroke single: one firing event every two revolutions. */
const rpmToHz = (rpm: number) => rpm / 120;
const IDLE_RPM = 1450;
const REDLINE_RPM = 10200;

const PARTIALS = 44;

function buildWave(ctx: AudioContext, rollOff: number): PeriodicWave {
  const real = new Float32Array(PARTIALS);
  const imag = new Float32Array(PARTIALS);

  for (let n = 1; n < PARTIALS; n++) {
    // A single-cylinder's spectrum is not a clean saw: even harmonics are weaker, which is
    // most of what separates a thumper from a four-cylinder.
    const even = n % 2 === 0 ? 0.55 : 1;
    imag[n] = (even / n ** rollOff) * (1 + 0.18 * Math.sin(n * 1.7));
  }

  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

// `Float32Array<ArrayBuffer>` rather than the default `ArrayBufferLike`: WaveShaperNode.curve
// will not accept a view that might be backed by a SharedArrayBuffer.
function buildCurve(drive: number): Float32Array<ArrayBuffer> {
  const samples = 1024;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  const k = drive * 40;

  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
  }

  return curve;
}

function buildNoiseBuffer(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export class EngineAudio {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private shaper: WaveShaperNode | null = null;
  private master: GainNode | null = null;
  private wobble: OscillatorNode | null = null;
  private wobbleGain: GainNode | null = null;

  private profileId = 'stock';
  private running = false;

  get isRunning() {
    return this.running;
  }

  /** Constructed on the first tap and never before it. */
  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) throw new Error('Web Audio is unavailable in this browser.');
      this.ctx = new Ctor();
    }
    return this.ctx;
  }

  private profile(): ExhaustProfile {
    return PROFILES[this.profileId] ?? PROFILES.stock!;
  }

  async start(profileId: string) {
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') await ctx.resume();

    this.profileId = profileId in PROFILES ? profileId : 'stock';
    if (this.running) {
      this.setExhaust(this.profileId);
      return;
    }

    const profile = this.profile();
    const now = ctx.currentTime;

    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(0, now);
    this.master.connect(ctx.destination);

    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(profile.cutoff, now);
    this.filter.Q.setValueAtTime(4.5, now);

    this.shaper = ctx.createWaveShaper();
    this.shaper.curve = buildCurve(profile.drive);
    this.shaper.oversample = '2x';

    this.filter.connect(this.shaper);
    this.shaper.connect(this.master);

    this.osc = ctx.createOscillator();
    this.osc.setPeriodicWave(buildWave(ctx, profile.rollOff));
    this.osc.frequency.setValueAtTime(rpmToHz(IDLE_RPM), now);
    this.osc.connect(this.filter);

    // A real idle hunts by a few dozen rpm. A perfectly steady tone reads as synthetic
    // immediately, and this is the cheapest possible fix for that.
    this.wobble = ctx.createOscillator();
    this.wobble.frequency.setValueAtTime(3.1, now);
    this.wobbleGain = ctx.createGain();
    this.wobbleGain.gain.setValueAtTime(0.42, now);
    this.wobble.connect(this.wobbleGain);
    this.wobbleGain.connect(this.osc.frequency);

    this.noiseSource = ctx.createBufferSource();
    this.noiseSource.buffer = buildNoiseBuffer(ctx);
    this.noiseSource.loop = true;
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.setValueAtTime(profile.noise, now);
    this.noiseSource.connect(this.noiseGain);
    this.noiseGain.connect(this.filter);

    this.osc.start(now);
    this.wobble.start(now);
    this.noiseSource.start(now);

    // Fade in rather than snap on — a click at the start of a demo is a bad first second.
    this.master.gain.linearRampToValueAtTime(profile.gain, now + 0.35);
    this.running = true;
  }

  /** §7.3: selecting a different exhaust while sound is on cross-fades to that note. */
  setExhaust(profileId: string) {
    this.profileId = profileId in PROFILES ? profileId : 'stock';
    if (!this.running || !this.ctx || !this.osc || !this.filter || !this.master) return;

    const profile = this.profile();
    const now = this.ctx.currentTime;
    const ramp = 0.28;

    this.osc.setPeriodicWave(buildWave(this.ctx, profile.rollOff));
    if (this.shaper) this.shaper.curve = buildCurve(profile.drive);

    this.filter.frequency.cancelScheduledValues(now);
    this.filter.frequency.setValueAtTime(this.filter.frequency.value, now);
    this.filter.frequency.linearRampToValueAtTime(profile.cutoff, now + ramp);

    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(profile.gain, now + ramp);

    if (this.noiseGain) {
      this.noiseGain.gain.cancelScheduledValues(now);
      this.noiseGain.gain.setValueAtTime(this.noiseGain.gain.value, now);
      this.noiseGain.gain.linearRampToValueAtTime(profile.noise, now + ramp);
    }
  }

  /** One-shot throttle blip: idle → redline → idle, with the filter tracking rpm. */
  rev() {
    if (!this.running || !this.ctx || !this.osc || !this.filter) return;

    const profile = this.profile();
    const now = this.ctx.currentTime;
    const idle = rpmToHz(IDLE_RPM);
    const peak = rpmToHz(REDLINE_RPM);

    for (const [param, low, high] of [
      [this.osc.frequency, idle, peak],
      [this.filter.frequency, profile.cutoff, profile.cutoff * 3.4],
    ] as const) {
      param.cancelScheduledValues(now);
      param.setValueAtTime(param.value, now);
      // Up fast, hold briefly, down slower — an engine falls back on its own inertia.
      param.exponentialRampToValueAtTime(high, now + 0.42);
      param.setValueAtTime(high, now + 0.62);
      param.exponentialRampToValueAtTime(low, now + 1.5);
    }
  }

  stop() {
    if (!this.ctx || !this.master) return;

    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(0, now + 0.25);

    const osc = this.osc;
    const wobble = this.wobble;
    const noise = this.noiseSource;
    window.setTimeout(() => {
      osc?.stop();
      wobble?.stop();
      noise?.stop();
    }, 300);

    this.osc = null;
    this.wobble = null;
    this.noiseSource = null;
    this.running = false;
  }

  /** Called on unmount. Audio buffers count as GPU/system memory for §5.9 purposes. */
  dispose() {
    this.stop();
    const ctx = this.ctx;
    this.ctx = null;
    window.setTimeout(() => void ctx?.close(), 400);
  }
}

/** `synth:idle?exhaust=slipon` → `slipon`. Non-synth URLs return null and are fetched. */
export function synthProfileId(url: string): string | null {
  if (!url.startsWith('synth:')) return null;
  const query = url.slice(url.indexOf('?') + 1);
  return new URLSearchParams(query).get('exhaust') ?? 'stock';
}
