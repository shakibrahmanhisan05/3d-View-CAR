/**
 * Tiny builder DSL for the procedural placeholder vehicles (§12.4).
 *
 * The placeholders exist so Phase 3 is never blocked on asset acquisition. Their whole
 * contract is: produce a THREE.Object3D tree carrying the SAME semantic mesh names a real
 * GLB will carry (§13), so `Effect.targetMeshes` resolves identically against both.
 *
 * Units are metres. +X is forward, +Y is up, +Z is the vehicle's right-hand side.
 * Every vehicle sits on the ground plane at y = 0.
 */

import * as THREE from 'three';

export type MeshOpts = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number] | number;
  visible?: boolean;
  renderOrder?: number;
};

/** Named mesh. The name is the entire point — it is the configurator's addressing scheme. */
export function part(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  opts: MeshOpts = {},
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  applyOpts(mesh, opts);
  // No real-time shadow maps anywhere in this project (§5.6, §17) — ContactShadows only.
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

export function group(name: string, children: THREE.Object3D[], opts: MeshOpts = {}): THREE.Group {
  const g = new THREE.Group();
  g.name = name;
  for (const child of children) g.add(child);
  applyOpts(g, opts);
  return g;
}

function applyOpts(object: THREE.Object3D, opts: MeshOpts) {
  if (opts.position) object.position.set(...opts.position);
  if (opts.rotation) object.rotation.set(...opts.rotation);
  if (opts.scale !== undefined) {
    if (typeof opts.scale === 'number') object.scale.setScalar(opts.scale);
    else object.scale.set(...opts.scale);
  }
  if (opts.visible !== undefined) object.visible = opts.visible;
  if (opts.renderOrder !== undefined) object.renderOrder = opts.renderOrder;
}

// ---------------------------------------------------------------------------
// Geometry primitives
// ---------------------------------------------------------------------------

/**
 * Box with chamfered edges. Every real vehicle panel has a highlight running along its
 * edge; a hard 90° box has none, and that single missing highlight is most of why naive
 * primitive geometry reads as "toy".
 */
export function chamferedBox(w: number, h: number, d: number, r = 0.03, segments = 2): THREE.BufferGeometry {
  const radius = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const hw = w / 2 - radius;
  const hh = h / 2 - radius;

  const shape = new THREE.Shape();
  shape.moveTo(-hw, -h / 2);
  shape.lineTo(hw, -h / 2);
  shape.absarc(hw, -hh, radius, -Math.PI / 2, 0, false);
  shape.lineTo(w / 2, hh);
  shape.absarc(hw, hh, radius, 0, Math.PI / 2, false);
  shape.lineTo(-hw, h / 2);
  shape.absarc(-hw, hh, radius, Math.PI / 2, Math.PI, false);
  shape.lineTo(-w / 2, -hh);
  shape.absarc(-hw, -hh, radius, Math.PI, Math.PI * 1.5, false);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d - radius * 2,
    bevelEnabled: true,
    bevelThickness: radius,
    bevelSize: radius,
    bevelSegments: segments,
    curveSegments: segments + 1,
  });
  geo.translate(0, 0, -(d - radius * 2) / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Extrude a 2D side profile along Z. This is what makes the placeholder car read as a car:
 * a sedan is defined by its silhouette — bonnet rake, waistline, boot drop — not by its
 * polygon budget.
 */
export function profileExtrude(
  points: Array<[number, number]>,
  width: number,
  bevel = 0.05,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const [first, ...rest] = points;
  if (!first) throw new Error('profileExtrude needs at least one point');
  shape.moveTo(first[0], first[1]);
  for (const [x, y] of rest) shape.lineTo(x, y);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: width - bevel * 2,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 4,
  });
  // Extrude runs along +Z from 0; recentre it on the vehicle's midline.
  geo.translate(0, 0, -(width - bevel * 2) / 2);
  geo.computeVertexNormals();
  return geo;
}

/** Cylinder lying on the Z axis — every wheel, tyre, exhaust and frame tube in the build. */
export function tube(
  radiusTop: number,
  radiusBottom: number,
  length: number,
  radialSegments = 20,
  openEnded = false,
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, radialSegments, 1, openEnded);
  geo.rotateX(Math.PI / 2);
  return geo;
}

/** Cylinder lying along X — used for handlebars, roof rails and fore-aft members. */
export function tubeX(radius: number, length: number, radialSegments = 12): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1);
  geo.rotateZ(Math.PI / 2);
  return geo;
}

