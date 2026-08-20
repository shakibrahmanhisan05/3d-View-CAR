/**
 * Placeholder frames for the 360° viewer (§8).
 *
 * §8 says ship with placeholder frames; Omlan supplies the real shoot in week 2. Rather than
 * commit 32 stand-in JPEGs, each frame is drawn as an SVG by projecting a small 3D vehicle
 * model at that frame's azimuth — a ~100-line painter's-algorithm renderer, no WebGL, no
 * bytes. The viewer's real work (frame swapping, priority preloading, hotspot arcs) is
 * exercised exactly as it will be against real photographs.
 *
 * `Capture360.framePattern` decides which path is used:
 *   'procedural:sedan'                    → these frames
 *   '/demo-360/axio/frame-%s.webp'        → real files, %s = zero-padded index
 *
 * Swapping to a real shoot is a one-field JSON edit.
 */

type Vec3 = [number, number, number];
type Face = { indices: number[]; role: 'body' | 'glass' | 'dark' | 'lamp' };

const ELEVATION = (13 * Math.PI) / 180;

/** Half-widths. The top-view taper is what makes the shape read as a car when it turns. */
const W = 0.84;
const WN = 0.62; // nose
const WC = 0.7; // cabin

/*
 * Vertices, in metres, matching the placeholder sedan's proportions so the 360° demo and the
 * configurator demo do not look like two different vehicles.
 */
const V: Vec3[] = [
  // 0–7 lower body, bottom ring (rear → front, left then right)
  [-2.2, 0.3, -WN], [-2.0, 0.28, -W], [1.9, 0.28, -W], [2.18, 0.3, -WN],
  [-2.2, 0.3, WN], [-2.0, 0.28, W], [1.9, 0.28, W], [2.18, 0.3, WN],
  // 8–15 lower body, waistline ring
  [-2.16, 0.95, -WN], [-1.96, 0.99, -W], [1.86, 0.93, -W], [2.14, 0.76, -WN],
  [-2.16, 0.95, WN], [-1.96, 0.99, W], [1.86, 0.93, W], [2.14, 0.76, WN],
  // 16–23 cabin: waist ring then roof ring
  [-1.84, 1.0, -WC], [0.96, 0.96, -WC], [0.96, 0.96, WC], [-1.84, 1.0, WC],
  [-0.9, 1.45, -0.6], [0.26, 1.43, -0.6], [0.26, 1.43, 0.6], [-0.9, 1.45, 0.6],
];

const FACES: Face[] = [
  // Lower body sides, top and ends.
  { indices: [1, 2, 10, 9], role: 'body' },
  { indices: [6, 5, 13, 14], role: 'body' },
  { indices: [0, 1, 9, 8], role: 'body' },
  { indices: [5, 4, 12, 13], role: 'body' },
  { indices: [2, 3, 11, 10], role: 'body' },
  { indices: [7, 6, 14, 15], role: 'body' },
  { indices: [8, 9, 10, 11], role: 'body' }, // bonnet / boot, left half
  { indices: [15, 14, 13, 12], role: 'body' },
  { indices: [11, 10, 14, 15], role: 'body' }, // bonnet across
  { indices: [8, 11, 15, 12], role: 'body' },
  { indices: [0, 8, 12, 4], role: 'dark' }, // rear panel
  { indices: [3, 7, 15, 11], role: 'dark' }, // front panel
  // Greenhouse.
  { indices: [17, 21, 20, 16], role: 'glass' }, // left side glass
  { indices: [18, 19, 23, 22], role: 'glass' }, // right side glass
  { indices: [17, 18, 22, 21], role: 'glass' }, // windscreen
  { indices: [16, 20, 23, 19], role: 'glass' }, // rear screen
  { indices: [20, 21, 22, 23], role: 'body' }, // roof
];

const WHEELS: Array<{ centre: Vec3; radius: number }> = [
  { centre: [1.35, 0.33, -W], radius: 0.33 },
  { centre: [-1.35, 0.33, -W], radius: 0.33 },
  { centre: [1.35, 0.33, W], radius: 0.33 },
  { centre: [-1.35, 0.33, W], radius: 0.33 },
];

type Projected = { x: number; y: number; depth: number };

function project(point: Vec3, azimuth: number): Projected {
  const [x, y, z] = point;
  const cos = Math.cos(azimuth);
  const sin = Math.sin(azimuth);

  const xr = x * cos + z * sin;
  const zr = -x * sin + z * cos;

  return {
    x: xr,
    y: y * Math.cos(ELEVATION) - zr * Math.sin(ELEVATION),
    depth: zr * Math.cos(ELEVATION) + y * Math.sin(ELEVATION),
  };
}

