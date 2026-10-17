import type { ErrorKey } from "./error-key";

/** Extra `errors.*` keys that only Better Auth responses map to. */
export type AuthErrorKey =
  | ErrorKey
  | "invalidCredentials"
  | "emailTaken"
  | "passwordTooShort"
  | "invalidCode"
  | "tooManyRequests"
  | "invitationInvalid";

/** Shape of `error` in Better Auth client results (all fields optional on purpose). */
export type AuthClientError = { code?: string | undefined; status?: number | undefined };

export type AuthErrorKeyInput = { error: AuthClientError | null | undefined };

const KEY_BY_CODE: Record<string, AuthErrorKey> = {
  INVALID_EMAIL_OR_PASSWORD: "invalidCredentials",
  INVALID_PASSWORD: "invalidCredentials",
  USER_ALREADY_EXISTS: "emailTaken",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "emailTaken",
  PASSWORD_TOO_SHORT: "passwordTooShort",
  INVALID_OTP: "invalidCode",
  OTP_EXPIRED: "invalidCode",
  TOO_MANY_ATTEMPTS: "tooManyRequests",
  INVALID_TOKEN: "invalidCode",
  INVITATION_NOT_FOUND: "invitationInvalid",
};

const KEY_BY_STATUS: Record<number, AuthErrorKey> = {
  401: "unauthorized",
  403: "forbidden",
  404: "notFound",
  429: "tooManyRequests",
};

/** Maps a Better Auth client error to an `errors.*` key; unknown errors become `generic`. */
export function authErrorKey({ error }: AuthErrorKeyInput): AuthErrorKey {
  if (!error) return "generic";
  const byCode = error.code ? KEY_BY_CODE[error.code] : undefined;
  if (byCode) return byCode;
  return (error.status ? KEY_BY_STATUS[error.status] : undefined) ?? "generic";
}
