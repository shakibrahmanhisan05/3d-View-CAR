import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Viewer360 } from '@/components/capture360/Viewer360';
import { Frame } from '@/components/frame/Frame';
import { Section } from '@/components/sheet/Section';
import { getDictionary } from '@/lib/i18n';
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config';
import { getCaptures } from '@/lib/vehicles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);
  return { title: dict.viewer360.title, description: dict.twoProducts.reconBody };
}

export default async function Capture360Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : DEFAULT_LOCALE);

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

      {/* The same cinema container as the hero and the configurator (§10). */}
      <div className="pb-16">
        <Frame letterbox={false} shellClassName="shadow-elev-lg">
          <Viewer360 capture={capture} />
        </Frame>
      </div>
    </>
  );
}
