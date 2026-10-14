const SECRET_KEYS = [
  "password",
  "newPassword",
  "currentPassword",
  "token",
  "accessToken",
  "refreshToken",
  "idToken",
  "approvalToken",
  "apiKey",
  "key",
  "secret",
  "clientSecret",
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
];

const asPath = ({ key }: { key: string }): string =>
  /^[A-Za-z_$][\w$]*$/.test(key) ? key : `["${key}"]`;

const join = ({ prefix, key }: { prefix: string; key: string }): string => {
  const path = asPath({ key });
  return path.startsWith("[") ? `${prefix}${path}` : `${prefix}.${path}`;
};

/**
 * Defence in depth (ADR 0014): payloads are never logged, but if a secret slips into a field at
 * the top level or one/two levels down (e.g. `headers.authorization`) it is censored.
 */
export const REDACT_PATHS: readonly string[] = SECRET_KEYS.flatMap((key) => [
  asPath({ key }),
  join({ prefix: "*", key }),
  join({ prefix: "*.*", key }),
]);
