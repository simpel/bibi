import { resolveLocale } from "@bibi/i18n";
import { Wordmark } from "@bibi/ui";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AUTH_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";
import { pageTitle } from "@/lib/page-metadata";

type AuthLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "auth", key: "signInTitle" });
}

/** Wordmark above the centered auth card. */
export default async function AuthLayout({ children, params }: AuthLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const common = await getTranslations("common");
  return (
    <NextIntlClientProvider messages={pickSurfaceMessages({ locale, namespaces: AUTH_NAMESPACES })}>
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 p-4">
        <Wordmark size="xl" label={common("appName")} />
        {children}
      </main>
    </NextIntlClientProvider>
  );
}
