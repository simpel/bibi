import type { ReactNode } from "react";
import { canOpenSettings } from "@/components/shell/settings-items";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";

type SettingsLayoutProps = { children: ReactNode };

/**
 * `/settings/*` is configuration. Callers who may view none of its areas do not see the sidebar
 * entry and get a forbidden state here; each page's operations check its own feature (ADR 0050).
 */
export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const { permissions } = await getCallerAbilities();
  if (!canOpenSettings({ permissions })) return <ErrorState errorKey="forbidden" />;
  return <>{children}</>;
}
