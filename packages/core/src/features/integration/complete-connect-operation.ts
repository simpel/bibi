import { AppError } from "../../errors/app-error";
import { err, ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { completeAfterCommit } from "./complete-after-commit";
import { findPendingAuthorization, staleAuthorization } from "./pending-authorization";
import { IntegrationCompleteConnectInputSchema, IntegrationConnectionSchema } from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

/**
 * The provider's callback (ADR 0087): checks the state, then exchanges the code after the commit.
 * Not registered on any surface: only the web callback route runs it, as the signed-in user, so
 * the approval at the provider is tied to an admin of this organization.
 */
export const completeIntegrationConnect = defineOperation({
  name: "integration.completeConnect",
  kind: "command",
  description: "Finish connecting an outside system from the provider's callback (web only).",
  input: IntegrationCompleteConnectInputSchema,
  output: IntegrationConnectionSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  approval: false,
  aiAllowed: false,
  handler: async ({ input, context }) => {
    if (context.credential !== "session") {
      const message = "Connections are completed from the browser callback only";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const row = await findPendingAuthorization({ input, context });
    if (!row) return staleAuthorization();
    const { organizationId } = context;
    return ok({ value: toIntegrationDto({ row, organizationId, provider: input.provider }) });
  },
  external: completeAfterCommit,
});
