import "server-only";
import { listTicketPhases } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { redirect } from "@okazi/i18n/navigation";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { runOperation } from "@/server/run-operation";

export type RedirectToSetupInput = { locale: Locale };

/**
 * The guided setup runs by itself for an organization without phases (ADR 0044): an admin who
 * can set up the pipeline is sent to `/onboarding/pipeline`. Others see the app as it is.
 */
export async function redirectToPipelineSetup({ locale }: RedirectToSetupInput): Promise<void> {
  const { phaseGridAdmin, ticketPhaseAdmin, itemStateAdmin } = await getCallerAbilities();
  if (!(phaseGridAdmin && ticketPhaseAdmin && itemStateAdmin)) return;
  const phases = await runOperation({ operation: listTicketPhases, input: { limit: 1 } });
  if (phases.ok && phases.value.items.length === 0) {
    redirect({ href: ROUTES.onboardingPipeline, locale });
  }
}
