import { isPlatformAdmin } from "@bibi/auth";
import { resolveLocale } from "@bibi/i18n";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { TablePreferencesProvider } from "@/components/data-table/table-preferences-provider";
import { canOpenAdmin } from "@/components/shell/admin-items";
import { AppShell } from "@/components/shell/app-shell";
import { billingGateRedirect } from "@/features/billing/load-billing-gate";
import { AppPinnedBookings } from "@/features/calendar/ui/app-pinned-bookings";
import { loadLiveCounts } from "@/features/notification/load-live-counts";
import { loadUserPreferences } from "@/features/user-preference/load";
import { welcomePath } from "@/features/welcome/lib/welcome-step";
import { mustWelcomeFirst } from "@/features/welcome/load-welcome-gate";
import { APP_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";
import { redirect } from "@/lib/navigation";
import { TABLE_COLUMNS_PREFIX } from "@/lib/table-preferences";
import { getCallerAbilities } from "@/server/caller-abilities";
import { hasDraftModel } from "@/server/draft-model";
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
  const [welcomeFirst, payHref] = await Promise.all([mustWelcomeFirst(), billingGateRedirect()]);
  // An open profile step or a pending setup the member can do comes first (ADR 0061).
  if (welcomeFirst) redirect({ href: welcomePath(), locale, org: organizationSlug });
  // After the trial, an unpaid organization sees only the payment page (ADR 0095 §5).
  if (payHref) redirect({ href: payHref, locale, org: organizationSlug });
  const { id, name, email } = session.user;
  // Only decide which sidebar links show (ADR 0036); `/admin/*` and `/admin` check again.
  const counts = loadLiveCounts().catch(() => ({ unread: 0, inboxOpen: null }));
  const [platformAdmin, abilities, preferences, canDraftFromMessage] = await Promise.all([
    isPlatformAdmin({ userId: id }),
    getCallerAbilities(),
    loadUserPreferences({ prefix: TABLE_COLUMNS_PREFIX }),
    hasDraftModel(),
  ]);
  return (
    <NextIntlClientProvider messages={pickSurfaceMessages({ locale, namespaces: APP_NAMESPACES })}>
      <TablePreferencesProvider preferences={preferences}>
        <AppShell
          organizationId={organizationId}
          user={{ name, email }}
          counts={counts}
          access={{
            canConfigure: canOpenAdmin({ permissions: abilities.permissions }),
            canDraftFromMessage,
            platformAdmin,
            permissions: abilities.permissions,
          }}
        >
          <AppPinnedBookings organizationId={organizationId}>{children}</AppPinnedBookings>
        </AppShell>
      </TablePreferencesProvider>
    </NextIntlClientProvider>
  );
}
