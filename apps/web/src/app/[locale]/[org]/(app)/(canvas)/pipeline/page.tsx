import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import { type PipelineSearch, readPipelineSearch } from "@/features/pipeline/lib/pipeline-href";
import { PipelinePage } from "@/features/pipeline/ui/pipeline-page";

type PipelineRouteProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<PipelineSearch>;
};

/** The pipeline board of tickets by phase (ADR 0041, 0043, 0067); `?board=` and `?mode=customize`. */
export default async function PipelineRoute({ params, searchParams }: PipelineRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { boardId, customize } = readPipelineSearch({ search: await searchParams });
  return <PipelinePage locale={locale} boardId={boardId} customize={customize} />;
}
