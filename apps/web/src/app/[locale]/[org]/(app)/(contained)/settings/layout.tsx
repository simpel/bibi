import type { ReactNode } from "react";
import { canOpenSettings } from "@/components/shell/settings-items";
import { ErrorState } from "@/components/states/error-state";
import { pageTitle } from "@/lib/page-metadata";
import { getCallerAbilities } from "@/server/caller-abilities";

type SettingsLayoutProps = { children: ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "settings" });
}

/**
 * `/settings/*` is configuration. Callers who may view none of its areas do not see the sidebar
 * entry and get a forbidden state here; each page's operations check its own feature (ADR 0050).
 */
export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const { permissions } = await getCallerAbilities();
  if (!canOpenSettings({ permissions })) return <ErrorState errorKey="forbidden" />;
  return <>{children}</>;
}
