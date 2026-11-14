import { sealSecret } from "../../crypto/secret-box";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { ExternalInput, OperationContext } from "../../operations/types";
import { connectWithCredentials } from "../../providers/connect-credentials";
import type { CredentialsConnectPort } from "../../providers/connect-types";
import { newOauthStart } from "../../providers/oauth/oauth-state";
import { getProvider } from "../../providers/registry";
import { conflict, invalid } from "../../shared/errors";
import { nowOf } from "../../time/now";
import { configuredOauthPort } from "./oauth-provider";
import { checkOneLedger } from "./one-ledger";
import {
  type IntegrationConnectInput,
  IntegrationConnectInputSchema,
  type IntegrationConnectOutput,
  IntegrationConnectOutputSchema,
} from "./schema";
import { toIntegrationDto } from "./to-integration-dto";

type ConnectInput = { input: IntegrationConnectInput; context: OperationContext };

/**
 * A CREDENTIALS provider (ADR 0100), in the handler: the credentials must match the provider's
 * schema; nothing is stored yet. The value is never echoed: issues name the field only.
 */
async function checkCredentials({
  input,
  context,
  port,
}: ConnectInput & { port: CredentialsConnectPort }): Promise<Result<IntegrationConnectOutput>> {
  const message = `${input.provider} connects with credentials`;
  if (!input.credentials) return invalid({ message, issues: [{ path: "credentials", message }] });
  const parsed = port.credentialsSchema.safeParse(input.credentials);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => ({
      path: ["credentials", ...issue.path.map(String)].join("."),
      message: `Invalid ${issue.path.map(String).join(".") || "credentials"}`,
    }));
    return invalid({ message: "The credentials are not valid", issues });
  }
  const { provider } = input;
  const row = await context.db.providerConnection.findFirst({ where: { provider } });
  const dto = toIntegrationDto({ row, organizationId: context.organizationId, provider });
  return ok({ value: { ...dto, authorizeUrl: null } });
}

/**
 * After the commit (ADR 0058): the provider checks the credentials, then they are stored sealed.
 * Before and after in the audit are DTOs, which never carry a secret.
 */
async function connectAfterCommit({
  input,
  output,
  context,
}: ExternalInput<IntegrationConnectInput, IntegrationConnectOutput>): Promise<
  Result<IntegrationConnectOutput>
> {
  const { provider, credentials } = input;
  if (output.connectKind !== "CREDENTIALS" || !credentials) return ok({ value: output });
  const before = await context.db.providerConnection.findFirst({ where: { provider } });
  const row = await connectWithCredentials({ context, provider, credentials });
  if (!row.ok) return row;
  const { organizationId } = context;
  const dto = toIntegrationDto({ row: row.value, organizationId, provider });
  context.recordChange({
    entityId: row.value.id,
    ...(before ? { before: toIntegrationDto({ row: before, organizationId, provider }) } : {}),
    after: dto,
  });
  return ok({ value: { ...dto, authorizeUrl: null } });
}

/** An OAuth provider (ADR 0087): a pending start, and the consent page to open. */
async function startOauth({
  input,
  context,
}: ConnectInput): Promise<Result<IntegrationConnectOutput>> {
  const port = configuredOauthPort({ provider: input.provider });
  if (!port.ok) return port;
  const start = newOauthStart();
  const verifier = sealSecret({ plain: start.codeVerifier });
  if (!verifier.ok) return verifier;
  const { provider } = input;
  const pending = {
    oauthStateHash: start.stateHash,
    codeVerifierSealed: verifier.value,
    oauthStartedAt: nowOf({ context }),
  };
  const before = await context.db.providerConnection.findFirst({ where: { provider } });
  const row = before
    ? await context.db.providerConnection.update({
        where: { id: before.id },
        data: { ...pending, ...(before.status === "CONNECTED" ? {} : { status: "PENDING" }) },
      })
    : await context.db.providerConnection.create({
        data: { organizationId: context.organizationId, provider, ...pending },
      });
  const { organizationId } = context;
  const dto = toIntegrationDto({ row, organizationId, provider });
  context.recordChange({
    entityId: row.id,
    ...(before ? { before: toIntegrationDto({ row: before, organizationId, provider }) } : {}),
    after: dto,
  });
  const authorizeUrl = port.value.authorizeUrl({
    state: start.state,
    codeChallenge: start.codeChallenge,
  });
  return ok({ value: { ...dto, authorizeUrl } });
}

export const connectIntegration = defineOperation({
  name: "integration.connect",
  kind: "command",
  description:
    "Connect the organization to an outside system that integration.list names. OAUTH: returns " +
    "the provider's consent page (`authorizeUrl`, valid 10 minutes) to open in a browser signed " +
    "in to Bibi (some providers require their system administrator to approve); a CONNECTED " +
    "connection keeps working until the new approval replaces it. CREDENTIALS: pass " +
    "`credentials` (its credentialFields); after the change is committed they are checked with " +
    "the provider and stored sealed, never returned; the assistant may not pass them (FORBIDDEN: " +
    "the admin enters them on the settings page). A venue keeps the books in one accounting " +
    "system at a time: connecting a second one is CONFLICT until the first is disconnected. " +
    "HOSTED_ONBOARDING is paymentAccount.startOnboarding (CONFLICT here).",
  input: IntegrationConnectInputSchema,
  output: IntegrationConnectOutputSchema,
  permission: "integration:write",
  entityType: "integrationConnection",
  handler: async ({ input, context }) => {
    // Secrets never pass through the assistant: not in a chat, a proposal card or its audit.
    if (input.credentials !== undefined && context.actor.type === "ai") {
      const message =
        "The assistant cannot enter credentials: connect it on the settings page, Integrations";
      return err({ error: new AppError({ code: "FORBIDDEN", message }) });
    }
    const adapter = getProvider({ key: input.provider });
    if (!adapter.ok) return adapter;
    const single = await checkOneLedger({ context, provider: input.provider });
    if (!single.ok) return single;
    const { connect } = adapter.value;
    if (connect.kind === "OAUTH") return startOauth({ input, context });
    if (connect.kind === "CREDENTIALS") {
      if (!adapter.value.isConfigured()) {
        const message = `${input.provider} is not configured on this server`;
        return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
      }
      return checkCredentials({ input, context, port: connect });
    }
    return conflict({
      message: `${input.provider} connects through its own onboarding: paymentAccount.startOnboarding`,
    });
  },
  external: connectAfterCommit,
});
