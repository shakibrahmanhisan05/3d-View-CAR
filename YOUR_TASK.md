# YOUR_TASK.md — what Hisan does right now

> Claude keeps this file up to date. Whenever you come back, **read this file first.**
> It only ever contains things *you* have to do — Claude handles the code.
> Last updated: **2026-08-22** (the visual rebuild — "The Bay, framed")

---

## Look at these, in this order

The site works exactly as it did. What changed is that it now *sells*. Open it on your phone
first, then on a laptop, and walk down this list.

1. **The first two seconds.** The screen closes like a pair of cinema curtains while the car
   is actually being downloaded — the bar underneath is real progress, not a decoration — and
   then the curtains part onto the car. If your connection is bad, a "go straight in" link
   appears after 2½ seconds, and the site opens by itself after 7 no matter what.
2. **The hero.** The car now sits *inside a screen* — a rounded frame with a warm glow behind
   it and its own model code, `SDG-1500`, painted enormous behind the bodywork. The roof of
   the car passes in front of the letters. That is the whole difference between "a 3D car on a
   website" and "a car in a showroom".
3. **Tap a paint chip and watch the words.** This is the one to show a client. The chips are
   half again bigger than before, and when you pick a colour **the site's text changes with
   it** — the giant code behind the car, the section labels, the headline shading, the paint
   name. Pick Racing Blue and the whole page goes blue. Pick Attitude Black and it goes cool
   grey. Every one of them was checked to stay readable; none of them can turn the text
   invisible.
4. **The bottom of the hero.** Two facts at a size you can read from the third row of a
   showroom — the base price, and the paint's real manufacturer name. The model code in the
   middle. A small card bottom-right with the car from another angle and an orange button into
   the full configurator.
5. **The five dots on the left** (laptop only). One per section. Click one to jump; the lit one
   always tells you where you are.
6. **Scroll.** Each section now shows you *one* thing and shows it big: a sentence arriving
   from the side, a shelf of demos with pictures on the tabs, a giant **A** and **B**, the ROI
   number at nearly twice its old size and stamped like a form, an empty case study that reads
   as *reserved* rather than broken, and prices where the ladder is in the **width** of the
   cards, not a "most popular" sticker.
7. **`/demo/car`, `/demo/bike`, `/demo/360`.** Same frame as the hero. The running total is
   now a big number in the bay next to the car, and there is a WhatsApp button down there too
   so it is never more than a thumb away. On the 360°, the auction grade is a stamp you can
   read across a desk.
8. **`/contact`.** One sheet of paper with a rule down the middle, a form on the left with
   ruled lines instead of boxes, your number on the right at headline size, and a `FORM A`
   stamp at the foot.

**Nothing about your commercial decisions moved.** Prices are the same, in ৳, one-time. Bangla
is still the default. Every button still ends at WhatsApp. There is still no "most popular"
badge and no invented case study.

**Two things to tell me:**

- The sentence under the model code in the hero ("আপনার শোরুমের গাড়িটাই, ক্রেতার ফোনে…") is my
  wording. Read it aloud and change it if it does not sound like you.
- The header now hides the menu behind an index button at every screen size, so the masthead
  stays quiet over the car. If you would rather have the links always visible on a laptop, say
  so — it is a ten-minute change.

---

## You were right — they were crushed. The new models fixed it.

**The problem was mine, not the models'.** The first pair arrived as one solid lump, sixteen
times heavier than the site can carry, so I cut them down from 1.9 million triangles to
260,000. That cutting is what crushed them. A showroom owner would have rejected that on
sight and you were right to.

**Your new models needed none of that.** They arrive already built as separate parts — 56 for
the car, 102 for the bike — and already light enough. So I now ship **every single triangle
exactly as it came out of Tripo. Nothing is cut. Nothing is smoothed. Nothing is crushed.**

| | Car | Bike |
|---|---|---|
| Triangles shipped | 110,719 — **100% of the source** | 116,245 — **100% of the source** |
| Download size | 1.9 MB | 2.2 MB |

What I did do, none of which touches shape:

- **Named the parts** so the configurator knows which pieces are paint. Tap a colour chip and
  all 23 painted panels change together — bonnet, roof, all four doors, wings, bumpers, boot.
- **Removed the Toyota badge and the fake number plate**, by painting them out of their own
  textures rather than cutting geometry. The grille keeps its slats; the plate is now blank.
  Your AI licence covers the model you generated — it does not cover Toyota's trademark.
- **The bike had no badge**, so nothing to remove there.

## Smooth scrolling

Two things were making the page feel heavy, and both are fixed:

