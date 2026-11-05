import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { type PipelineSearch, readPipelineSearch } from "@/features/pipeline/lib/pipeline-href";
import { PipelinePage } from "@/features/pipeline/ui/pipeline-page";
import { pageTitle } from "@/lib/page-metadata";

type PipelineRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PipelineSearch>;
};

export async function generateMetadata({ params }: PipelineRouteProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "pipeline" });
}

/** The pipeline board of orders by phase (ADR 0041, 0043, 0067); `?board=` and `?mode=customize`. */
export default async function PipelineRoute({ params, searchParams }: PipelineRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { boardId, customize } = readPipelineSearch({ search: await searchParams });
  return <PipelinePage locale={locale} boardId={boardId} customize={customize} />;
}
