import { getTranslations } from "next-intl/server";
import { FormPageShell } from "@/components/wizard/form-page-shell";
import { orderRoute } from "@/lib/routes";
import { DepositForm } from "./deposit-form";

export type DepositCreateProps = { orderId: string };

/** `/new/deposit?order=<id>`: a deposit request on the order. */
export async function DepositCreate({ orderId }: DepositCreateProps) {
  const t = await getTranslations("deposit");
  return (
    <FormPageShell
      backHref={orderRoute({ id: orderId })}
      title={t("create")}
      description={t("createDescription")}
    >
      <DepositForm orderId={orderId} />
    </FormPageShell>
  );
}
