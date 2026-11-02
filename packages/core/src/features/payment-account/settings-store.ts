import type { OperationContext } from "../../operations/types";
import type { PaymentSettingsDto, PaymentSettingsUpdateInput } from "./settings-schema";

type Db = { context: Pick<OperationContext, "db"> };

const SELECT = {
  id: true,
  depositPercent: true,
  depositMinimumMinor: true,
  invoiceProvider: true,
} as const;

/** The organization's payment settings, or none of them set before the first save (ADR 0090). */
export async function loadPaymentSettings({ context }: Db): Promise<PaymentSettingsDto> {
  const row = await context.db.paymentSettings.findFirst({ select: SELECT });
  return (
    row ?? { id: null, depositPercent: null, depositMinimumMinor: null, invoiceProvider: null }
  );
}

export type SavePaymentSettingsInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "recordChange">;
  data: PaymentSettingsUpdateInput;
};

/** Creates or changes the settings row; omitted fields keep their value. */
export async function savePaymentSettings({
  context,
  data,
}: SavePaymentSettingsInput): Promise<PaymentSettingsDto> {
  const before = await loadPaymentSettings({ context });
  const row = await context.db.paymentSettings.upsert({
    where: { organizationId: context.organizationId },
    create: { ...data, organizationId: context.organizationId },
    update: data,
    select: SELECT,
  });
  context.recordChange({ entityId: row.id, before, after: row });
  return row;
}
