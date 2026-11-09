import type { OperationContext } from "../../operations/types";
import type { PaymentMethodKey, ProviderKey } from "../../providers/provider-keys";
import type {
  InvoiceProvider,
  PaymentOperator,
  PaymentSettingsDto,
  PaymentSettingsUpdateInput,
} from "./settings-schema";

type Db = { context: Pick<OperationContext, "db"> };

const SELECT = { id: true, depositPercent: true, depositMinimumMinor: true } as const;

/** The routed provider of a method, narrowed to what the settings DTO can show. */
function routed<T extends ProviderKey>({
  routes,
  method,
  allowed,
}: {
  routes: readonly { method: PaymentMethodKey; provider: ProviderKey }[];
  method: PaymentMethodKey;
  allowed: readonly T[];
}): T | null {
  const provider = routes.find((route) => route.method === method)?.provider;
  return allowed.find((key) => key === provider) ?? null;
}

const OPERATORS: readonly PaymentOperator[] = ["STRIPE"];
const INVOICE_PROVIDERS: readonly InvoiceProvider[] = ["STRIPE", "FORTNOX"];

/**
 * The organization's payment settings (ADR 0090): the deposit rule, and the CARD and INVOICE
 * routes (ADR 0100) shown as the payment operator and the invoice provider.
 */
export async function loadPaymentSettings({ context }: Db): Promise<PaymentSettingsDto> {
  const [row, routes] = await Promise.all([
    context.db.paymentSettings.findFirst({ select: SELECT }),
    context.db.paymentMethodRoute.findMany({ select: { method: true, provider: true } }),
  ]);
  return {
    ...(row ?? { id: null, depositPercent: null, depositMinimumMinor: null }),
    invoiceProvider: routed({ routes, method: "INVOICE", allowed: INVOICE_PROVIDERS }),
    paymentOperator: routed({ routes, method: "CARD", allowed: OPERATORS }),
  };
}

type RouteInput = {
  context: Pick<OperationContext, "db" | "organizationId">;
  method: PaymentMethodKey;
  provider: ProviderKey | null | undefined;
};

/** Sets or clears one method's route; undefined leaves it as it is. */
async function saveRoute({ context, method, provider }: RouteInput): Promise<void> {
  if (provider === undefined) return;
  if (provider === null) {
    await context.db.paymentMethodRoute.deleteMany({ where: { method } });
    return;
  }
  const { organizationId } = context;
  await context.db.paymentMethodRoute.upsert({
    where: { organizationId_method: { organizationId, method } },
    create: { organizationId, method, provider },
    update: { provider },
  });
}

export type SavePaymentSettingsInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "recordChange">;
  data: PaymentSettingsUpdateInput;
};

/** Creates or changes the settings row and the routes; omitted fields keep their value. */
export async function savePaymentSettings({
  context,
  data,
}: SavePaymentSettingsInput): Promise<PaymentSettingsDto> {
  const before = await loadPaymentSettings({ context });
  const { invoiceProvider, paymentOperator, ...rule } = data;
  const row = await context.db.paymentSettings.upsert({
    where: { organizationId: context.organizationId },
    create: { ...rule, organizationId: context.organizationId },
    update: rule,
    select: SELECT,
  });
  await saveRoute({ context, method: "INVOICE", provider: invoiceProvider });
  await saveRoute({ context, method: "CARD", provider: paymentOperator });
  const after = await loadPaymentSettings({ context });
  context.recordChange({ entityId: row.id, before, after });
  return after;
}
