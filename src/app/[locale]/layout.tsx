/**
 * ROOT LAYOUT.
 */

import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import { BrandProvider, PHOENIX_BRAND } from '@/components/brand/BrandProvider';
import { DictionaryProvider } from '@/components/i18n/DictionaryProvider';
import { MotionProvider } from '@/components/motion/MotionProvider';
import { fontVariables } from '@/lib/fonts';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, HTML_LANG, isLocale, LOCALES } from '@/lib/i18n/config';
import { SITE_URL } from '@/lib/site';
import type { Locale } from '@/lib/types';
import '../globals.css';

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export const viewport: Viewport = {
  themeColor: '#0E1113',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: locale === 'bn' ? 'Phoenix — 3D ভেহিকেল শোরুম ওয়েবসাইট | চট্টগ্রাম' : 'Phoenix — 3D Vehicle Showroom Websites | Chattogram',
      template: `%s · Phoenix`,
    },
    description: locale === 'bn' 
      ? 'আপনার শোরুম রাত ২টায়ও খোলা। লাইভ 3D কনফিগারেটর এবং ৩৬০° রিয়েল-ভেহিকেল ক্যাপচার — চট্টগ্রামের গাড়ি ও মোটরসাইকেল শোরুমের জন্য।' 
      : 'Your showroom, open at 2am. Live 3D configurators and 360° real-vehicle capture for Chattogram dealers.',
    alternates: {
      canonical: locale === DEFAULT_LOCALE ? '/' : `/${locale}`,
      languages: { 'en-GB': '/', 'bn-BD': '/bn' },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_GB' : 'bn_BD',
      siteName: 'Phoenix 3D Showrooms',
      title: 'Phoenix — 3D Vehicle Showrooms, Chattogram',
      description: 'Your showroom, open at 2am. Live 3D configurators and 360° real-vehicle capture for Chattogram dealers.',
    },
    formatDetection: { telephone: false },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  if (!isLocale(raw)) notFound();
  const locale: Locale = raw;
  const dict = getDictionary(locale);

  return (
    <html lang={HTML_LANG[locale]} className={fontVariables}>
      <body className="bg-[#0E1113] text-[#EDF0F2] antialiased">
        {/* FIXED WORKSHOP BACKGROUND */}
        <div id="site-bg" aria-hidden="true">
          <div className="bg-grid"></div>
          <div className="bg-ruler"></div>
          <div className="bg-ruler right"></div>

          <div className="bg-schema schema-car">
            <svg viewBox="0 0 860 340" fill="none" stroke="rgba(150,180,210,.10)" strokeWidth="1.4">
              <path d="M60 250 L110 248 C130 200 170 168 250 158 L330 150 C370 112 430 92 500 92 L560 94 C620 98 660 120 690 156 L760 168 C790 176 805 196 806 226 L804 250 L790 252"/>
              <path d="M250 158 L262 250 M560 96 L570 156 M690 156 L676 250"/>
              <path d="M336 150 C372 118 428 100 496 100 L552 102 C598 106 632 122 660 152 L338 152 Z" strokeDasharray="4 5"/>
              <circle cx="210" cy="252" r="44"/><circle cx="210" cy="252" r="27"/><circle cx="210" cy="252" r="7"/>
              <circle cx="648" cy="252" r="44"/><circle cx="648" cy="252" r="27"/><circle cx="648" cy="252" r="7"/>
              <path d="M210 208 L210 296 M166 252 L254 252 M648 208 L648 296 M604 252 L692 252" strokeDasharray="2 4"/>
              <path d="M60 296 L806 296" strokeDasharray="6 6"/>
              <path d="M110 296 L110 316 M760 296 L760 316 M110 310 L760 310"/>
              <path d="M420 60 L420 92" strokeDasharray="2 3"/>
              <text x="404" y="52" fontFamily="monospace" fontSize="11" fill="rgba(150,180,210,.16)" stroke="none">R-1420</text>
              <text x="410" y="330" fontFamily="monospace" fontSize="11" fill="rgba(150,180,210,.16)" stroke="none">WB 2 620</text>
            </svg>
          </div>

          <div className="bg-schema schema-bike">
            <svg viewBox="0 0 620 320" fill="none" stroke="rgba(150,180,210,.10)" strokeWidth="1.4">
              <circle cx="130" cy="240" r="56"/><circle cx="130" cy="240" r="34"/><circle cx="130" cy="240" r="8"/>
              <circle cx="480" cy="240" r="56"/><circle cx="480" cy="240" r="34"/><circle cx="480" cy="240" r="8"/>
              <path d="M130 240 L235 160 L330 150 C360 118 380 104 420 96 L448 120 L480 240"/>
              <path d="M235 160 L280 240 L330 150 M280 240 L390 208 L480 240"/>
              <path d="M448 120 L500 92 M420 96 L438 66 M438 66 L472 58" />
              <path d="M300 132 C330 112 366 104 396 108 L392 134 C360 128 330 130 306 142 Z" strokeDasharray="4 5"/>
              <path d="M130 184 L130 296 M74 240 L186 240 M480 184 L480 296 M424 240 L536 240" strokeDasharray="2 4"/>
              <path d="M60 302 L560 302" strokeDasharray="6 6"/>
              <text x="256" y="86" fontFamily="monospace" fontSize="11" fill="rgba(150,180,210,.16)" stroke="none">FR-155</text>
              <text x="268" y="318" fontFamily="monospace" fontSize="11" fill="rgba(150,180,210,.16)" stroke="none">WB 1 335</text>
            </svg>
          </div>

          <div className="bg-anno v" style={{ left: '44px', top: '18%' }}>CHATTOGRAM — 22.3569 N · 91.7832 E</div>
          <div className="bg-anno v" style={{ right: '44px', top: '40%' }}>SHEET NO. PHX-2026-001 — REV C</div>
          <div className="bg-anno" style={{ left: '8%', top: '44%' }}>GRADE 4.5 — INSPECTED</div>
          <div className="bg-anno" style={{ right: '10%', bottom: '24%' }}>SCALE 1:24 — ALL DIMS MM</div>
          <div className="bg-vin">PHX·CTG·2026 — DRAWN: HISAN — CHECKED: TASFIA — APPROVED: PHOENIX STUDIO</div>
          <div className="bg-noise"></div>
        </div>

        {/* BOOT / LAZY LOADING SCREEN */}
        <div id="boot" role="status" aria-live="polite">
          <div className="boot-inner">
            <div className="boot-mark">
              <svg viewBox="0 0 32 32"><path className="flame" d="M16 2c2 6-6 8-6 15a6 6 0 0012 0c0-3-2-4-2-7 3 2 5 5 5 8A9 9 0 017 18C7 9 14 8 16 2z" fill="#FF4D1C"/></svg>
              <div>
                <div className="boot-word">PHOENIX</div>
                <div className="boot-sub">3D Vehicle Showrooms — Chattogram</div>
              </div>
            </div>

            <div className="boot-row">
              <div className="boot-label"><b className="i18n" data-bn="সেডান মডেল লোড হচ্ছে" data-en="Loading sedan model">সেডান মডেল লোড হচ্ছে</b><span id="bt-car" className="mono">0.0 MB / 31.2 MB</span></div>
              <div className="boot-bar" id="bb-car"><i></i></div>
            </div>
            <div className="boot-row">
              <div className="boot-label"><b className="i18n" data-bn="মোটরসাইকেল মডেল লোড হচ্ছে" data-en="Loading motorcycle model">মোটরসাইকেল মডেল লোড হচ্ছে</b><span id="bt-bike" className="mono">0.0 MB / 32.1 MB</span></div>
              <div className="boot-bar" id="bb-bike"><i></i></div>
            </div>
            <div className="boot-row">
              <div className="boot-label"><b className="i18n" data-bn="3D ইঞ্জিন ও স্টুডিও লাইটিং" data-en="3D engine and studio lighting">3D ইঞ্জিন ও স্টুдио লাইটিং</b><span id="bt-eng" className="mono">STANDBY</span></div>
              <div className="boot-bar" id="bb-eng"><i></i></div>
            </div>

            <p className="boot-tip i18n" data-bn="ফুল-রেজোলিউশন শোরুম মডেল লোড হচ্ছে — প্রতিটি প্যানেল, প্রতিটি পার্ট আলাদাভাবে ইন্টারঅ্যাকটিভ।" data-en="Full-resolution showroom models loading — every panel, every part individually interactive.">ফুল-রেজোলিউশন শোরুম মডেল লোড হচ্ছে — প্রতিটি প্যানেল, প্রতিটি পার্ট আলাদাভাবে ইন্টারঅ্যাকটিভ।</p>

            <div className="boot-foot">
              <span>ASSET REG: PHX-GLB-01 / PHX-GLB-02</span>
              <span id="bt-total" className="mono">0%</span>
            </div>
          </div>
        </div>

        {/* ASSET CREDITS MODAL */}
        <div id="credits-modal" role="dialog" aria-modal="true" aria-label="Asset credits">
          <div className="cm">
            <button className="cm-x" id="credits-x" aria-label="Close">✕</button>
            <h3>ASSET MANIFEST — LICENCE REGISTER</h3>
            <table>
              <tbody>
                <tr><td className="mono">PHX-GLB-01</td><td>Generic mid-size sedan, 3D model (client-supplied asset, full resolution, 65 separable parts)</td><td className="mono">LICENSED</td></tr>
                <tr><td className="mono">PHX-GLB-02</td><td>Generic naked commuter motorcycle, 3D model (client-supplied asset, full resolution, 53 separable parts)</td><td className="mono">LICENSED</td></tr>
                <tr><td className="mono">PHX-ENV-01</td><td>Studio lighting environment — procedurally generated in-engine (RoomEnvironment)</td><td className="mono">ORIGINAL</td></tr>
                <tr><td className="mono">PHX-SND-01</td><td>Engine / exhaust audio — synthesized in-browser via Web Audio API</td><td className="mono">ORIGINAL</td></tr>
                <tr><td className="mono">PHX-TYP-01</td><td>Hind Siliguri, Archivo, JetBrains Mono — Google Fonts</td><td className="mono">OFL 1.1</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <BrandProvider brand={PHOENIX_BRAND}>
          <MotionProvider>{children}</MotionProvider>
        </BrandProvider>
      </body>
    </html>
  );
}
