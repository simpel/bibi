import { PageContainer, Wordmark } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { SiteActions } from "./site-actions";

export type SiteHeaderProps = { locale: string; appUrl: string };

const LINKS = [
  { id: "how", label: "how" },
  { id: "features", label: "features" },
  { id: "integrations", label: "integrations" },
] as const;

/** Transparent top bar over the hero glow: wordmark, section links from `md`, and the session-aware buttons. */
export async function SiteHeader({ locale, appUrl }: SiteHeaderProps) {
  const t = await getTranslations("site");
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <PageContainer className="flex items-center justify-between gap-6 py-4">
        <Wordmark size="md" aria-label={t("brand")} />
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          {LINKS.map(({ id, label }) => (
            <a key={id} href={`#${id}`} className="transition-colors hover:text-foreground">
              {t(`nav.${label}`)}
            </a>
          ))}
        </nav>
        <SiteActions locale={locale} appUrl={appUrl} />
      </PageContainer>
    </header>
  );
}
