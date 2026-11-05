import { resolveLocale } from "@bibi/i18n";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { WelcomeShell } from "@/features/welcome/ui/welcome-shell";
import { pickSurfaceMessages, WELCOME_NAMESPACES } from "@/i18n/surface-messages";
import { pageTitle } from "@/lib/page-metadata";
import { requireAnySession } from "@/server/auth-pages";

type WelcomeLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "welcome", key: "start.title" });
}

/** `/welcome` and `/welcome/new` (ADR 0061): signed in, no organization in the URL yet. */
export default async function WelcomeLayout({ children, params }: WelcomeLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  await requireAnySession({ locale });
  return (
    <NextIntlClientProvider
      messages={pickSurfaceMessages({ locale, namespaces: WELCOME_NAMESPACES })}
    >
      <WelcomeShell>{children}</WelcomeShell>
    </NextIntlClientProvider>
  );
}
