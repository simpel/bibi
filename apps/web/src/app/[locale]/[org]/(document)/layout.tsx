import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { TablePreferencesProvider } from "@/components/data-table/table-preferences-provider";
import { loadUserPreferences } from "@/features/user-preference/load";
import { welcomePath } from "@/features/welcome/lib/welcome-step";
import { mustWelcomeFirst } from "@/features/welcome/load-welcome-gate";
import { redirect } from "@/lib/navigation";
import { TABLE_COLUMNS_PREFIX } from "@/lib/table-preferences";
import { requireReadySession } from "@/server/guard";

type DocumentLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/**
 * Documents staff work from, e.g. a work order (ADR 0092): the same session and welcome checks
 * as the app, but no app shell, so the page holds only the work.
 */
export default async function DocumentLayout({ children, params }: DocumentLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { organizationSlug } = await requireReadySession({ locale });
  if (await mustWelcomeFirst()) redirect({ href: welcomePath(), locale, org: organizationSlug });
  const preferences = await loadUserPreferences({ prefix: TABLE_COLUMNS_PREFIX });
  return (
    <TablePreferencesProvider preferences={preferences}>
      <main className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8 md:py-12">{children}</main>
    </TablePreferencesProvider>
  );
}
