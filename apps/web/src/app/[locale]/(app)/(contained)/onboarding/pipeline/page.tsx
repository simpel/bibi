import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { PipelineSetupPage } from "@/features/pipeline-setup/ui/pipeline-setup-page";

type PipelineSetupRouteProps = { params: Promise<{ locale: string }> };

export default async function PipelineSetupRoute({ params }: PipelineSetupRouteProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return <PipelineSetupPage locale={locale} />;
}
