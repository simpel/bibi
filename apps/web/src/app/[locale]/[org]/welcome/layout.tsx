import { resolveLocale } from "@bibi/i18n";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { WelcomeShell } from "@/features/welcome/ui/welcome-shell";
import { pickSurfaceMessages, WELCOME_NAMESPACES } from "@/i18n/surface-messages";
import { pageTitle } from "@/lib/page-metadata";
import { requireReadySession } from "@/server/guard";

type OrgWelcomeLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "welcome", key: "start.title" });
}

/** `/:org/welcome/*` (ADR 0061): full screen, no app shell; the org layout checked membership. */
export default async function OrgWelcomeLayout({ children, params }: OrgWelcomeLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  await requireReadySession({ locale });
  return (
    <NextIntlClientProvider
      messages={pickSurfaceMessages({ locale, namespaces: WELCOME_NAMESPACES })}
    >
      <WelcomeShell>{children}</WelcomeShell>
    </NextIntlClientProvider>
  );
}
