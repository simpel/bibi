import type { ProviderConnection } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { ProviderKey } from "../../providers/provider-keys";
import { findProvider } from "../../providers/registry";
import { loadMappingList } from "../finance/load-mappings";
import { parseChart } from "./chart";
import { deriveSetupIssues } from "./mapping-issues";
import type { IntegrationConnectionDto } from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

/** The VAT rate a check assumes when no item has one yet. */
const DEFAULT_VAT_RATE = 25;

type Context = Pick<OperationContext, "db" | "organizationId">;

export type LoadIntegrationDtoInput = {
  context: Context;
  row: ProviderConnection | null;
  provider: ProviderKey;
};

/** The VAT rates of the organization's active items, once each, highest first. */
async function itemVatRates({ context }: { context: Pick<Context, "db"> }) {
  const items = await context.db.item.findMany({
    where: { vatRatePercent: { not: null } },
    select: { vatRatePercent: true },
    distinct: ["vatRatePercent"],
  });
  const rates = items.flatMap((item) =>
    item.vatRatePercent === null ? [] : [item.vatRatePercent],
  );
  return rates.length > 0 ? rates.sort((a, b) => b - a) : [DEFAULT_VAT_RATE];
}

/**
 * The connection as the surfaces show it, with the problems between its mappings and the
 * accounting system's accounts derived now (ADR 0123). Only a connected accounting system has any.
 */
export async function loadIntegrationDto({
  context,
  row,
  provider,
}: LoadIntegrationDtoInput): Promise<IntegrationConnectionDto> {
  const { organizationId } = context;
  const base = toIntegrationDto({ row, organizationId, provider });
  const mapped = Boolean(findProvider({ key: provider })?.ledger) && base.status === "CONNECTED";
  if (!row || !mapped) return base;
  const [list, vatRates] = await Promise.all([
    loadMappingList({ context, connection: row }),
    itemVatRates({ context }),
  ]);
  const setupIssues = deriveSetupIssues({
    chart: parseChart({ value: row.chart }),
    mappings: list.mappings,
    vatRates,
  });
  return { ...base, setupIssues };
}
