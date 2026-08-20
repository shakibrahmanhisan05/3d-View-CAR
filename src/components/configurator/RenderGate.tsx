'use client';

/**
 * Stop rendering when nobody is looking at the canvas.
 *
 * The canvas ran `frameloop="always"`, so the hero kept drawing a full clearcoat scene at
 * 60fps for the entire length of the page — while the visitor was reading the pricing table,
 * while they were scrolling, and while the tab sat in the background. Every one of those
 * frames competes with the main thread for the same budget the scroll needs, which is what
 * made scrolling feel heavy on the homepage.
 *
 * Two gates, both cheap:
 *  - IntersectionObserver on the canvas element: once the bay leaves the viewport the loop
 *    stops dead, and resumes the moment any part of it comes back.
 *  - `visibilitychange`: a backgrounded tab renders nothing at all.
 *
 * `rootMargin` starts the loop slightly before the canvas scrolls into view, so the vehicle
 * is already turning when it arrives rather than snapping to life a frame later.
 *
 * This never disables interaction — an offscreen canvas cannot be interacted with — and it
 * never touches quality. It only removes frames nobody sees.
 */

import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';

export function RenderGate() {
  const gl = useThree((state) => state.gl);
  const setFrameloop = useThree((state) => state.setFrameloop);
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const canvas = gl.domElement;
    let onScreen = true;
    let tabVisible = document.visibilityState !== 'hidden';

    const apply = () => {
      const run = onScreen && tabVisible;
      setFrameloop(run ? 'always' : 'never');
      // One frame on resume so the first thing the visitor sees is current, not the stale
      // buffer from wherever the camera was when we paused.
      if (run) invalidate();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry?.isIntersecting ?? true;
        apply();
      },
      { rootMargin: '200px 0px' },
    );
    observer.observe(canvas);

    const onVisibility = () => {
      tabVisible = document.visibilityState !== 'hidden';
      apply();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      // Hand the loop back running, or a remount inherits a stopped canvas.
      setFrameloop('always');
    };
  }, [gl, setFrameloop, invalidate]);

  return null;
}
