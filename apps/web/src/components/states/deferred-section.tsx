import { SectionSkeleton } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { type ReactNode, Suspense } from "react";

export type DeferredSectionProps = { children: ReactNode; rows?: number };

/**
 * A detail page section that streams in after the header: its own data loads inside the
 * boundary, so a slow section never holds back the rest of the page.
 */
export async function DeferredSection({ children, rows }: DeferredSectionProps) {
  const t = await getTranslations("common");
  return (
    <Suspense fallback={<SectionSkeleton label={t("loading")} rows={rows} />}>{children}</Suspense>
  );
}
