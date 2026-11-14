import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { ExternalInput } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { conflict } from "../../shared/errors";
import {
  type IntegrationCheckSetupInput,
  IntegrationCheckSetupInputSchema,
  type IntegrationConnectionDto,
  IntegrationConnectionSchema,
} from "./schema";
import { runSetupCheck } from "./setup-check";
import { toIntegrationDto } from "./to-integration-dto";

type CheckInput = ExternalInput<IntegrationCheckSetupInput, IntegrationConnectionDto>;

/** After the commit (ADR 0058): reads the provider, then stores what it found on the connection. */
async function checkAfterCommit({
  input,
  context,
}: CheckInput): Promise<Result<IntegrationConnectionDto>> {
  const { provider } = input;
  const before = await context.db.providerConnection.findFirst({ where: { provider } });
  if (!before) return conflict({ message: `${provider} is not connected` });
  const checked = await runSetupCheck({ context, row: before });
  if (!checked.ok) return checked;
  const { organizationId } = context;
  const after = toIntegrationDto({ row: checked.value, organizationId, provider });
  context.recordChange({
    entityId: before.id,
    before: toIntegrationDto({ row: before, organizationId, provider }),
    after,
  });
  return ok({ value: after });
}

export const checkIntegrationSetup = defineOperation({
  name: "integration.checkSetup",
  kind: "command",
  description:
    "Check that the connected accounting system is set up for what Bibi books: the advances " +
    "account and every revenue account in Administration → Accounting must exist there, and " +
    "Spiris needs account codings for them at each VAT rate in use. Reads the system (nothing is " +
    "created or changed there) and stores what it found on the connection (setupIssues, " +
    "setupCheckedAt). Run it after changing accounts in Bibi or in the accounting system; it " +
    "also runs when a connection is made. A provider with nothing to check returns unchanged.",
  input: IntegrationCheckSetupInputSchema,
  output: IntegrationConnectionSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  handler: async ({ input, context }) => {
    // The accounts come from Administration → Accounting (`finance`); the result names them.
    if (!canView({ context, feature: "finance" })) {
      const message = "Checking the accounts needs finance:read";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const { provider } = input;
    const row = await context.db.providerConnection.findFirst({ where: { provider } });
    const { organizationId } = context;
    const dto = toIntegrationDto({ row, organizationId, provider });
    if (dto.status !== "CONNECTED") return conflict({ message: `${provider} is not connected` });
    return ok({ value: dto });
  },
  external: checkAfterCommit,
});
