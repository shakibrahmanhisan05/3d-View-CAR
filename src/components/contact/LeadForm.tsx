'use client';

/**
 * Lead form → WhatsApp (§4 /contact).
 *
 * Every lead path on this site ends in WhatsApp (§1). The form posts to /api/lead so nothing
 * is lost, then opens wa.me with the enquiry already written out — so the owner's next action
 * is pressing send, not composing a message.
 *
 * If the POST fails we STILL open WhatsApp. Losing our copy of a lead is an inconvenience;
 * blocking a dealer from reaching us because our storage hiccuped is a lost deal.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useBrand } from '@/components/brand/BrandProvider';
import { useDict, useLocale } from '@/components/i18n/DictionaryProvider';
import { Button } from '@/components/ui/button';
import { whatsappUrl } from '@/lib/site';
import type { LeadInput } from '@/lib/validation';
import { cn } from '@/lib/utils';

/*
 * VALIDATION IS DELIBERATELY NOT ZOD ON THE CLIENT.
 *
 * The server route validates with `leadSchema` and remains the authority. Shipping zod plus
 * @hookform/resolvers to the browser purely to pre-check four fields cost ~20 kB gzipped on
 * the two highest-value routes on the site — /contact and /for/[slug] — against a 130 kB
 * budget (§14). React Hook Form's own rules express exactly the same constraints for nothing.
 *
 * The mobile pattern must stay in step with BD_MOBILE in src/lib/validation.ts.
 */
const BD_MOBILE = /^(?:\+?880|0)1[3-9]\d{8}$/;