/** Cylinder standing on Y — uprights, forks, shock bodies. */
export function tubeY(radius: number, length: number, radialSegments = 12): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1);
}

/** Half-torus in the XY plane — a wheel arch lip, or a bent guard tube. */
export function arc(
  radius: number,
  thickness: number,
  sweep = Math.PI,
  start = 0,
  segments = 18,
): THREE.BufferGeometry {
  return new THREE.TorusGeometry(radius, thickness, 8, segments, sweep).rotateZ(start);
}

/**
 * A curved shell — mudguards, fairings. An arc of a cylinder wall, given real thickness by
 * rendering both sides, sitting on the Z axis so it wraps a wheel.
 */
export function shell(
  radius: number,
  width: number,
  thetaStart: number,
  thetaLength: number,
  segments = 16,
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius, radius, width, segments, 1, true, thetaStart, thetaLength);
  geo.rotateX(Math.PI / 2);
  return geo;
}

/**
 * A tyre: tread band plus two sidewall annuli.
 *
 * A capped cylinder is the obvious way to make a tyre and it is wrong — the cap covers the
 * rim completely, so every wheel becomes a black disc and the four alloy options the client
 * is paying for are invisible. The sidewalls must be rings with the rim's radius punched out.
 */
export function tyre(radius: number, rimRadius: number, width: number, segments = 28): THREE.BufferGeometry[] {
  const tread = new THREE.CylinderGeometry(radius, radius, width, segments, 1, true).rotateX(Math.PI / 2);

  const sidewall = (sign: number) =>
    new THREE.RingGeometry(rimRadius, radius, segments, 1).translate(0, 0, (sign * width) / 2);

  return [tread, sidewall(1), sidewall(-1)];
}

/** Soft blob — motorcycle fuel tanks, seat pads. A sphere is the cheapest honest curve. */
export function blob(sx: number, sy: number, sz: number, widthSegments = 18): THREE.BufferGeometry {
  const geo = new THREE.SphereGeometry(1, widthSegments, Math.max(8, widthSegments - 6));
  geo.scale(sx, sy, sz);
  return geo;
}

/** Flat panel: glass, decals, number plates. Thickness runs along the panel's local Z. */
export function panel(w: number, h: number, t = 0.012): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, t);
}

/**
 * A panel meant to be raked along the side profile — windscreens, rear screens.
 * Length runs along local X, vehicle width along local Z, thickness along local Y, so a
 * single `rotation.z` lays it onto a profile edge without the Euler order fighting back.
 */
export function slab(length: number, width: number, thickness = 0.02): THREE.BufferGeometry {
  return new THREE.BoxGeometry(length, thickness, width);
}

/**
 * Angle of the line a→b, for orienting a panel (windscreen, rear glass) along a profile edge.
 * Returned as a rotation about Z for a shape whose local +X is its length.
 */
export function edgeAngle(a: [number, number], b: [number, number]): number {
  return Math.atan2(b[1] - a[1], b[0] - a[0]);
}

export function edgeMid(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function edgeLength(a: [number, number], b: [number, number]): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

/**
 * A tube running between two arbitrary points. Motorcycle frames, forks, crash guards and
 * exhaust headers are all defined by where they start and where they end, not by an Euler
 * triple — writing them any other way is a guessing game.
 */
export function strut(
  name: string,
  a: [number, number, number],
  b: [number, number, number],
  radius: number,
  material: THREE.Material,
  segments = 10,
): THREE.Mesh {
  const start = new THREE.Vector3(...a);
  const dir = new THREE.Vector3(...b).sub(start);
  const length = dir.length();

  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, segments, 1), material);
  mesh.name = name;
  mesh.position.copy(start).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

/**
 * Mirror a built part across the vehicle's centreline. Left/right pairs, built once.
 *
 * Reflection across z = 0 sends a rotation R to M·R·M with M = diag(1, 1, −1), which for an
 * XYZ Euler is exactly (−rx, −ry, rz). Doing it this way rather than with `scale.z = -1`
 * keeps the winding order — and therefore the normals, and therefore the lighting — intact.
 *
 * It must recurse: a part whose children carry their own z offsets would otherwise come back
 * unmirrored and sit on top of the original.
 */
export function mirrorZ(object: THREE.Object3D, name?: string): THREE.Object3D {
  const clone = object.clone(true);
  if (name) clone.name = name;
  clone.traverse((node) => {
    node.position.z *= -1;
    node.rotation.set(-node.rotation.x, -node.rotation.y, node.rotation.z);
  });
  return clone;
}
