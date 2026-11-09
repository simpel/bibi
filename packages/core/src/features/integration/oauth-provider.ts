import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OauthConnectPort } from "../../providers/connect-types";
import type { ProviderKey } from "../../providers/provider-keys";
import { getProvider, oauthPortOf } from "../../providers/registry";

/**
 * The OAuth port of a provider an admin connects here (ADR 0087, 0100): UNAVAILABLE when Bibi has
 * no app credentials for it, CONFLICT for a provider that connects another way.
 */
export function configuredOauthPort({
  provider,
}: {
  provider: ProviderKey;
}): Result<OauthConnectPort> {
  const adapter = getProvider({ key: provider });
  if (!adapter.ok) return adapter;
  const port = oauthPortOf({ key: provider });
  if (!port.ok) return port;
  if (!adapter.value.isConfigured()) {
    const message = `${provider} is not configured (app credentials or INTEGRATION_SECRET_KEY).`;
    return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
  }
  return ok({ value: port.value });
}
