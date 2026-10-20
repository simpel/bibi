import { isPlatformAdmin } from "@okazi/auth";
import { resolveLocale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { TablePreferencesProvider } from "@/components/data-table/table-preferences-provider";
import { AppShell } from "@/components/shell/app-shell";
import { canOpenSettings } from "@/components/shell/settings-items";
import { loadUserPreferences } from "@/features/user-preference/load";
import { loadOnboardingStatus } from "@/features/user-preference/settings-load";
import { ROUTES } from "@/lib/routes";
import { TABLE_COLUMNS_PREFIX } from "@/lib/table-preferences";
import { getCallerAbilities } from "@/server/caller-abilities";
import { requireReadySession } from "@/server/guard";

type AppLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/**
 * Protected area: needs a session with an active organization (and a finished or skipped first
 * setup), renders the app shell.
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { session, organizationId } = await requireReadySession({ locale });
  // A user who has not finished or skipped the first setup goes there first (ADR 0046).
  if ((await loadOnboardingStatus()) === "PENDING") redirect({ href: ROUTES.onboarding, locale });
  const { id, name, email } = session.user;
  // Only decide which sidebar links show (ADR 0036); `/settings/*` and `/admin` check again.
  const [platformAdmin, abilities, preferences] = await Promise.all([
    isPlatformAdmin({ userId: id }),
    getCallerAbilities(),
    loadUserPreferences({ prefix: TABLE_COLUMNS_PREFIX }),
  ]);
  return (
    <TablePreferencesProvider preferences={preferences}>
      <AppShell
        organizationId={organizationId}
        user={{ name, email }}
        access={{
          canConfigure: canOpenSettings({ permissions: abilities.permissions }),
          platformAdmin,
          permissions: abilities.permissions,
        }}
      >
        {children}
      </AppShell>
    </TablePreferencesProvider>
  );
}
