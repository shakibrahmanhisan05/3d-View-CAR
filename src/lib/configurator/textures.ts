/**
 * Procedural textures for wraps and tank pads (§6.1 `wrap`, §6.2 `tankpad`).
 *
 * `Effect.texture.map` takes a URL. Until real wrap artwork exists on R2 it takes a
 * `procedural:<id>` scheme instead, drawn once into a canvas. Same reasoning as the
 * environment rigs: the feature has to be demonstrable in a showroom today, on mobile data,
 * and swapping to real artwork must be a JSON edit and nothing else.
 *
 * Anything that is not `procedural:` is loaded as a normal texture URL.
 */

import * as THREE from 'three';

export type ProceduralPattern =
  | 'carbon'
  | 'matte-black'
  | 'racing-stripe'
  | 'camo-urban'
  | 'chequer'
  | 'flame';

const SIZE = 512;

function drawPattern(ctx: CanvasRenderingContext2D, pattern: ProceduralPattern) {
  ctx.fillStyle = '#141617';
  ctx.fillRect(0, 0, SIZE, SIZE);

  switch (pattern) {
    case 'carbon': {
      // 2×2 twill: the weave only reads correctly if adjacent cells alternate direction.
      const cell = 16;
      for (let y = 0; y < SIZE; y += cell) {
        for (let x = 0; x < SIZE; x += cell) {
          const alt = ((x / cell) + (y / cell)) % 2 === 0;
          const grad = ctx.createLinearGradient(x, y, x + cell, y + cell);
          grad.addColorStop(0, alt ? '#2A2E31' : '#171A1C');
          grad.addColorStop(0.5, alt ? '#3A4045' : '#202427');
          grad.addColorStop(1, alt ? '#1B1E20' : '#101213');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, cell, cell);
        }
      }
      break;
    }
    case 'matte-black': {
      ctx.fillStyle = '#1A1C1D';
      ctx.fillRect(0, 0, SIZE, SIZE);
      for (let i = 0; i < 12000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#202223' : '#141516';
        ctx.fillRect(Math.random() * SIZE, Math.random() * SIZE, 2, 2);
      }
      break;
    }
    case 'racing-stripe': {
      ctx.fillStyle = '#E8E9E3';
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = '#C0261B';
      ctx.fillRect(SIZE * 0.34, 0, SIZE * 0.12, SIZE);
      ctx.fillRect(SIZE * 0.54, 0, SIZE * 0.12, SIZE);
      ctx.fillStyle = '#17191A';
      ctx.fillRect(SIZE * 0.48, 0, SIZE * 0.04, SIZE);
      break;
    }
    case 'camo-urban': {
      const shades = ['#2C3134', '#454C50', '#5E666B', '#1B1F21'];
      for (let i = 0; i < 220; i++) {
        ctx.fillStyle = shades[i % shades.length] ?? '#2C3134';
        const w = 24 + Math.random() * 70;
        const h = 24 + Math.random() * 70;
        ctx.fillRect(Math.random() * SIZE - w / 2, Math.random() * SIZE - h / 2, w, h);
      }
      break;
    }
    case 'chequer': {
      const cell = 32;
      for (let y = 0; y < SIZE; y += cell) {
        for (let x = 0; x < SIZE; x += cell) {
          ctx.fillStyle = ((x / cell) + (y / cell)) % 2 === 0 ? '#EDEEE8' : '#17191A';
          ctx.fillRect(x, y, cell, cell);
        }
      }
      break;
    }
    case 'flame': {
      const grad = ctx.createLinearGradient(0, SIZE, SIZE, 0);
      grad.addColorStop(0, '#17191A');
      grad.addColorStop(0.45, '#8E1512');
      grad.addColorStop(0.7, '#C0261B');
      grad.addColorStop(1, '#E8A317');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 26; i++) {
        ctx.beginPath();
        ctx.ellipse(Math.random() * SIZE, Math.random() * SIZE, 30 + Math.random() * 90, 12 + Math.random() * 30, Math.random() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
  }
}

/** Cached per pattern — a wrap swatch and the applied wrap must not build the canvas twice. */
const cache = new Map<string, THREE.Texture>();

export function getProceduralTexture(pattern: ProceduralPattern): THREE.Texture {
  const existing = cache.get(pattern);
  if (existing) return existing;

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (ctx) drawPattern(ctx, pattern);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  cache.set(pattern, texture);
  return texture;
}

/** Data URL of the same pattern, for the option thumbnail in the panel. */
export function proceduralThumbnail(pattern: ProceduralPattern, size = 96): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.save();
  ctx.scale(size / SIZE, size / SIZE);
  drawPattern(ctx, pattern);
  ctx.restore();
  return canvas.toDataURL('image/png');
}

export function isProcedural(map: string): boolean {
  return map.startsWith('procedural:');
}

export function proceduralId(map: string): ProceduralPattern {
  return map.slice('procedural:'.length) as ProceduralPattern;
}

/** Textures live for the session, not the component. Called only on full teardown. */
export function disposeProceduralTextures() {
  for (const texture of cache.values()) texture.dispose();
  cache.clear();
}