- The 3D car was **drawing 60 times a second for the entire length of the page**, even after
  you scrolled past it, and even when the browser tab was in the background. It now stops the
  instant it leaves the screen and restarts when it comes back. This is the scrolling fix.
- The quality system used to check the frame rate **once** and only react if the phone dropped
  below 25fps. It now watches continuously and aims at **60fps**, quietly trading a little
  resolution to hold it and taking it back when there is room to spare.

**One honest caveat:** I could not measure the frame rate here. The browser I test through
runs in a hidden window where the frame timer never ticks, so a measurement just hangs. The
changes are sound engineering, but the number is unverified — **please open the site on your
actual phone and tell me if it still feels heavy.**

**Go and look at these, in this order:**

| Page | What changed |
|---|---|
| `/` | The hero car is your new model at full quality. Tap the colour chips — the **whole** car changes now, not just the bumpers. Press `মোটরসাইকেল` for the bike. |
| `/demo/car` | Colour, **rim finish** (silver/gunmetal/black/diamond cut) and interior. Look at the grille — no badge, blank plate. |
| `/demo/bike` | Colour paints the tank, tail panels and front mudguard. The exhaust still changes the engine note. |
| `/demo/360` | Re-rendered from the new car — 32 frames, drag to spin. This is the product that earns. |
| `/contact` | The "What you sell" buttons you saw as ugly squares are now proper cards. |

## One thing to be aware of

Some buttons are still **off rather than broken**, because your models do not contain the
parts they would need:

- **Spoiler / bull bar / roof rack / side steps**, and the **four different wheel designs** —
  that geometry does not exist, so those controls would have done nothing when a dealer
  pressed them. A button that does nothing in front of a client is worse than no button.
- **Window tint** — *this one I can now fix.* Your new car genuinely has glass (the old one
  had open holes). I just have not separated the glass from the cabin interior yet. Say the
  word and window tint becomes a working option — it sells well here.

`/demo/modification` still shows all of those controls, using the old stand-in car.

If you want the accessory options working on the real car too, the model needs a spoiler, a
bull bar and so on actually modelled as parts — worth asking Tripo for when you generate the
next one.

---

## The site looks completely different now. Go look at it.

You said it looked like a 90s website — no colour, no elegance, no animation. Fair. It has
been rebuilt: dark "showroom at night" styling, a gold accent, glass panels, and the car now
sits in a pool of light that runs edge to edge behind the menu. Things fade in as you scroll.

Open a terminal in the project folder and run:

```
pnpm dev
```

Then open **http://localhost:3000**. Leave it running — it updates itself as Claude changes
things.

⚠️ **Do not run `pnpm build` while `pnpm dev` is running.** It breaks the running site (all the
styling disappears). If that happens: stop `pnpm dev`, delete the `.next` folder, start again.

Worth clicking through, in this order:

| Page | What to look for |
|---|---|
| `/` | **Start here.** Tap the colour chips — the selected one lifts and gets a gold tick, and the whole car changes colour. |
| `/pricing` | The three prices are cards now. Still one-time project prices, still no "most popular" badge — that was deliberate and it stayed. |
| `/for/twenty-eight-motors` | The whole site in *their* navy instead of our red. **This is the thing that closes deals** — check the blue looks right. |
| `/demo/bike` | **Press `আওয়াজ বন্ধ` then change the exhaust — the engine note changes.** |
| `/demo/car` | Try the `আলো` buttons — গোধূলি and রাত look very different. |
| `/demo/modification` | Drag the circle in the middle left and right — before vs after, live. |
| `/demo/360` | Drag the car to spin it. Flick it and it keeps spinning. |
| `/contact` | Fixed — the "What you sell" buttons are proper cards now, and the whole form sits on one panel. |
| `/pitch` | Presentation mode for a tablet. Arrow keys move between slides. |
| `/admin` | Password is `phoenix-test-2026` for now. Your leads land here. |

A few back-office screens (`/pitch`, `/admin`, the before/after slider handle) still have the
old flat look. They work fine and no client sees them. Claude has the list.

---

## Two quick decisions ⏱ 5 min total

**A — Check it on your actual phone.** This matters more than ever now, because it is the only
way to confirm the 60fps work. Claude cannot measure frame rate in its test browser. Open the
site on your phone and check four things: does scrolling feel smooth; the car area at the top;
the row of colour chips (it should scroll sideways with your thumb); and the row of demo tabs.
**Tell Claude anything that stutters, looks squashed, is cut off, or is too small to tap.**

**B — The site is now heavier to load.** This is a real trade and it is your call, not
Claude's.

The build spec said every page should stay under 130 kB of JavaScript, because your buyer is
on a mid-range Android on mobile data. Adding the animation library and the component library
you asked for pushed it up:

