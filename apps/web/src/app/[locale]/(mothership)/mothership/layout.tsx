import { resolveLocale } from "@bibi/i18n";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { TablePreferencesProvider } from "@/components/data-table/table-preferences-provider";
import { AdminShell } from "@/features/admin/ui/admin-shell";
import { loadUserPreferences } from "@/features/user-preference/load";
import { MOTHERSHIP_NAMESPACES, pickSurfaceMessages } from "@/i18n/surface-messages";
import { TABLE_COLUMNS_PREFIX } from "@/lib/table-preferences";
import { pageTitle } from "@/lib/page-metadata";
import { requirePlatformAdmin } from "@/server/platform-guard";

type AdminLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "admin", key: "title" });
}

/** Superadmin area (ADR 0015): Superadmins only, everyone else gets a 404. */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const { session, organizationId } = await requirePlatformAdmin({ locale });
  const preferences = await loadUserPreferences({ prefix: TABLE_COLUMNS_PREFIX });
  const { name, email } = session.user;
  return (
    <NextIntlClientProvider
      messages={pickSurfaceMessages({ locale, namespaces: MOTHERSHIP_NAMESPACES })}
    >
      <TablePreferencesProvider preferences={preferences}>
        <AdminShell user={{ name, email }} organizationId={organizationId}>
          {children}
        </AdminShell>
      </TablePreferencesProvider>
    </NextIntlClientProvider>
  );
}
