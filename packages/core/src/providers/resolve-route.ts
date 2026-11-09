import type { ProviderConnection } from "@bibi/db";
import { ok, type Result } from "../errors/result";
import type { OperationContext } from "../operations/types";
import { conflict } from "../shared/errors";
import { isUsable } from "./connections";
import type { PaymentMethodKey, ProviderKey } from "./provider-keys";
import { findProvider, listProviders, takesMethod } from "./registry";
import type { ProviderAdapter } from "./types";

export type Route = {
  provider: ProviderKey;
  adapter: ProviderAdapter;
  connection: ProviderConnection;
};

export type ResolveRouteInput = {
  context: Pick<OperationContext, "db">;
  method: PaymentMethodKey;
};

const notConnected = ({ method, provider }: { method: string; provider: string }) =>
  conflict({
    message: `${method} payments go to ${provider}, but it is not connected. Connect it in Administration → Integrations.`,
  });

/**
 * Which provider takes a payment method (ADR 0100): the admin's `PaymentMethodRoute`, else the
 * connected provider that can take it (the first in registry order when several can, which keeps
 * ADR 0090's default), else null. A route to a provider that is not connected is a CONFLICT,
 * never a silent switch to another one.
 */
export async function resolveRoute({
  context,
  method,
}: ResolveRouteInput): Promise<Result<Route | null>> {
  const [route, connections] = await Promise.all([
    context.db.paymentMethodRoute.findFirst({ where: { method } }),
    context.db.providerConnection.findMany({}),
  ]);
  const usable = ({ key }: { key: ProviderKey }) => {
    const row = connections.find((connection) => connection.provider === key) ?? null;
    return isUsable({ row }) ? row : null;
  };
  if (route) {
    const adapter = findProvider({ key: route.provider });
    const connection = usable({ key: route.provider });
    if (!adapter || !connection || !takesMethod({ adapter, method })) {
      return notConnected({ method, provider: route.provider });
    }
    return ok({ value: { provider: route.provider, adapter, connection } });
  }
  for (const adapter of listProviders()) {
    const connection = usable({ key: adapter.key });
    if (connection && takesMethod({ adapter, method })) {
      return ok({ value: { provider: adapter.key, adapter, connection } });
    }
  }
  return ok({ value: null });
}
