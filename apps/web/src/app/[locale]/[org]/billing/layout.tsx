import { resolveLocale } from "@bibi/i18n";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { WelcomeShell } from "@/features/welcome/ui/welcome-shell";
import { BILLING_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";
import { pageTitle } from "@/lib/page-metadata";
import { requireReadySession } from "@/server/guard";

type BillingLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "billing", key: "title" });
}

/** `/:org/billing/*` (ADR 0095): full screen outside the app shell, which the gate closes. */
export default async function BillingLayout({ children, params }: BillingLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  await requireReadySession({ locale });
  return (
    <NextIntlClientProvider
      messages={pickSurfaceMessages({ locale, namespaces: BILLING_NAMESPACES })}
    >
      <WelcomeShell>{children}</WelcomeShell>
    </NextIntlClientProvider>
  );
}
