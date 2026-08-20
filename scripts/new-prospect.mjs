/**
 * pnpm new-prospect <slug> "Business Name" [bn name]
 *
 * Scaffolds `data/prospects/<slug>.json` (§10). That file is the ONLY thing that has to be
 * edited to produce a complete branded demo at /for/<slug> — if you ever find yourself
 * touching a component to brand a prospect, the abstraction has broken and it needs fixing,
 * not working around.
 *
 * The demo window defaults to 14 days from today. Playbook §7.3: the free build being taken
 * and never converted is a ~40% failure mode, and the countermeasure is that the demo comes
 * down or converts. The date is not decoration.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const [slugArg, nameArg, bnArg] = process.argv.slice(2);

if (!slugArg) {
  console.error(`
  Usage: pnpm new-prospect <slug> "Business Name" ["বাংলা নাম"]

  Example:
    pnpm new-prospect nm-honda "NM Honda Center" "এনএম হোন্ডা সেন্টার"
`);
  process.exit(1);
}

const slug = slugArg
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

const root = process.cwd();
const dir = join(root, 'data', 'prospects');
const file = join(dir, `${slug}.json`);

if (existsSync(file)) {
  console.error(`\n  data/prospects/${slug}.json already exists. Edit it, or pick another slug.\n`);
  process.exit(1);
}

const englishName = nameArg ?? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const banglaName = bnArg ?? englishName;

const expires = new Date();
expires.setDate(expires.getDate() + 14);

// Default the vehicle list to whatever actually exists, so the scaffold renders immediately
// rather than 404-ing on an id somebody has to go and look up.
const vehicleDir = join(root, 'data', 'vehicles');
const vehicles = existsSync(vehicleDir)
  ? readdirSync(vehicleDir)
      .filter((name) => name.endsWith('.json'))
      .map((name) => JSON.parse(readFileSync(join(vehicleDir, name), 'utf8')))
  : [];

const bike = vehicles.find((vehicle) => vehicle.segment === 'motorcycle');
const car = vehicles.find((vehicle) => vehicle.segment === 'car');

const prospect = {
  slug,
  businessName: { bn: banglaName, en: englishName },
  logoUrl: undefined,
  brandAccent: '#C0261B',
  whatsapp: '8801XXXXXXXXX',
  phone: '+8801XXXXXXXXX',
  address: { bn: 'চট্টগ্রাম', en: 'Chattogram' },
  segment: 'motorcycle',
  heroVehicleId: bike?.id ?? car?.id ?? '',
  vehicleIds: [bike?.id, car?.id].filter(Boolean),
  expiresAt: expires.toISOString().slice(0, 10),
  ownerName: '',
};

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
writeFileSync(file, `${JSON.stringify(prospect, (_, value) => (value === undefined ? undefined : value), 2)}\n`, 'utf8');

console.log(`
  Created data/prospects/${slug}.json

  Fill in, in this order — the first two are what make the demo close:
    1. whatsapp / phone   HIS number, so a lead lands on HIS handset during the meeting
    2. brandAccent        his colour; it retints the entire site from this one field
    3. businessName.bn    how he writes it himself, in Bangla
    4. address            for the header and the footer
    5. segment            'motorcycle' | 'car' | 'modification' — decides which demo opens first
    6. heroVehicleId      his bestselling model
    7. logoUrl            optional

  Then open:  http://localhost:3000/for/${slug}
  Live until: ${prospect.expiresAt}
`);
