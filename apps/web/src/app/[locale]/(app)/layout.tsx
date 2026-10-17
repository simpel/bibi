import { isPlatformAdmin } from "@okazi/auth";
import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { getCallerAbilities } from "@/server/caller-abilities";
import { requireReadySession } from "@/server/guard";

type AppLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Protected area: needs a session with an active organization, renders the app shell. */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { session, organizationId } = await requireReadySession({ locale });
  const { id, name, email } = session.user;
  // Only decide which sidebar links show (ADR 0036); `/settings/*` and `/admin` check again.
  const [platformAdmin, abilities] = await Promise.all([
    isPlatformAdmin({ userId: id }),
    getCallerAbilities(),
  ]);
  return (
    <AppShell
      organizationId={organizationId}
      user={{ name, email }}
      access={{ canConfigure: abilities.configurationWrite, platformAdmin }}
    >
      {children}
    </AppShell>
  );
}
