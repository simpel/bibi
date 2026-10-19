import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { ticketRoute } from "@/lib/routes";
import { DepositForm } from "./deposit-form";

export type DepositCreateProps = { ticketId: string };

/** `/new/deposit?ticket=<id>`: a deposit request on the ticket. */
export async function DepositCreate({ ticketId }: DepositCreateProps) {
  const t = await getTranslations("deposit");
  return (
    <FormPageShell
      backHref={ticketRoute({ id: ticketId })}
      title={t("create")}
      description={t("createDescription")}
    >
      <DepositForm ticketId={ticketId} />
    </FormPageShell>
  );
}
