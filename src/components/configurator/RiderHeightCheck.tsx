'use client';

/**
 * Rider height check (§6.2).
 *
 * Seat-height anxiety is a genuine, near-universal purchase objection for motorcycles in
 * this market, and almost nobody addresses it online. A scaled 2D silhouette and a one-line
 * verdict is all it takes — no rigged 3D character, no extra payload. Cheap to build,
 * disproportionately memorable in a pitch.
 *
 * The arithmetic is deliberately conservative. Inseam is taken as 0.45 × height (the low end
 * of the usual 0.45–0.47 range) and the seat compresses ~25 mm under a rider. Over-claiming
 * "both feet flat" to a man who then can't reach the ground in the showroom loses the deal
 * and the reference.
 */

import { useId, useState } from 'react';
import { useDict } from '@/components/i18n/DictionaryProvider';

const HEIGHTS = [
  { id: '5-2', cm: 157, label: `5'2"`, bn: '৫ ফুট ২' },
  { id: '5-5', cm: 165, label: `5'5"`, bn: '৫ ফুট ৫' },
  { id: '5-8', cm: 173, label: `5'8"`, bn: '৫ ফুট ৮' },
  { id: '6-0', cm: 183, label: `6'0"`, bn: '৬ ফুট ০' },
] as const;

const INSEAM_RATIO = 0.45;
const SEAT_SAG_MM = 25;

type Verdict = 'flat' | 'ball' | 'tiptoe';

function verdictFor(heightCm: number, seatHeightMm: number): Verdict {
  const inseamMm = heightCm * 10 * INSEAM_RATIO;
  const effectiveSeatMm = seatHeightMm - SEAT_SAG_MM;
  const reach = inseamMm / effectiveSeatMm;

  if (reach >= 1.0) return 'flat';
  if (reach >= 0.92) return 'ball';
  return 'tiptoe';
}

export function RiderHeightCheck({ seatHeightMm }: { seatHeightMm: number }) {
  const dict = useDict();
  const groupId = useId();
  const [heightId, setHeightId] = useState<string>('5-5');

  const rider = HEIGHTS.find((entry) => entry.id === heightId) ?? HEIGHTS[1];
  const verdict = verdictFor(rider.cm, seatHeightMm);

  const verdictText: Record<Verdict, string> = {
    flat: dict.configurator.feetFlat,
    ball: dict.configurator.feetBall,
    tiptoe: dict.configurator.feetTiptoe,
  };

  return (
    <section className="rule-b px-4 py-5 sm:px-5">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-sm font-600">{dict.configurator.riderHeight}</span>
        <span className="sheet-code">OPT-FIT</span>
      </div>
      <p className="mb-3 text-xs text-ink-soft">{dict.configurator.riderHeightHelp}</p>

      <div role="radiogroup" aria-label={dict.configurator.riderHeight} className="flex gap-px bg-rule">
        {HEIGHTS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={heightId === entry.id}
            id={`${groupId}-${entry.id}`}
            onClick={() => setHeightId(entry.id)}
            className={`num tap flex-1 px-1 text-xs ${
              heightId === entry.id ? 'bg-ink text-paper' : 'bg-paper-raised hover:bg-paper-sunk'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-end gap-4">
        <RiderSilhouette verdict={verdict} />

        <div className="min-w-0 flex-1">
          <p className="sheet-code">{dict.configurator.seatHeight}</p>
          <p className="num text-lg">{seatHeightMm} mm</p>
          <p
            className={`mt-2 inline-block border px-2 py-1 text-xs font-600 ${
              verdict === 'flat'
                ? 'border-ink text-ink'
                : verdict === 'ball'
                  ? 'border-alu text-ink-soft'
                  : 'border-signal text-signal'
            }`}
            aria-live="polite"
          >
            {verdictText[verdict]}
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * Seated rider against the seat line. The leg angle is the only thing that changes, because
 * the leg angle is the only thing the buyer is actually asking about.
 */
function RiderSilhouette({ verdict }: { verdict: Verdict }) {
  // Foot y position relative to the ground line at y=104: flat sits on it, tiptoe hangs.
  const footY = verdict === 'flat' ? 104 : verdict === 'ball' ? 99 : 92;
  const kneeX = verdict === 'flat' ? 44 : verdict === 'ball' ? 47 : 50;

  return (
    <svg viewBox="0 0 96 112" className="h-28 w-24 shrink-0" role="img" aria-hidden="true">
      {/* Ground */}
      <line x1="4" y1="104" x2="92" y2="104" stroke="var(--ph-rule-strong)" strokeWidth="1" />
      {/* Seat block */}
      <rect x="14" y="58" width="40" height="9" fill="var(--ph-alu)" />
      <line x1="14" y1="67" x2="54" y2="67" stroke="var(--ph-rule-strong)" strokeWidth="1" />
      {/* Rider */}
      <circle cx="34" cy="26" r="7" fill="var(--ph-ink)" />
      <path d="M34 34 L34 58" stroke="var(--ph-ink)" strokeWidth="6" strokeLinecap="round" />
      <path d="M34 40 L54 46" stroke="var(--ph-ink)" strokeWidth="4" strokeLinecap="round" />
      <path
        d={`M34 58 L${kneeX} 78 L${kneeX - 6} ${footY}`}
        stroke="var(--ph-ink)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${kneeX - 6} ${footY} L${kneeX + 4} ${footY}`}
        stroke={verdict === 'tiptoe' ? 'var(--ph-signal)' : 'var(--ph-ink)'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Gap marker when the foot does not reach */}
      {verdict !== 'flat' ? (
        <line
          x1={kneeX - 1}
          y1={footY + 3}
          x2={kneeX - 1}
          y2="103"
          stroke="var(--ph-signal)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      ) : null}
    </svg>
  );
}
