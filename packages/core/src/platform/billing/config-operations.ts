import { z } from "zod";
import { openSecret } from "../../crypto/secret-box";
import { ok } from "../../errors/result";
import { definePlatformOperation } from "../define-platform-operation";
import type { PlatformHandlerContext } from "../types";
import { loadConfigRow, saveConfig, sealUpdate, toBillingConfigDto } from "./config-store";
import { provisionStripe } from "./provision";
import { BillingConfigSchema, BillingConfigUpdateInputSchema } from "./schema";

export const getBillingConfig = definePlatformOperation({
  name: "billingConfig.get",
  kind: "query",
  description: "Bibi's own Stripe Billing setup: whether it is live, key hint, products, webhook.",
  input: z.object({}),
  output: BillingConfigSchema,
  handler: async ({ context }) =>
    ok({ value: toBillingConfigDto({ row: await loadConfigRow(context) }) }),
});

/** Provisions with the stored key; without one there is nothing to set up yet. */
async function provisionStored({ context }: { context: PlatformHandlerContext }) {
  const row = await loadConfigRow(context);
  if (!row?.secretKeySealed) return ok({ value: {} });
  const secretKey = openSecret({ sealed: row.secretKeySealed });
  if (!secretKey.ok) return secretKey;
  return provisionStripe({ context, secretKey: secretKey.value });
}

export const updateBillingConfig = definePlatformOperation({
  name: "billingConfig.update",
  kind: "command",
  description:
    "Store the Stripe secret key (and locally the webhook secret), sealed at rest, then set " +
    "Bibi up in that account: product, prices, Customer Portal and, on https, the webhook.",
  input: BillingConfigUpdateInputSchema,
  output: BillingConfigSchema,
  handler: async ({ input, context }) => {
    const sealed = sealUpdate({ input });
    if (!sealed.ok) return sealed;
    const updatedBy = context.actor.userId ?? "system";
    const before = await loadConfigRow(context);
    await saveConfig({ db: context.db, data: sealed.value, updatedBy });
    const provisioned = await provisionStored({ context });
    if (!provisioned.ok) return provisioned;
    const change = await saveConfig({ db: context.db, data: provisioned.value, updatedBy });
    const prior = before ? toBillingConfigDto({ row: before }) : null;
    context.recordChange({ entityId: "default", before: prior, after: change.after });
    return ok({ value: change.after });
  },
});
