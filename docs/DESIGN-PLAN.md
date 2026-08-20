# Phase 0 — Design Plan (Phoenix)

> **SUPERSEDED 2026-08-18 by "Obsidian" — see the section at the bottom of this file.**
>
> Everything above that section describes the original flat "Sheet" design, which Hisan
> reviewed in the browser and rejected: *"looks like a simple website from the 90s — no
> colour theme, no elegance, no premiumness, no animation."* That is a legitimate call by the
> person who has to open this on a phone in front of a client, and it overrides the reasoning
> below.
>
> The original argument is kept rather than deleted, because two of its conclusions are
> **commercial, not visual, and they still bind** — they are carried into the new design:
> no SaaS pricing-page patterns (no highlighted middle tier, no "most popular" badge), and
> project prices in ৳ stated openly on the page.

---

> Produced by running the two-pass process manually. The `frontend-design` and
> `ui-ux-pro-max` skills are **not installed** on this machine, so this document
> substitutes for them and is written to be audited. If those skills are installed
> later, re-run Phase 0 against them and revise this file.

---

## Pass 1 — Brainstorm (what I first reached for)

Idea A — "Automotive premium": near-black page, thin white type, a single electric accent,
big full-bleed hero render, glass cards for specs.

Idea B — "Bangladeshi workshop": paper-coloured page, industrial grotesque, monospaced data,
hairline rules, one stamp-red signal.

