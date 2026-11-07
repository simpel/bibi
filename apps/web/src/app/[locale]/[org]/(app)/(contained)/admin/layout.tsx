import type { ReactNode } from "react";
import { canOpenAdmin } from "@/components/shell/admin-items";
import { ErrorState } from "@/components/states/error-state";
import { pageTitle } from "@/lib/page-metadata";
import { getCallerAbilities } from "@/server/caller-abilities";

type AdminLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "admin" });
}

/**
 * `/admin/*` is the administration area (ADR 0036). Callers who may view none of its pages do not
 * see the sidebar entry and get a forbidden state here; each page's operations check its own
 * feature (ADR 0050).
 */
export default async function AdminLayout({ children }: AdminLayoutProps) {
  const { permissions } = await getCallerAbilities();
  if (!canOpenAdmin({ permissions })) return <ErrorState errorKey="forbidden" />;
  return <>{children}</>;
}
