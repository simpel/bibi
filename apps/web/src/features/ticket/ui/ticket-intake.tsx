import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { IntakePage } from "../intake/intake-page";
import { loadIntakeData } from "../load-intake-data";

export type TicketIntakeProps = { locale: Locale };

/** `/new/ticket`: the one-page ticket intake (ADR 0081). */
export async function TicketIntake({ locale }: TicketIntakeProps) {
  const t = await getTranslations("ticketIntake");
  const data = await loadIntakeData();
  if (!data.ok) return <ErrorState errorKey={handleLoadError({ error: data.error, locale })} />;
  return (
    <FormPageShell backHref={ROUTES.tickets} title={t("title")} description={t("description")}>
      <IntakePage data={data.value} />
    </FormPageShell>
  );
}
