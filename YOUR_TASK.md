# YOUR_TASK.md — what Hisan does right now

> Claude keeps this file up to date. Whenever you come back, **read this file first.**
> It only ever contains things *you* have to do — Claude handles the code.
> Last updated: **2026-08-25** (Revision 3 — the full visual rebuild, "Atelier")

---

## What happened

You said the site looked horrible — the texts, the fonts, the design, everything — and gave
Claude full freedom. So the frontend was rebuilt from zero:

- **The dark theme is gone.** The page is now warm paper with near-black type. The car still
  sits on a black stage — hero, demos, 360° — so the vehicle gets the spotlight and the words
  get daylight. Bright showrooms were killing the old all-dark design; this one is built to
  be read under strip lighting.
- **Your circular stage is in.** The turntable-with-backdrop model you generated is now the
  floor of every 3D bay — hero, both configurators, the modification demo, shared builds.
  It was 6.5 MB; it ships at 0.43 MB with the bronze slats intact. The giant model-code
  letters that used to float behind the car are gone completely — the stage is the backdrop
  now.
- **Bangla headlines are set in a serif now** (Noto Serif Bengali) — the way good Bengali
  publications do it. Body text stays Hind Siliguri. Every price and spec stays monospaced.
- **One red.** Buttons, prices, selected chips: one deep ember. No more gold-and-red
  everywhere, no glows, no glass panels stacked on glass panels.
- All the clutter was deleted: stamps and serial numbers are gone from the corners,
  headlines stopped being gradient-filled.
- Prices, Bangla default, WhatsApp paths, your models, the licence gate, `/for/<slug>` —
  nothing commercial moved.

Run it the same as always:

```
pnpm dev
```

Then open **http://localhost:3000**. ⚠️ Still true: don't run `pnpm build` while `pnpm dev`
is running. If styling ever disappears: stop dev, delete `.next`, start again.

**Look at these, in this order:**

| Page | What to check |
|---|---|
| `/` | The paper page, the black stage, the serif headline. **Your circular stage platform is under the car** — turntable, slatted backdrop, light rig. Tap paint chips — the accents change colour with the paint. |
| Header | Links visible on a laptop now (menu button only on small screens). |
| Scroll | Daylight sections between dark stages. Each section: small label, big serif heading, room to breathe. |
| `/demo/car`, `/demo/bike` | Same stage platform inside a rounded frame. White panel on the right reads like an inspection sheet. |
| `/demo/360` | Auction-grade stamp top-right, frame counter bottom-left. |
| `/pricing` | Ladder by card width, still no "most popular" badge. |
| `/contact` | One white sheet: form left, phone right. |
| `/for/twenty-eight-motors` | Still retints everything navy from that one JSON file. |
| Your phone | **Most important.** Claude could not browser-test this rebuild. Check the hero, the chip row and the header menu at 380px width. |

---

## You still owe — unchanged

1. **Task 2 — three real numbers.** WhatsApp number, phone, Chattogram address. Until then
   every WhatsApp link is dead by design (`8801XXXXXXXXX`).
2. **Task 3 — domain name.** For sitemap/OG/JSON-LD.
3. **Task 4 — confirm prices.** P1 ৳45–75k · P2 ৳25–40k/model · P3 ৳1,200–2,500/vehicle ·
   care ৳18k/year optional.
4. **Licence screenshots** for the two Tripo models into `docs/licence-screenshots/` — the
   gate warns about this on every build.
5. **Omlan's practice 360° shoot** (32 frames, fixed exposure). The viewer is waiting; swap
   is one line.
6. Engine sounds from Freesound (CC0) — later, not urgent.

---

## Things you do NOT need to do

- ❌ Don't install anything. Don't buy hosting/R2/database yet — leads save to `.data/`,
  readable at `/admin` (password `phoenix-test-2026`).
- ❌ Don't touch the code. Tell Claude what looks wrong.
- ❌ `/pitch` and `/admin` still look plain. Deliberate — back-office, no client sees them.

---

## When you walk into a showroom

`pnpm new-prospect <slug> "Business Name" "বাংলা নাম"` → one JSON file → his whole website at
`/for/<slug>`. Then warm `/pitch?for=<slug>` on wifi at home until it says cached ✓, and it
works offline inside the concrete building on CDA Avenue.
