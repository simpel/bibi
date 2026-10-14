import { isPlatformAdmin } from "@okazi/auth";
import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { requireReadySession } from "@/server/guard";

type AppLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Protected area: needs a session with an active organization, renders the app shell. */
export default async function AppLayout({ children, params }: AppLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { session, organizationId } = await requireReadySession({ locale });
  const { id, name, email } = session.user;
  // Only decides whether the menu shows the admin link; `/admin` checks again.
  const platformAdmin = await isPlatformAdmin({ userId: id });
  return (
    <AppShell organizationId={organizationId} user={{ name, email, platformAdmin }}>
      {children}
    </AppShell>
  );
}
