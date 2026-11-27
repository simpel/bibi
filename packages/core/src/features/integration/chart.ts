import { z } from "zod";
import type { ProviderAccount } from "../../providers/types";

const ChartSchema = z.object({
  readable: z.boolean(),
  accounts: z.array(
    z.object({
      account: z.string(),
      name: z.string(),
      active: z.boolean(),
      vatRates: z.array(z.number()),
      accounts: z.array(z.string()),
    }),
  ),
});

/** The accounting system's accounts as stored on the connection (ADR 0123). */
export type ChartSnapshot = { readable: boolean; accounts: ProviderAccount[] };

/** The stored snapshot, or null before the first read or when stored JSON no longer parses. */
export function parseChart({ value }: { value: unknown }): ChartSnapshot | null {
  const parsed = ChartSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/** The chart entry a mapping's reference names: the account itself, or a family holding it. */
export function chartEntryOf({
  chart,
  ref,
}: {
  chart: ChartSnapshot;
  ref: string;
}): ProviderAccount | undefined {
  const lower = ref.toLowerCase();
  return (
    chart.accounts.find((entry) => entry.account.toLowerCase() === lower) ??
    chart.accounts.find((entry) => entry.accounts.includes(ref))
  );
}
