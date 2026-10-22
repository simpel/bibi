import { isPlatformAdmin } from "@bibi/auth";
import { resolveLocale } from "@bibi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { TablePreferencesProvider } from "@/components/data-table/table-preferences-provider";
import { AppShell } from "@/components/shell/app-shell";
import { canOpenSettings } from "@/components/shell/settings-items";
import { loadUserPreferences } from "@/features/user-preference/load";
import { welcomePath } from "@/features/welcome/lib/welcome-step";
import { mustWelcomeFirst } from "@/features/welcome/load-welcome-gate";
import { redirect } from "@/lib/navigation";
import { TABLE_COLUMNS_PREFIX } from "@/lib/table-preferences";
import { getCallerAbilities } from "@/server/caller-abilities";
import { requireReadySession } from "@/server/guard";

type AppLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/**
 * Protected area: needs a session with an active organization and a finished welcome flow
 * (ADR 0061), renders the app shell.
 */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { session, organizationId, organizationSlug } = await requireReadySession({ locale });
  // An open profile step or a pending setup the member can do comes first (ADR 0061).
  if (await mustWelcomeFirst()) redirect({ href: welcomePath(), locale, org: organizationSlug });
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
