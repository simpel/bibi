import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { DocsShell } from "@/features/docs/ui/docs-shell";

type DocsLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Public documentation: no session is read anywhere under `/docs`. */
export default async function DocsLayout({ children, params }: DocsLayoutProps) {
  const { locale } = await params;
  setRequestLocale(resolveLocale({ value: locale }));
  return <DocsShell>{children}</DocsShell>;
}
