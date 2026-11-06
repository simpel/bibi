import { resolveLocale } from "@bibi/i18n";
import { LifeBuoyIcon } from "lucide-react";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { HelpShell } from "@/components/help-shell/help-shell";
import { guideNavGroups } from "@/features/support/server/support-nav";
import { DOCS_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";

type SupportLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Public help for staff: questions and guides. No session is read anywhere under `/support`. */
export default async function SupportLayout({ children, params }: SupportLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const [t, nav] = await Promise.all([
    getTranslations({ locale, namespace: "support" }),
    guideNavGroups({ locale }),
  ]);
  return (
    <NextIntlClientProvider messages={pickSurfaceMessages({ locale, namespaces: DOCS_NAMESPACES })}>
      <HelpShell
        labels={{
          title: t("navTitle"),
          description: t("navDescription"),
          toggleSidebar: t("toggleSidebar"),
          signIn: t("signIn"),
        }}
        homeHref="/support"
        icon={LifeBuoyIcon}
        nav={nav}
        crossLink={{ href: "/developers", label: t("developersLink") }}
      >
        {children}
      </HelpShell>
    </NextIntlClientProvider>
  );
}
