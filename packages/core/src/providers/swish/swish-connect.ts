import { randomBytes } from "node:crypto";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type {
  CredentialsConnectPort,
  ExternalAccount,
  VerifyCredentialsInput,
} from "../connect-types";
import { type SwishCredentials, SwishCredentialsSchema } from "./swish-credentials";
import { swishCall } from "./swish-request";

const invalid = ({ message }: { message: string }) =>
  err({ error: new AppError({ code: "VALIDATION", message }) });

/**
 * Proves the certificate works without moving money: reads a payment request that cannot exist.
 * Swish answers 404 once the TLS handshake accepted the certificate; a refused certificate fails
 * the handshake (UNAVAILABLE) or answers 401/403.
 */
async function verify({ credentials }: VerifyCredentialsInput): Promise<Result<ExternalAccount>> {
  const parsed = SwishCredentialsSchema.safeParse(credentials);
  if (!parsed.success)
    return invalid({ message: "The Swish number, certificate or passphrase is invalid" });
  const swish: SwishCredentials = parsed.data;
  const probe = randomBytes(16).toString("hex").toUpperCase();
  const path = `/api/v1/paymentrequests/${probe}`;
  const read = await swishCall({ credentials: swish, method: "GET", path });
  if (!read.ok) {
    return invalid({ message: "Swish did not accept the certificate or passphrase" });
  }
  const { status } = read.value;
  if (status === 401 || status === 403) {
    return invalid({ message: "Swish refused the certificate for this Swish number" });
  }
  if (status !== 404 && status !== 200) {
    const message = `Swish answered ${status} while checking the certificate`;
    return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
  }
  return ok({ value: { externalAccountId: swish.swishNumber } });
}

/** Swish connects with the venue's own certificate, passphrase and Swish number (ADR 0100). */
export const swishConnect: CredentialsConnectPort = {
  kind: "CREDENTIALS",
  credentialsSchema: SwishCredentialsSchema,
  verify,
};
