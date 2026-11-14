import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { isUsable } from "../../providers/connections";
import type { ProviderKey } from "../../providers/provider-keys";
import { findProvider, listProviders, takesMethod } from "../../providers/registry";
import { conflict, invalid } from "../../shared/errors";
import {
  type PaymentRoute,
  type PaymentSettingsDto,
  type PaymentSettingsUpdateInput,
  ROUTABLE_METHODS,
} from "./settings-schema";

type Db = { context: Pick<OperationContext, "db"> };

const SELECT = { id: true, depositPercent: true, depositMinimumMinor: true } as const;

/** The organization's payment settings (ADR 0090, 0100): the deposit rule and one route per method. */
export async function loadPaymentSettings({ context }: Db): Promise<PaymentSettingsDto> {
  const [row, stored] = await Promise.all([
    context.db.paymentSettings.findFirst({ select: SELECT }),
    context.db.paymentMethodRoute.findMany({ select: { method: true, provider: true } }),
  ]);
  const providerOf = ({ method }: { method: string }): ProviderKey | null =>
    stored.find((route) => route.method === method)?.provider ?? null;
  return {
    ...(row ?? { id: null, depositPercent: null, depositMinimumMinor: null }),
    routes: ROUTABLE_METHODS.map((method) => ({ method, provider: providerOf({ method }) })),
    choices: ROUTABLE_METHODS.map((method) => ({
      method,
      providers: listProviders()
        .filter((adapter) => takesMethod({ adapter, method }))
        .map((adapter) => adapter.key),
    })),
    invoiceProvider: providerOf({ method: "INVOICE" }),
    paymentOperator: providerOf({ method: "CARD" }),
  };
}

/** The routes an update asks for: `routes`, plus the deprecated single-method fields. */
export function requestedRoutes({ data }: { data: PaymentSettingsUpdateInput }): PaymentRoute[] {
  const routes = [...(data.routes ?? [])];
  const legacy = [
    { method: "INVOICE" as const, provider: data.invoiceProvider },
    { method: "CARD" as const, provider: data.paymentOperator },
  ];
  for (const { method, provider } of legacy) {
    if (provider !== undefined && !routes.some((route) => route.method === method)) {
      routes.push({ method, provider });
    }
  }
  return routes;
}

/** VALIDATION for a route to a provider that cannot take the method. */
export function checkRoutes({ routes }: { routes: readonly PaymentRoute[] }): Result<true> {
  for (const [index, { method, provider }] of routes.entries()) {
    if (routes.findIndex((route) => route.method === method) !== index) {
      const message = `${method} is routed twice`;
      return invalid({ message, issues: [{ path: `routes.${index}.method`, message }] });
    }
    const adapter = provider ? findProvider({ key: provider }) : null;
    if (provider && !(adapter && takesMethod({ adapter, method }))) {
      const message = `${provider} cannot take ${method} payments`;
      return invalid({ message, issues: [{ path: `routes.${index}.provider`, message }] });
    }
  }
  return ok({ value: true });
}

type RouteInput = { context: Pick<OperationContext, "db" | "organizationId">; route: PaymentRoute };

/** Sets or clears one method's route. */
async function saveRoute({ context, route: { method, provider } }: RouteInput): Promise<void> {
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

type ConnectedInput = {
  context: Pick<OperationContext, "db">;
  routes: readonly PaymentRoute[];
};

/**
 * A route can only name a provider that is connected now; clearing one (Automatic) always works.
 * Stricter than `resolveRoute`, which refuses at use: a venue can no longer save a route to a
 * service it has not connected.
 */
async function checkRoutesConnected({ context, routes }: ConnectedInput): Promise<Result<true>> {
  const wanted = routes.flatMap(({ provider }) => (provider ? [provider] : []));
  if (wanted.length === 0) return ok({ value: true });
  const rows = await context.db.providerConnection.findMany({
    where: { provider: { in: wanted } },
  });
  for (const provider of wanted) {
    const row = rows.find((found) => found.provider === provider) ?? null;
    if (!isUsable({ row })) {
      return conflict({
        message: `${provider} is not connected. Connect it in Administration → Integrations first.`,
      });
    }
  }
  return ok({ value: true });
}

export type SavePaymentSettingsInput = {
  context: Pick<OperationContext, "db" | "organizationId" | "recordChange">;
  data: PaymentSettingsUpdateInput;
};

/** Creates or changes the settings row and the routes; omitted fields keep their value. */
export async function savePaymentSettings({
  context,
  data,
}: SavePaymentSettingsInput): Promise<Result<PaymentSettingsDto>> {
  const routes = requestedRoutes({ data });
  const checked = checkRoutes({ routes });
  if (!checked.ok) return checked;
  const connected = await checkRoutesConnected({ context, routes });
  if (!connected.ok) return connected;
  const before = await loadPaymentSettings({ context });
  const { invoiceProvider: _i, paymentOperator: _p, routes: _r, ...rule } = data;
  const row = await context.db.paymentSettings.upsert({
    where: { organizationId: context.organizationId },
    create: { ...rule, organizationId: context.organizationId },
    update: rule,
    select: SELECT,
  });
  for (const route of routes) await saveRoute({ context, route });
  const after = await loadPaymentSettings({ context });
  context.recordChange({ entityId: row.id, before, after });
  return ok({ value: after });
}
