import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { TablePreferencesProvider } from "@/components/data-table/table-preferences-provider";
import { AdminShell } from "@/features/admin/ui/admin-shell";
import { loadUserPreferences } from "@/features/user-preference/load";
import { TABLE_COLUMNS_PREFIX } from "@/lib/table-preferences";
import { requirePlatformAdmin } from "@/server/platform-guard";

type AdminLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Superadmin area (ADR 0015): Superadmins only, everyone else gets a 404. */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const session = await requirePlatformAdmin({ locale });
  const preferences = await loadUserPreferences({ prefix: TABLE_COLUMNS_PREFIX });
  return (
    <TablePreferencesProvider preferences={preferences}>
      <AdminShell email={session.user.email}>{children}</AdminShell>
    </TablePreferencesProvider>
  );
}
