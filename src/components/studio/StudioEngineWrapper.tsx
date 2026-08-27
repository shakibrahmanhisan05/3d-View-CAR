'use client';

import dynamic from 'next/dynamic';

const DynamicStudioEngine = dynamic(
  () => import('./StudioEngine').then((mod) => mod.StudioEngine),
  { ssr: false }
);

export function StudioEngineWrapper() {
  return <DynamicStudioEngine />;
}
