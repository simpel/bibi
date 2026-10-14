import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminShell } from "@/features/admin/ui/admin-shell";
import { requirePlatformAdmin } from "@/server/platform-guard";

type AdminLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

/** Platform admin area (ADR 0015): platform admins only, everyone else gets a 404. */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const session = await requirePlatformAdmin({ locale });
  return <AdminShell email={session.user.email}>{children}</AdminShell>;
}
