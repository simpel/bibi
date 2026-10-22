import { resolveLocale } from "@bibi/i18n";
import type { ReactNode } from "react";
import { welcomePath } from "@/features/welcome/lib/welcome-step";
import { loadStepState } from "@/features/welcome/load-step-state";
import { SetupDraftProvider } from "@/features/welcome/ui/setup/setup-draft-provider";
import { redirect } from "@/lib/navigation";

type SetupLayoutProps = { children: ReactNode; params: Promise<{ locale: string; org: string }> };

/** Only while the setup is pending, and only for members with `pipeline:write` (ADR 0061). */
export default async function SetupLayout({ children, params }: SetupLayoutProps) {
  const { locale: raw, org } = await params;
  const locale = resolveLocale({ value: raw });
  const state = await loadStepState({ locale });
  if (!state.canSetup || state.organization.setupStatus !== "PENDING") {
    redirect({ href: welcomePath(), locale, org });
  }
  return <SetupDraftProvider org={org}>{children}</SetupDraftProvider>;
}