| Page | Before | Now |
|---|---|---|
| Home | 128 kB | **190 kB** |
| `/for/<showroom>` | 129 kB | **190 kB** |
| The `/demo` pages | 129 kB | **139 kB** |

Claude already removed the waste — one bad import alone was costing 61 kB. What is left is the
libraries themselves. Roughly, this is about **half a second longer** on a slow connection.

Three options:

1. **Leave it.** The site looks considerably more expensive, which is what you are selling.
2. **Claw some back** — three specific things can go and it lands near 140 kB, losing the
   smooth FAQ open/close and the sliding highlight on the menu.
3. **Decide now the models are in** — this is the moment option 3 was waiting for. The home
   page also pulls a 3.0 MB car model, so open it on your phone on mobile data and see what it
   actually feels like before choosing. *That measurement beats any guess.*

**Just reply 1, 2 or 3.**

---

## Task 1 — DONE ✅ (was: download two 3D models)

You supplied two AI-generated models instead, and they are in and working — see the top of
this file. Nothing left to do here.

**One small thing I do still need from you:** save proof of your Tripo commercial licence —
a screenshot of the plan/licence page showing commercial use is included, and the date. Put it
in `docs/licence-screenshots/`. The licence checker currently warns about this on every build.
It is the only evidence we would have if a client ever asks where the models came from.


## Task 2 — Send me three real numbers ⏱ 2 min

Right now **every WhatsApp button on the site is dead**, because the number is `8801XXXXXXXXX`
and the X's aren't digits. Paste these to me:

1. Phoenix's **WhatsApp number** (with country code, like `8801712345678`)
2. Phoenix's **phone number** for the footer
3. Your **Chattogram address** (Bangla and English if you have both)

---

## Task 3 — Decide the domain name ⏱ 5 min

Needed for Google (sitemap, link previews). Something like `phoenix3d.com.bd`. Just tell me the
name — you don't have to buy it yet.

---

## Task 4 — Check the prices are right ⏱ 5 min

I've published these on `/pricing`, taken from the playbook. **Tell me if any of them are
wrong** — they're on the live site where clients will read them:

- Showroom Site — from **৳45,000** (range ৳45,000–75,000), one time
- 3D Configurator — from **৳25,000** per model (range ৳25,000–40,000)
- 360° Capture — from **৳1,200** per vehicle (range ৳1,200–2,500)
- Care plan — **৳18,000 per year**, optional

*(One judgement call I made: the playbook says ৳1,500/month for the care plan. The build spec
says never show monthly pricing, because it makes us look like a subscription company. So I
show the same money as ৳18,000/year and mark it optional. Say the word if you disagree.)*

---

## Task 5 — Ask Omlan for practice 360° photos ⏱ his job, not yours

Playbook Day 1 says he does a practice shoot. When he has them:

- **32 photos**, all the way around one vehicle, evenly spaced
- Camera on a tripod, **do not change the exposure between shots**
- Any vehicle — a friend's bike is fine

Drop the raw folder anywhere and tell me the path. The `/demo/360` page is already built and
waiting; swapping his photos in is a one-line change.

---

## Task 6 — Later, not now: engine sounds from Freesound

The exhaust note on `/demo/bike` is **generated by code**, not a recording. It works and it
changes with the exhaust, which is the part that sells. But a real recording would be better.

When you have time: go to https://freesound.org, filter to **Creative Commons 0**, and find
clean single-cylinder 150cc clips — an idle loop (~4s) and a rev (~3s) for each of stock,
slip-on and full system. Same five details as Task 1 for each one.

Not urgent. The feature is demo-ready as it is.

---

## Things you do NOT need to do

- ❌ Don't install anything. I handle npm/pnpm.
- ❌ Don't buy hosting, Cloudflare R2, or a database yet. The site runs fully without all
  three — leads currently save to a file in `.data/` and you can read them at `/admin`.
- ❌ Don't touch the code. If something looks wrong, tell me what looks wrong.
- ❌ Don't worry about the pages that still look flat. That list is written down and it is
  next after the models.
- ❌ Don't worry about the bike looking a bit odd. It's a stand-in. Task 1 replaces it.

---

## When you walk into a showroom

`pnpm new-prospect <slug> "Business Name" "বাংলা নাম"`

That creates ONE file. Fill in his WhatsApp number, his colour, his address — and
`/for/<slug>` becomes his entire website. Nothing else to edit. Takes about ten minutes.

Then open `/pitch?for=<slug>` **at home, on wifi**, and press the button in the top right until
it says `সব ফাইল ডাউনলোড হয়ে গেছে ✓`. After that the demo works with the internet switched
off — which is what you'll need inside a concrete building on CDA Avenue.
