/**
 * Detect Tailwind class conflicts in the rendered HTML of every public route.
 *
 * WHY THIS EXISTS
 * ---------------
 * `cn()` no longer runs tailwind-merge — dropping it was the documented lever for getting the
 * Revision 2 rebuild back inside the first-load JS budget (see src/lib/utils.ts). The cost is
 * that two utilities from the same property group can now both survive into one class list,
 * and the winner becomes stylesheet order rather than the order they were written in.
 *
 * That failure is silent. It produced exactly one real bug during the rebuild — a `hidden`
 * passed to <Button>, whose base sets `inline-flex`, left the WhatsApp CTA spilling off the
 * right edge of a 380px phone — and there was no way to see it except by looking.
 *
 * So: render every route, walk every `class` attribute, and fail on any element carrying two
 * utilities from the same property group at the same breakpoint. It is a coarse net, but it
 * catches precisely the class of mistake that removing tailwind-merge introduced.
 *
 * Usage:  pnpm build && pnpm start &   then   node scripts/dev/audit-class-conflicts.mjs
 */

const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3123';

const ROUTES = [
  '/',
  '/en',
  '/pricing',
  '/process',
  '/about',
  '/work',
  '/contact',
  '/demo/car',
  '/demo/bike',
  '/demo/modification',
  '/demo/360',
  '/for/twenty-eight-motors',
];

/**
 * One entry per CSS property that more than one utility can set. The regex has to match the
 * WHOLE utility (after its variants are stripped) or `border-b` would match inside
 * `border-b-glass-border`, which sets a colour rather than a width.
 */
const GROUPS = [
  { name: 'display', re: /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|contents|hidden|table|flow-root|list-item)$/ },
  { name: 'position', re: /^(static|fixed|absolute|relative|sticky)$/ },
  { name: 'font-size', re: /^text-(xs|sm|base|lg|xl|[2-9]xl|\[.+\])$/ },
  { name: 'border-radius', re: /^rounded(-(none|sm|md|lg|xl|2xl|3xl|full|\[.+\]))?$/ },
  { name: 'padding-all', re: /^p-(\d+(\.\d+)?|px|\[.+\])$/ },
  { name: 'padding-x', re: /^px-(\d+(\.\d+)?|px|\[.+\])$/ },
  { name: 'padding-y', re: /^py-(\d+(\.\d+)?|px|\[.+\])$/ },
  { name: 'margin-top', re: /^-?mt-(\d+(\.\d+)?|px|auto|\[.+\])$/ },
  { name: 'width', re: /^w-(\d+(\.\d+)?|px|auto|full|screen|fit|\[.+\]|\d+\/\d+)$/ },
  { name: 'height', re: /^h-(\d+(\.\d+)?|px|auto|full|screen|fit|\[.+\]|\d+\/\d+)$/ },
  { name: 'border-bottom-width', re: /^border-b(-\d+)?$/ },
  { name: 'flex-direction', re: /^flex-(row|row-reverse|col|col-reverse)$/ },
  { name: 'text-align', re: /^text-(left|center|right|justify|start|end)$/ },
];

/** `sm:hover:flex` and `flex` do not fight — they apply under different conditions. */
function splitVariants(token) {
  const parts = token.split(':');
  return { variants: parts.slice(0, -1).join(':'), utility: parts[parts.length - 1] ?? '' };
}

function findConflicts(classAttr) {
  /** `${variants}|${group}` -> utilities seen */
  const seen = new Map();
  const conflicts = [];

  for (const token of classAttr.split(/\s+/).filter(Boolean)) {
    const { variants, utility } = splitVariants(token);
    // Arbitrary values legitimately contain spaces encoded as underscores; ignore negatives
    // only when they are not part of the utility name itself.
    for (const group of GROUPS) {
      if (!group.re.test(utility)) continue;
      const key = `${variants}|${group.name}`;
      const previous = seen.get(key);
      if (previous && previous !== token) conflicts.push({ group: group.name, a: previous, b: token });
      else seen.set(key, token);
    }
  }

  return conflicts;
}

const CLASS_ATTR = /class="([^"]*)"/g;

let total = 0;

for (const route of ROUTES) {
  const response = await fetch(BASE + route);
  if (!response.ok) {
    console.error(`FETCH ${route} -> ${response.status}`);
    process.exitCode = 1;
    continue;
  }

  const html = await response.text();
  const reported = new Set();

  for (const match of html.matchAll(CLASS_ATTR)) {
    const value = match[1] ?? '';
    for (const conflict of findConflicts(value)) {
      const signature = `${conflict.group}:${conflict.a}:${conflict.b}`;
      if (reported.has(signature)) continue;
      reported.add(signature);
      total += 1;
      console.log(`${route}  [${conflict.group}]  "${conflict.a}" vs "${conflict.b}"`);
      console.log(`    on: ${value.slice(0, 180)}`);
    }
  }
}

if (total === 0) {
  console.log(`\nNo class conflicts across ${ROUTES.length} routes.`);
} else {
  console.log(`\n${total} conflict(s) found.`);
  process.exitCode = 1;
}