Idea C — "Auction sheet" (the brief's own suggestion): the whole page is structurally a
Japanese auction sheet — gridded, gutter-coded, stamped, tabular.

---

## Pass 2 — Critique against §3 (anti-defaults)

**Idea A fails immediately.** "Near-black background with a single acid accent" is explicitly
on the reject list. It is also strategically wrong: near-black premium automotive is the visual
language of Mercedes and Audi, which §12.1 tells us makes a Chattogram recon dealer think
*"that is not my business."*

**Idea B is directionally right but under-specified.** "Industrial + monospace" is a mood, not
a structure. Left alone it drifts into the same three-column feature grid the brief rejects,
just with different colours.

**Idea C is the strongest, but it has two real risks I had to design around:**

1. *Risk: pastiche.* If the page literally imitates a scanned auction sheet — skewed scans,
   fake stamps, paper texture — it reads as a novelty and it will not survive being viewed on
   a 6" Android at 2am. **Resolution:** borrow the sheet's *structure and information density*,
   not its texture. No paper grain, no rotated stamps, no drop shadows. Flat, printed, exact.
2. *Risk: cream + serif + terracotta.* An "auction sheet" instinct pulls straight toward
   `#F4F1EA` paper, a high-contrast serif, and a warm terracotta accent — which is the single
   most-rejected combination in §3. **Resolution:** the paper is cooled to a neutral grey-green
   (`#EFEFEA`, closer to fluorescent showroom light than to parchment), the display face is a
   mechanical grotesque (Archivo), never a serif, and the accent is a saturated **inkan stamp
   red** (`#C0261B`) — the red of the seal and grade markings on a real auction sheet — which is
   a different hue family from terracotta (`#D97757` is a desaturated orange; ours is a red).

**Other §3 checks:**
- No purple/blue gradients anywhere — the palette has no gradient at all. Colour is flat.
- No glassmorphism — hierarchy comes from **rules, gutter codes and stamps**, not blur.
- No icon-circle feature grid — features are presented as **table rows** with a code column.
- Not Inter — Archivo for display, Hind Siliguri for Bangla, JetBrains Mono for every numeral.
- No "Elevate/Transform/Unlock" headlines — hero copy is fixed by the brief and is a plain
  statement of fact: *আপনার শোরুম রাত ২টায়ও খোলা।*
- No `01 / 02 / 03` decoration — gutter codes (`SEC-03`, `OPT-PAINT`) exist only where the
  content genuinely is an indexed record, matching how an auction sheet codes its rows.

---

## Revised plan (what is being built)

### Concept — "The Sheet"

The site is laid out as one continuous inspection document. Every section is a **row block**
with a left gutter carrying a short code and a Bangla label, separated by 1px hairline rules.
Data is always tabular and always monospaced. The only place the discipline breaks is the
paint-chip strip, which is deliberately physical.

Against that flat paper sits the **bay** — a single near-black full-bleed band where the 3D
lives. Paper and bay is the whole compositional idea: the showroom floor is dark, the paperwork
is light, and the vehicle sits in the dark part.

### Colour tokens — 6 named values

| Token | Hex | Role |
|---|---|---|
| `--ph-paper` | `#EFEFEA` | Page ground. Fluorescent showroom white, grey-green cast. Not cream. |
| `--ph-ink` | `#17191A` | Text, dark surfaces. Graphite / oil stain. |
| `--ph-rule` | `#C3C4BD` | Hairlines. The single most-used element on the page. |
| `--ph-alu` | `#9A9E99` | Brushed aluminium. Gutter codes, secondary labels, disabled states. |
| `--ph-signal` | `#C0261B` | Inkan stamp red. Grade badges, the selected swatch tick, one CTA. |
| `--ph-bay` | `#0E1011` | The 3D bay. Darker than ink so the canvas reads as a recess. |

Everything else is derived with `color-mix()` — there is no seventh hex value in the codebase.

`--ph-signal` is the **only** token a prospect's `brandAccent` overrides, which is why the
whole system is CSS custom properties rather than Tailwind literals (§10).

Accessibility: `--ph-ink` on `--ph-paper` is ~15.5:1. `--ph-signal` on `--ph-paper` is ~5.5:1
(passes AA for text, and signal is never used below 14px bold). Paper on bay is ~16:1.

### Type pairing

| Role | Face | Notes |
|---|---|---|
| Bangla (default UI) | **Hind Siliguri** 400/500/600/700, subset `bengali`+`latin` | Line-height 1.75 at body, 1.35 at display. Conjuncts verified against `শোরুম গাড়ি মোটরসাইকেল কনফিগারেশন যোগাযোগ করুন` — see `/en/type-check` route in dev. |
| Latin display | **Archivo** variable, `wdth` axis | Used condensed-to-expanded for section headings. Mechanical, tight apertures, not Inter/Poppins/Montserrat. |
| All figures | **JetBrains Mono** variable | Every price, cc, km, grade, percentage, phone number and ROI output on the site. `font-variant-numeric: tabular-nums`. |

Bangla gets its own leading scale — Latin leading values are never reused on Bangla text.

### Signature element — the paint-chip strip

A horizontal row of physical swatch tabs, rendered as real chips: square colour field, 1px ink
hairline, the manufacturer's actual paint name set in 10px mono small-caps beneath
(`ATTITUDE BLACK MICA`, `PEARL WHITE III`, `RACING BLUE`), and a monospaced `+৳ 0` delta.

Selected state: the chip translates **up 4px** as if pulled from the card, gains a 2px ink
border, and a stamp-red tick is printed in its top-right corner. On mobile the strip is a
scroll-snapping row with 48px targets. This is the one place with any physicality on the page,
and it is the thing the pitch is remembered by.

### Motion

One orchestrated load: paper and rules paint instantly → poster image in the bay → 3D streams
in behind → 400ms cross-dissolve → auto-rotation until first touch, then never again this
session. Scroll effects: none beyond a 1-frame rule-draw on section entry. All of it gated on
`prefers-reduced-motion`.

---

## Why this direction is defensible commercially

A Chattogram dealer reads auction sheets fluently and has never once been impressed by a SaaS
landing page. Building the site out of his own trust document means the design is legible to
him on sight, costs almost nothing in bytes (flat colour, hairlines, no imagery, no gradients,
no blur), and leaves the entire performance budget for the thing that actually sells — the
vehicle in the bay.


---
---

# Revision 1 — "Obsidian" (2026-08-18)

Requested by Hisan: Tailwind CSS, shadcn/ui, Framer Motion, and a premium dark automotive
direction. Direction confirmed with him before any code was written.

## Concept

A showroom at night. The page is the dark floor, the vehicle stands in a pool of light, and
everything else is glass, hairline metal and one warm accent. The previous design's "paper vs
bay" split is gone: there is no light paperwork any more, so the 3D bay is no longer a
separate band — it is simply the deepest layer of the same room, and the hero canvas runs
full-bleed under a transparent header and dissolves into the page at its bottom edge.

## What was kept from "The Sheet", and why

Not everything in the old design was wrong; three things were genuinely good information
design and survive intact:

- **The left gutter carrying a mono code and a Bangla label** on every section. It still makes
  the page read as an inspection record rather than a template.
- **Every numeral monospaced and tabular** (`.num`). Three prices of different lengths still
  line up down a column.
- **Bangla gets its own leading scale.** Latin leading values are never reused on Bangla text.

## Colour tokens

The `--ph-*` token NAMES are unchanged, because `/for/[slug]` retints the whole site by
overriding one of them from one JSON field (§10) and ~300 utility usages are bound to them.
Only the values changed. Note the semantic flip: `--ph-paper` was the light ground and is now
the dark ground; `--ph-ink` was the dark text and is now the light text. `bg-ink text-paper`
therefore still means "inverted surface", it is simply light-on-dark now.

| Token | Hex | Role |
|---|---|---|
| `--ph-bay` | `#070809` | Deepest layer — the 3D recess. |
| `--ph-paper` | `#0A0B0D` | Page ground. Obsidian. |
| `--ph-ink` | `#F4F5F7` | Text and inverted surfaces. 18.1:1 on paper. |
| `--ph-rule` | `#23262C` | Hairline metal. |
| `--ph-alu` | `#9BA1AC` | Brushed aluminium — codes, secondary labels. 7.6:1. |
| `--ph-signal` | `#C8382A` | Brand / action. **The only token a prospect overrides.** |
| `--ph-accent` | `#D4A857` | Champagne. The elegance layer. 8.9:1 on paper. |

**Two accents, two jobs, and they must not be swapped.** `--ph-signal` is the action colour —
buttons, the WhatsApp path. `--ph-accent` is the elegance layer — section codes, selected
ticks, hairline highlights, focus rings, the ROI output figure. Champagne is never a button
ground; ember is never a decorative hairline.

### The signal colour has three values, on purpose

This is the one part of the palette that is easy to break later:

- `--ph-signal` is tuned as a **ground**, dark enough to carry white at 5.2:1. It has to be,
  because a prospect can override it with any hue they hand us (`twenty-eight-motors` ships
  `#0B3D91` navy) and white is the only foreground that survives all of them.
- `--ph-signal-ink` (`#ffffff`) is the foreground **on** that ground.
- `--ph-signal-lit` is the same hue mixed toward `--ph-ink` for use **as text** on the dark
  floor. A colour dark enough to carry white is by definition too dark to read against
  obsidian, so the two jobs genuinely need two values. It is derived, so a prospect override
  still flows into both.

Everything else is still derived with `color-mix()`. Glass surfaces, borders and elevation are
derived from `--ph-ink` at low alpha rather than being new hex values.

## Depth

Hierarchy now comes from elevation and light instead of rules alone: a `.surface` glass card,
a `.lit-edge` 1px top highlight (a light source above the card is most of what makes a dark UI
read as *lit* rather than merely dark), layered shadows, and a fixed very-soft warm pool
behind the whole page (`body::before`, one gradient, no image, no blur filter).

## Motion

- One shared Framer Motion bundle via `LazyMotion` + `m`, loaded through
  `src/components/motion/features.ts`. **Read the comment in that file before touching it** —
  the obvious lazy setup silently un-splits the chunk.
- Sections arrive once on scroll (`Reveal`, `RevealGroup`, `RevealItem`): 16px rise and a
  fade, `once: true`. Nothing parallaxes, nothing pins, nothing scrubs to scroll position.
- Shared-`layoutId` sliding pills for the header nav, hero segment toggle, demo tab rail and
  ROI segment switch.
- `useReducedMotion` renders the final state with **no** transition, rather than a fast one.

## shadcn/ui

`src/components/ui/*` — Button, Card, Badge, Accordion — plus `cn()` in `src/lib/utils.ts`.
They are authored against the shadcn token names (`--background`, `--primary`, …), which are
mapped onto the Phoenix tokens in `globals.css` rather than duplicated, so a prospect accent
cascades into shadcn components too and a colour is still defined in exactly one place.

**Radix is not used for the demo tab rail.** `<TabsContent>` mounts and unmounts per value,
which would rebuild the WebGL context on every tab press and break the one-context guarantee
`DemoTabs` exists to hold. That rail is hand-rolled and styled to match.

## Cost, stated plainly

Adding a component library and an animation library to a site that had neither is not free.
First-load JS against the §14 budget of 130 kB per public route:

| Route | Before | After |
|---|---|---|
| `/` | 128 kB | **190 kB** |
| `/for/[slug]` | 129 kB | **190 kB** |
| `/pricing` | 121 kB | **180 kB** |
| `/contact` | 130 kB | **171 kB** |
| `/demo/*` | 129 kB | **139 kB** |
| `/about`, `/process` | — | **144 kB** |

The waste has been taken out (the motion feature chunk is genuinely split; `lucide-react` is
in `optimizePackageImports`); what is left is the libraries themselves. **The budget is now
exceeded and that is a live decision for Hisan, not a settled one.** The levers, largest
first: revert the FAQ from the Radix accordion to native `<details>`, drop `tailwind-merge`
from `cn()`, drop the shared-`layoutId` pills (they are the only thing needing Motion's layout
features). Reverting all three would land back near 140 kB.
