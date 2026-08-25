/**
 * <StageFloor> — the CSS light streak at the foot of the bay.
 *
 * A shallow specular glow plus a one-pixel horizon line at 24% height. Zero JS, zero
 * raster, no motion. The 3D <StagePlatform> supplies the physical floor; this DOM layer
 * supplies the warm light pooling across it, which ties the canvas to the page's bronze
 * accent the way a practical light would.
 *
 * z-2: above the canvas, below every piece of DOM chrome, so the streak passes *under*
 * the wheels rather than floating over them.
 *
 * (The giant Monolith wordmark that used to live in this file was removed on Hisan's
 * instruction — the stage platform replaced it as the backdrop, and the model code stays
 * where it belongs: on the panel, in type you can read.)
 */

import { cn } from '@/lib/utils';

export function StageFloor({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('stage-floor z-[2]', className)} />;
}
