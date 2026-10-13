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
  const { name, email } = session.user;
  return (
    <AppShell organizationId={organizationId} user={{ name, email }}>
      {children}
    </AppShell>
  );
}
