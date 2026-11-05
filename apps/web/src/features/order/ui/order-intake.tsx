import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { hasDraftModel } from "@/server/draft-model";
import { handleLoadError } from "@/server/load-error";
import { IntakePage } from "../intake/intake-page";
import type { IntakeStep } from "../intake/intake-state";
import { loadIntakeData } from "../load-intake-data";
import { loadIntakeMessage } from "../load-intake-message";

export type OrderIntakeProps = {
  locale: Locale;
  /** `?fromMessage=<id>`: the inbox message the order is made from (ADR 0085). */
  fromMessage?: string | undefined;
  /** The step in the path (`/new/order/<step>`); `who` for `/new/order` and `/message`. */
  step: IntakeStep;
};

/** `/new/order`: the one-page order intake (ADR 0081), optionally from an inbox message. */
export async function OrderIntake({ locale, fromMessage, step }: OrderIntakeProps) {
  const t = await getTranslations("orderIntake");
  const [data, message, draftEnabled] = await Promise.all([
    loadIntakeData(),
    loadIntakeMessage({ id: fromMessage }),
    // The paste dialog opens only while drafting has a model (ADR 0084).
    hasDraftModel(),
  ]);
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  // A message's intake keeps its own draft, so it never picks up another draft's message.
  const draftKey = message ? `${data.value.draftKey}.message.${message.id}` : data.value.draftKey;
  return (
    <FormPageShell backHref={ROUTES.orders} title={t("title")} description={t("description")}>
      <IntakePage
        data={{ ...data.value, draftKey }}
        message={message}
        draftEnabled={draftEnabled}
        step={step}
      />
    </FormPageShell>
  );
}
