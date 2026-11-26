import { PageContainer, Wordmark } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { SiteActions } from "./site-actions";

export type SiteHeaderProps = { locale: string; appUrl: string };

const LINKS = [
  { id: "jobs", label: "jobs" },
  { id: "booking-page", label: "restaurant" },
  { id: "money", label: "money" },
  { id: "price", label: "price" },
] as const;

/** Transparent top bar over the hero: wordmark, section links from `md`, and the session-aware buttons. */
export async function SiteHeader({ locale, appUrl }: SiteHeaderProps) {
  const t = await getTranslations("site");
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <PageContainer className="flex items-center justify-between gap-6 py-4">
        <Wordmark size="md" aria-label={t("brand")} />
        <nav
          aria-label={t("nav.label")}
          className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex"
        >
          {LINKS.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className="rounded-sm transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {t(`nav.${label}`)}
            </a>
          ))}
        </nav>
        <SiteActions locale={locale} appUrl={appUrl} login />
      </PageContainer>
    </header>
  );
}
