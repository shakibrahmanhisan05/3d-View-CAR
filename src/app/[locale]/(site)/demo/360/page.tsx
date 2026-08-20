import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Viewer360 } from '@/components/capture360/Viewer360';
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import { getCaptures } from '@/lib/vehicles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : 'bn');
  return { title: dict.viewer360.title, description: dict.twoProducts.reconBody };
}

export default async function Capture360Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : 'bn');

  const capture = getCaptures()[0];
  if (!capture) notFound();

  return (
    <>
      <Section
        code={dict.viewer360.code}
        label={dict.twoProducts.reconFor}
        title={dict.viewer360.title}
        sub={dict.twoProducts.reconBody}
      >
        <p className="max-w-2xl text-sm text-ink-soft">{dict.twoProducts.honest}</p>
      </Section>

      <div className="rule-t">
        <Viewer360 capture={capture} />
      </div>
    </>
  );
}
