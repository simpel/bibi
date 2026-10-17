import type { ReactNode } from "react";
import { ErrorState } from "@/components/states/error-state";
import { getCallerAbilities } from "@/server/caller-abilities";

type SettingsLayoutProps = { children: ReactNode };

/**
 * `/settings/*` is configuration: only admins and owners (ADR 0034). Members and viewers do not
 * see the sidebar entry and get a forbidden state here; the operations check again.
 */
export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const { configurationWrite } = await getCallerAbilities();
  if (!configurationWrite) return <ErrorState errorKey="forbidden" />;
  return <>{children}</>;
}
