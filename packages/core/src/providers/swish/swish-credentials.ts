import { z } from "zod";
import { openSecret } from "../../crypto/secret-box";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { ProviderAuth } from "../types";
import { swishNotConnected } from "./swish-config";

/** What an admin enters to connect Swish Handel (ADR 0100); sealed whole on the connection. */
export const SwishCredentialsSchema = z.object({
  swishNumber: z
    .string()
    .regex(/^123\d{7}$/, "A Swish number for merchants: 123 and seven digits")
    .describe("The venue's Swish number for merchants (payee alias), 123xxxxxxx"),
  certificate: z
    .string()
    .min(16)
    .regex(/^[A-Za-z0-9+/=\s]+$/, "The .p12 certificate as base64")
    .describe("The Swish client certificate (.p12/.pfx) as base64"),
  passphrase: z.string().max(256).describe("The certificate's passphrase"),
});

export type SwishCredentials = z.infer<typeof SwishCredentialsSchema>;

const unreadable = () =>
  err({
    error: new AppError({ code: "INTERNAL", message: "The Swish credentials are unreadable" }),
  });

export type OpenSwishInput = { sealed: string | null | undefined };

/** The connection's credentials, opened for one call; never logged or returned. */
export function openSwishCredentials({ sealed }: OpenSwishInput): Result<SwishCredentials> {
  if (!sealed) return swishNotConnected();
  const plain = openSecret({ sealed });
  if (!plain.ok) return plain;
  try {
    const parsed = SwishCredentialsSchema.safeParse(JSON.parse(plain.value));
    return parsed.success ? ok({ value: parsed.data }) : unreadable();
  } catch {
    return unreadable();
  }
}

/** The credentials a provider call carries (`authFor`). */
export const credentialsOf = ({ auth }: { auth: ProviderAuth }) =>
  openSwishCredentials({ sealed: auth.credentialsSealed });
