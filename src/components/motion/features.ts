/**
 * The Framer Motion DOM feature set, isolated in its own module.
 *
 * This file exists purely to create a code-splitting boundary. `LazyMotion` must be handed a
 * loader function that resolves to the features; if that loader does
 * `import('motion/react').then(m => m.domAnimation)` it re-enters the same barrel that
 * `LazyMotion` and `m` are already statically imported from, so bundlers merge the two and
 * the "lazy" chunk lands in the initial bundle anyway.
 *
 * Re-exporting through a dedicated module gives the bundler a subtree whose only entry point
 * is the dynamic import, which is what actually lets it split.
 */

import { domAnimation } from 'motion/react';

export default domAnimation;
