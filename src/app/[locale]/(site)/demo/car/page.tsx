import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConfiguratorRoot } from '@/components/configurator/ConfiguratorRoot';
import { DemoStage } from '@/components/frame/DemoStage';
import { getDictionary } from '@/lib/i18n';
import { isLocale } from '@/lib/i18n/config';
import { getVehicleBySegment } from '@/lib/vehicles';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: raw } = await params;
  const dict = getDictionary(isLocale(raw) ? raw : 'bn');
  return { title: dict.nav.demoCar, description: dict.twoProducts.newBody };
}

export default async function CarDemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  await params;
  const { c } = await searchParams;
  const vehicle = getVehicleBySegment('car');
  if (!vehicle) notFound();

  return (
    <DemoStage>
      <ConfiguratorRoot vehicle={vehicle} initialSelection={c} fullHeight />
    </DemoStage>
  );
}
