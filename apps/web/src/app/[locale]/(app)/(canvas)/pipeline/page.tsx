import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PipelinePage } from "@/features/pipeline/ui/pipeline-page";

type PipelineRouteProps = { params: Promise<{ locale: string }> };

/** The pipeline board of inquiries and bookings (ADR 0041). */
export default async function PipelineRoute({ params }: PipelineRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <PipelinePage locale={locale} />;
}
