import { AppError } from "../../errors/app-error";
import { err } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { hashOauthState, OAUTH_STATE_TTL_MS } from "../../providers/oauth/oauth-state";
import { nowOf } from "../../time/now";
import type { IntegrationCompleteConnectInput } from "./schema";

export type FindPendingInput = {
  input: IntegrationCompleteConnectInput;
  context: Pick<OperationContext, "db" | "now">;
};

/** The row whose stored state hash matches and whose authorization is at most 10 minutes old. */
export async function findPendingAuthorization({ input, context }: FindPendingInput) {
  const row = await context.db.providerConnection.findFirst({
    where: { provider: input.provider, oauthStateHash: hashOauthState({ state: input.state }) },
  });
  const startedAt = row?.oauthStartedAt?.getTime() ?? 0;
  if (!row || nowOf({ context }).getTime() - startedAt > OAUTH_STATE_TTL_MS) return null;
  return row;
}

export const staleAuthorization = () =>
  err({
    error: new AppError({
      code: "VALIDATION",
      message: "The authorization expired or does not belong to this organization. Start again.",
    }),
  });
