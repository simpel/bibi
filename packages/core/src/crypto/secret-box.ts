import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { AppError } from "../errors/app-error";
import { err, ok, type Result } from "../errors/result";

/** Format version; a new key or cipher gets a new prefix so old values stay readable (ADR 0087). */
const VERSION = "v1";
const ALGORITHM = "aes-256-gcm";

/** The sealing key, or null when `INTEGRATION_SECRET_KEY` is unset. */
export function secretKey(): Buffer | null {
  const { INTEGRATION_SECRET_KEY } = getEnv();
  return INTEGRATION_SECRET_KEY ? Buffer.from(INTEGRATION_SECRET_KEY, "base64") : null;
}

const noKey = () =>
  err({
    error: new AppError({
      code: "UNAVAILABLE",
      message: "Integrations are not configured (INTEGRATION_SECRET_KEY).",
    }),
  });

export type SealSecretInput = { plain: string };

/** Encrypts a secret Bibi must read back (an OAuth token) as `v1.<iv>.<tag>.<ciphertext>`. */
export function sealSecret({ plain }: SealSecretInput): Result<string> {
  const key = secretKey();
  if (!key) return noKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const body = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const parts = [iv, cipher.getAuthTag(), body].map((part) => part.toString("base64url"));
  return ok({ value: [VERSION, ...parts].join(".") });
}

export type OpenSecretInput = { sealed: string };

/** Decrypts a value from `sealSecret`. A wrong key or a tampered value is `INTERNAL`. */
export function openSecret({ sealed }: OpenSecretInput): Result<string> {
  const key = secretKey();
  if (!key) return noKey();
  const [version, iv, tag, body] = sealed.split(".");
  if (version !== VERSION || !iv || !tag || !body) return unreadable({});
  try {
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64url"));
    decipher.setAuthTag(Buffer.from(tag, "base64url"));
    const plain = Buffer.concat([
      decipher.update(Buffer.from(body, "base64url")),
      decipher.final(),
    ]);
    return ok({ value: plain.toString("utf8") });
  } catch (cause) {
    return unreadable({ cause });
  }
}

const unreadable = ({ cause }: { cause?: unknown }) =>
  err({
    error: new AppError({ code: "INTERNAL", message: "A sealed secret is unreadable.", cause }),
  });
