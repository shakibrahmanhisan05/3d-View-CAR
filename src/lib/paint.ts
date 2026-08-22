/**
 * THE EDITORIAL TINT — text colour derived from the vehicle's selected paint.
 *
 * The requirement: when the buyer taps "Attitude Black Mica" or "Soul Red Crystal", the
 * site's accented TEXT moves with the car. Not the buttons — those stay ember, because
 * ember is the action colour and a prospect overrides it (see globals.css, §4.2 of the
 * rebuild brief) — but the monolith, the overlines, the stat figures, the headline fall-off
 * and every section code.
 *
 * THE PROBLEM THIS FILE SOLVES
 * ----------------------------
 * A paint swatch is authored to look right on sheet metal, not to be read on obsidian. Half
 * the strip is unusable as text: `#0B0C0E` "Attitude Black" is invisible on `--ph-paper`,
 * and a saturated navy sits at ~1.6:1. Piping `swatchHex` straight into `color:` would ship
 * a site whose text disappears on two of six chips — an accessibility regression dressed up
 * as a feature.
 *
 * So the swatch is treated as a HUE SOURCE, never as a colour. We keep its hue and as much
 * of its chroma as survives, then raise lightness until the result clears a real contrast
 * ratio against the page ground. Black paint resolves to a cool near-white; navy resolves to
 * a bright sky; champagne stays champagne. The text always reads, and it always reads *as*
 * the car.
 *
 * Everything here is pure, synchronous and allocation-light: it runs once per paint change,
 * on the main thread, between a tap and the next frame.
 */

/** The page ground the editorial layer is measured against — `--ph-paper`. */
const GROUND = '#0a0b0d';

/**
 * Target contrast for the editorial layer. WCAG AA body text is 4.5:1; we aim past it
 * because these values also land on `--ph-plate`, which is a shade lighter than the ground
 * and therefore a slightly harder background (§14 of the brief asks for this to be
 * re-measured on the plate — the headroom is the measurement).
 */
const TARGET_CONTRAST = 5.6;

export type PaintTint = {
  /** The swatch as authored. Used for grounds, rims and glows — never for text. */
  base: string;
  /** The readable editorial ink. Guaranteed ≥ TARGET_CONTRAST against `--ph-paper`. */
  lit: string;
  /** Black or white — whichever is legible ON the raw swatch. For text over a chip. */
  on: string;
};

// ---------------------------------------------------------------------------
// Colour maths. sRGB → relative luminance → contrast, per WCAG 2.1.
// ---------------------------------------------------------------------------

function parseHex(hex: string): [number, number, number] | null {
  const clean = hex.trim().replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;
  if (full.length !== 6 || !/^[0-9a-f]{6}$/i.test(full)) return null;
  return [
    Number.parseInt(full.slice(0, 2), 16) / 255,
    Number.parseInt(full.slice(2, 4), 16) / 255,
    Number.parseInt(full.slice(4, 6), 16) / 255,
  ];
}

function toHex([r, g, b]: [number, number, number]): string {
  const channel = (value: number) =>
    Math.round(Math.min(1, Math.max(0, value)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function luminance([r, g, b]: [number, number, number]): number {
  const linear = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [light, dark] = luminance(a) > luminance(b) ? [luminance(a), luminance(b)] : [luminance(b), luminance(a)];
  return (light + 0.05) / (dark + 0.05);
}

// ---------------------------------------------------------------------------
// HSL, because lightness is the axis we need to move along and hue is the axis we need to
// keep. (OKLCH would be nicer perceptually, but it is 60 lines more code for a difference
// nobody can see at 0.72rem of tracked-out mono.)
// ---------------------------------------------------------------------------

function toHsl([r, g, b]: [number, number, number]): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 : max === g ? ((b - r) / d + 2) / 6 : ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function fromHsl([h, s, l]: [number, number, number]): [number, number, number] {
  if (s === 0) return [l, l, l];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number) => {
    let value = t;
    if (value < 0) value += 1;
    if (value > 1) value -= 1;
    if (value < 1 / 6) return p + (q - p) * 6 * value;
    if (value < 1 / 2) return q;
    if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
    return p;
  };
  return [channel(h + 1 / 3), channel(h), channel(h - 1 / 3)];
}

// ---------------------------------------------------------------------------

/**
 * Lift a swatch until it is readable on the obsidian ground, keeping its hue.
 *
 * Lightness is monotonic in luminance for a fixed hue and saturation, so a 22-step bisection
 * lands within a fraction of a percent — deterministic, and cheap enough to run inline.
 *
 * A TRULY ACHROMATIC swatch stays achromatic. HSL gives a pure grey a hue of 0, so lifting
 * its saturation to keep "a hint of the paint" would turn `#888888` into pink — inventing a
 * colour the vehicle does not have. Below 0.08 saturation the swatch has no hue to preserve,
 * so the ink resolves to a clean neutral. Between 0.08 and 0.12 the hue is real but faint,
 * and it is nudged up so a near-black like `#0B0C0E` still reads as the cool grey it is.
 */
export function readableInk(hex: string): string {
  const rgb = parseHex(hex);
  const ground = parseHex(GROUND);
  if (!rgb || !ground) return '#f4f5f7';

  if (contrast(rgb, ground) >= TARGET_CONTRAST) return toHex(rgb);

  const [h, s] = toHsl(rgb);
  const saturation = s < 0.08 ? 0 : s < 0.12 ? 0.16 : Math.min(0.92, s);

  let low = toHsl(rgb)[2];
  let high = 1;
  let best: [number, number, number] = [1, 1, 1];

  for (let step = 0; step < 22; step += 1) {
    const mid = (low + high) / 2;
    const candidate = fromHsl([h, saturation, mid]);
    if (contrast(candidate, ground) >= TARGET_CONTRAST) {
      best = candidate;
      high = mid;
    } else {
      low = mid;
    }
  }

  return toHex(best);
}

/** Black or white, whichever is legible on the raw swatch. For labels printed on a chip. */
export function inkOn(hex: string): string {
  const rgb = parseHex(hex);
  if (!rgb) return '#ffffff';
  return luminance(rgb) > 0.32 ? '#0a0b0d' : '#ffffff';
}

export function paintTint(hex: string | undefined): PaintTint {
  const base = hex && parseHex(hex) ? hex : '#d4a857';
  return { base, lit: readableInk(base), on: inkOn(base) };
}

/**
 * Write the tint onto <html>.
 *
 * Two properties only. Everything else in the `--ph-paint-*` family is declared in
 * globals.css as a `color-mix()` over these two, and custom properties substitute at the
 * element where they are DECLARED — which is `:root`, i.e. this very element. So setting two
 * values here re-derives the soft, rim, sunk, glow and monolith tokens for free, and costs
 * one style recalculation rather than a React re-render of anything.
 */
export function applyPaintTint(hex: string | undefined): void {
  if (typeof document === 'undefined') return;
  const tint = paintTint(hex);
  const root = document.documentElement.style;
  root.setProperty('--ph-paint', tint.base);
  root.setProperty('--ph-paint-lit', tint.lit);
}
