import { resolveLocale } from "@bibi/i18n";
import { CodeIcon } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { HelpShell } from "@/components/help-shell/help-shell";
import { developerNavGroups } from "@/features/docs/server/developer-nav";
import { DOCS_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";

type DevelopersLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const locale = resolveLocale({ value: (await params).locale });
  const t = await getTranslations({ locale, namespace: "docs" });
  return { title: t("title"), description: t("description") };
}

/** Public developer docs: guides, REST and MCP reference. No session is read under `/developers`. */
export default async function DevelopersLayout({ children, params }: DevelopersLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [t, nav] = await Promise.all([
    getTranslations({ locale, namespace: "docs" }),
    developerNavGroups({ locale }),
  ]);
  return (
    <NextIntlClientProvider messages={pickSurfaceMessages({ locale, namespaces: DOCS_NAMESPACES })}>
      <HelpShell
        labels={{
          title: t("title"),
          description: t("description"),
          toggleSidebar: t("toggleSidebar"),
          signIn: t("signIn"),
        }}
        homeHref="/developers"
        icon={CodeIcon}
        nav={nav}
        crossLink={{ href: "/support", label: t("supportLink") }}
      >
        {children}
      </HelpShell>
    </NextIntlClientProvider>
  );
}
