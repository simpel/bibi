import { resolveLocale } from "@bibi/i18n";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { DocsShell } from "@/features/docs/ui/docs-shell";
import { DOCS_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";
import { pageTitle } from "@/lib/page-metadata";

type DocsLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "docs", key: "title" });
}

/** Public documentation: no session is read anywhere under `/docs`. */
export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  return (
    <NextIntlClientProvider messages={pickSurfaceMessages({ locale, namespaces: DOCS_NAMESPACES })}>
      <DocsShell>{children}</DocsShell>
    </NextIntlClientProvider>
  );
}