export function LeadForm({ source }: { source?: string }) {
  const dict = useDict();
  const locale = useLocale();
  const brand = useBrand();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadInput>({
    mode: 'onBlur',
    defaultValues: { segment: 'bike', locale, source: source ?? '' },
  });

  const segments: Array<[LeadInput['segment'], string]> = [
    ['car', dict.contact.segmentCar],
    ['bike', dict.contact.segmentBike],
    ['mod', dict.contact.segmentMod],
    ['recon', dict.contact.segmentRecon],
  ];

  const onSubmit = handleSubmit(async (values) => {
    setStatus('sending');

    const segmentLabel = segments.find(([id]) => id === values.segment)?.[1] ?? values.segment;
    const message = [
      locale === 'bn' ? 'আসসালামু আলাইকুম।' : 'Hello —',
      '',
      `${dict.contact.name}: ${values.name}`,
      `${dict.contact.business}: ${values.business}`,
      `${dict.contact.phone}: ${values.phone}`,
      `${dict.contact.segment}: ${segmentLabel}`,
      values.message ? `\n${values.message}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    let stored = true;
    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...values, source: source ?? undefined }),
      });
      stored = response.ok;
    } catch {
      stored = false;
    }

    setStatus(stored ? 'sent' : 'error');
    // Opened regardless of `stored` — see the note at the top of this file.
    window.open(whatsappUrl(brand.whatsapp, message), '_blank', 'noopener,noreferrer');
  });

  if (status === 'sent') {
    return (
      <div className="surface lit-edge max-w-xl overflow-hidden p-6 shadow-elev sm:p-8">
        <span className="sheet-code sheet-code-accent">OK</span>
        <p className="display mt-3 text-2xl font-700">{dict.contact.successTitle}</p>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{dict.contact.successBody}</p>
        <a
          href={whatsappUrl(brand.whatsapp, locale === 'bn' ? 'আসসালামু আলাইকুম।' : 'Hello —')}
          target="_blank"
          rel="noopener noreferrer"
          className="num mt-5 inline-flex items-center gap-2 rounded-lg border border-glass-border bg-glass px-4 py-2.5 text-sm text-ink transition-colors hover:border-[var(--ph-glass-border-lit)] hover:text-accent-gold"
        >
          {brand.phone}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface lit-edge max-w-xl p-5 shadow-elev sm:p-7" noValidate>
      <input type="hidden" {...register('locale')} value={locale} />
      <input type="hidden" {...register('source')} value={source ?? ''} />

      <Field label={dict.contact.name} error={errors.name ? dict.contact.errorName : undefined}>
        {(id, invalid) => (
          <input
            id={id}
            className="field"
            autoComplete="name"
            aria-invalid={invalid}
            {...register('name', { required: true, minLength: 2, maxLength: 80 })}
          />
        )}
      </Field>

      <Field label={dict.contact.business} error={errors.business ? dict.contact.errorBusiness : undefined}>
        {(id, invalid) => (
          <input
            id={id}
            className="field"
            autoComplete="organization"
            aria-invalid={invalid}
            {...register('business', { required: true, minLength: 2, maxLength: 120 })}
          />
        )}
      </Field>

      <Field label={dict.contact.phone} error={errors.phone ? dict.contact.errorPhone : undefined}>
        {(id, invalid) => (
          <input
            id={id}
            className="field num"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01712345678"
            aria-invalid={invalid}
            {...register('phone', {
              required: true,
              setValueAs: (value: string) => value.trim().replace(/[\s-]/g, ''),
              pattern: BD_MOBILE,
            })}
          />
        )}
      </Field>

      {/*
        The segmented control speaks the same language as the paint chips and the demo tab
        rail: the chosen card lifts, takes a champagne edge and carries a gold tick. It used
        to be four square buttons whose active state was a flat white fill, which on the
        Obsidian ground read as a disabled control rather than a chosen one.
      */}
      <fieldset className="py-4">
        <legend className="text-sm text-ink-soft">{dict.contact.segment}</legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {segments.map(([value, label]) => (
            <label
              key={value}
              className={cn(
                'tap group relative flex cursor-pointer items-center justify-center rounded-xl border px-3 py-3 text-center text-sm',
                'border-glass-border bg-glass text-ink-soft transition-all duration-200 ease-out',
                'hover:-translate-y-0.5 hover:border-[var(--ph-glass-border-lit)] hover:text-ink',
                'has-[:checked]:-translate-y-1 has-[:checked]:border-[color-mix(in_oklab,var(--ph-accent)_60%,transparent)]',
                'has-[:checked]:bg-accent-sunk has-[:checked]:text-accent-gold has-[:checked]:shadow-glow-gold',
                'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--ph-accent)]',
              )}
            >
              <input type="radio" value={value} className="sr-only" {...register('segment')} />
              {label}
              <span
                aria-hidden="true"
                className="absolute -right-1.5 -top-1.5 hidden size-4 items-center justify-center rounded-full bg-accent-gold text-[0.55rem] font-700 leading-none text-paper shadow-elev group-has-[:checked]:flex"
              >
                ✓
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <Field label={dict.contact.message}>
        {(id) => <textarea id={id} rows={4} className="field" {...register('message', { maxLength: 1000 })} />}
      </Field>

      {status === 'error' ? (
        <p role="alert" className="mt-4 rounded-lg border border-[color-mix(in_oklab,var(--ph-signal)_45%,transparent)] bg-[color-mix(in_oklab,var(--ph-signal)_12%,transparent)] px-3 py-2.5 text-sm">
          <span className="font-600 text-signal-lit">{dict.contact.errorTitle}</span>{' '}
          <span className="text-ink-soft">{dict.contact.errorBody}</span>
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" disabled={status === 'sending'} className="mt-6 w-full">
        {status === 'sending' ? dict.contact.submitting : dict.contact.submit}
      </Button>

      <p className="mt-3 text-center text-xs text-alu">{dict.contact.privacy}</p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: (id: string, invalid: boolean) => React.ReactNode;
}) {
  const id = label.replace(/\W+/g, '-').toLowerCase();

  return (
    <div className="py-2.5">
      <label htmlFor={id} className="block text-sm text-ink-soft">
        {label}
      </label>
      <div className="mt-1.5">{children(id, Boolean(error))}</div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-signal-lit">
          {error}
        </p>
      ) : null}
    </div>
  );
}
