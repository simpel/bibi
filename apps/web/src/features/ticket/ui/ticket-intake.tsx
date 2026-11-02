import { isAiFeatureConfigured } from "@bibi/core";
import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { IntakePage } from "../intake/intake-page";
import { loadIntakeData } from "../load-intake-data";
import { loadIntakeMessage } from "../load-intake-message";

export type TicketIntakeProps = {
  locale: Locale;
  /** `?fromMessage=<id>`: the inbox message the ticket is made from (ADR 0085). */
  fromMessage?: string | undefined;
};

/** `/new/ticket`: the one-page ticket intake (ADR 0081), optionally from an inbox message. */
export async function TicketIntake({ locale, fromMessage }: TicketIntakeProps) {
  const t = await getTranslations("ticketIntake");
  const [data, message, draftEnabled] = await Promise.all([
    loadIntakeData(),
    loadIntakeMessage({ id: fromMessage }),
    // Step 0 is hidden while drafting has no model (ADR 0084).
    isAiFeatureConfigured({ feature: "ticket.intakeDraft" }),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  // A message's intake keeps its own draft, so it never picks up another draft's message.
  const draftKey = message ? `${data.value.draftKey}.message.${message.id}` : data.value.draftKey;
  return (
    <FormPageShell backHref={ROUTES.tickets} title={t("title")} description={t("description")}>
      <IntakePage
        data={{ ...data.value, draftKey }}
        message={message}
        draftEnabled={draftEnabled}
      />
    </FormPageShell>
  );
}