/** Shade a face from its screen-space winding and its normal's tilt toward the key light. */
function shade(points: Projected[], role: Face['role'], bodyHex: string): string | null {
  const [a, b, c] = points;
  if (!a || !b || !c) return null;

  // Back-face cull: a negative signed area means we are looking at the inside of the panel.
  const area = (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
  if (area <= 0) return null;

  // Larger projected area ⇒ the face is turned toward us ⇒ it catches more light.
  const spread = Math.min(1, Math.abs(area) * 0.55);
  const lift = 0.55 + spread * 0.55;

  if (role === 'glass') return mix('#20262B', '#8FA6B4', spread * 0.7);
  if (role === 'dark') return mix('#0F1112', '#3A4045', spread);
  if (role === 'lamp') return '#E8EEF2';
  return mix('#000000', bodyHex, Math.min(1, lift));
}

function mix(from: string, to: string, t: number): string {
  const parse = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [r1 = 0, g1 = 0, b1 = 0] = parse(from);
  const [r2 = 0, g2 = 0, b2 = 0] = parse(to);
  const channel = (a: number, b: number) => Math.round(a + (b - a) * Math.max(0, Math.min(1, t)));
  return `rgb(${channel(r1, r2)},${channel(g1, g2)},${channel(b1, b2)})`;
}

/**
 * One frame as an SVG data URI. `frame` is 0-based; frame 0 is the front three-quarter, which
 * is where a real turntable shoot starts and where the viewer opens.
 */
export function placeholderFrame(frame: number, frameCount: number, bodyHex = '#B9BEC1'): string {
  const azimuth = (frame / frameCount) * Math.PI * 2 + Math.PI * 0.28;

  const width = 1200;
  const height = 800;
  const scale = 190;
  const cx = width / 2;
  const cy = height / 2 + 100;

  const toScreen = (p: Projected) => ({ x: cx + p.x * scale, y: cy - p.y * scale, depth: p.depth });
  const projected = V.map((vertex) => toScreen(project(vertex, azimuth)));

  type Drawable = { depth: number; svg: string };
  const drawables: Drawable[] = [];

  for (const face of FACES) {
    const points = face.indices.map((index) => projected[index]).filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (points.length < 3) continue;

    const fill = shade(points, face.role, bodyHex);
    if (!fill) continue;

    const depth = points.reduce((sum, p) => sum + p.depth, 0) / points.length;
    const d = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    drawables.push({ depth, svg: `<polygon points="${d}" fill="${fill}"/>` });
  }

  for (const wheel of WHEELS) {
    const centre = toScreen(project(wheel.centre, azimuth));
    // A wheel seen off-axis is an ellipse; how far off-axis is exactly the |sin| of the angle
    // between its axle and the view direction.
    const squash = Math.abs(Math.sin(azimuth));
    const rx = Math.max(4, wheel.radius * scale * squash);
    const ry = wheel.radius * scale;
    drawables.push({
      depth: centre.depth,
      svg:
        `<ellipse cx="${centre.x.toFixed(1)}" cy="${centre.y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="#121415"/>` +
        `<ellipse cx="${centre.x.toFixed(1)}" cy="${centre.y.toFixed(1)}" rx="${(rx * 0.58).toFixed(1)}" ry="${(ry * 0.58).toFixed(1)}" fill="#8A9095"/>`,
    });
  }

  // Painter's algorithm: far to near.
  drawables.sort((a, b) => b.depth - a.depth);

  // A soft contact shadow, not a hard black disc: the sequence is shot on a showroom floor,
  // and a hard ellipse under the car is the fastest way to make a render look pasted on.
  const shadowR = (2.2 * scale).toFixed(0);
  const shadow =
    `<defs><radialGradient id="sh"><stop offset="0" stop-color="#000" stop-opacity="0.5"/>` +
    `<stop offset="0.65" stop-color="#000" stop-opacity="0.22"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${cx}" cy="${cy + 6}" rx="${shadowR}" ry="${(0.46 * scale).toFixed(0)}" fill="url(#sh)"/>`;

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<rect width="${width}" height="${height}" fill="#1A1D1F"/>` +
    shadow +
    drawables.map((d) => d.svg).join('') +
    `</svg>`;

  // encodeURIComponent rather than base64: smaller for SVG, and readable in devtools.
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function isProceduralCapture(framePattern: string): boolean {
  return framePattern.startsWith('procedural:');
}

/** Resolve one frame's src, whichever source the capture uses. */
export function frameSrc(framePattern: string, frame: number, frameCount: number): string {
  if (isProceduralCapture(framePattern)) return placeholderFrame(frame, frameCount);
  return framePattern.replace('%s', String(frame).padStart(2, '0'));
}
