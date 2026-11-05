import {
  type MessageNamespace,
  type Messages,
  pickMessages,
  resolveLocale,
  svMessages,
} from "@bibi/i18n";

/** Namespaces required by root `[locale]/layout.tsx`, `error.tsx`, `not-found.tsx`, and `Providers`. */
export const ROOT_NAMESPACES = [
  "common",
  "errors",
  "contact",
  "dev",
] as const satisfies readonly MessageNamespace[];

/** Namespaces required by client components under `(auth)`. */
export const AUTH_NAMESPACES = [
  ...ROOT_NAMESPACES,
  "auth",
  "role",
  "profile",
] as const satisfies readonly MessageNamespace[];

/** Namespaces required by client components under `(docs)/docs`. */
export const DOCS_NAMESPACES = [
  ...ROOT_NAMESPACES,
  "docs",
] as const satisfies readonly MessageNamespace[];

/** Namespaces required by client components under `(welcome)` and `[org]/welcome`. */
export const WELCOME_NAMESPACES = [
  ...ROOT_NAMESPACES,
  "welcome",
  "auth",
  "role",
  "timeZone",
  "hours",
] as const satisfies readonly MessageNamespace[];

/** Namespaces required by client components under `[org]/billing`. */
export const BILLING_NAMESPACES = [
  ...ROOT_NAMESPACES,
  "billing",
  "welcome",
] as const satisfies readonly MessageNamespace[];

/** Namespaces required by client components under `(mothership)/mothership`. */
export const MOTHERSHIP_NAMESPACES = [
  ...ROOT_NAMESPACES,
  "admin",
  "auth",
  "billing",
  "shell",
] as const satisfies readonly MessageNamespace[];

/** Namespaces belonging exclusively to non-`(app)` surfaces that are never shipped to `(app)` clients. */
export const NON_APP_NAMESPACES = [
  "admin",
  "docs",
  "welcome",
  "site",
] as const satisfies readonly MessageNamespace[];

const nonAppSet = new Set<string>(NON_APP_NAMESPACES);

/** Namespaces provided to `[org]/(app)` client components. */
export const APP_NAMESPACES: readonly MessageNamespace[] = (
  Object.keys(svMessages) as MessageNamespace[]
).filter((ns) => !nonAppSet.has(ns));

export type PickSurfaceMessagesInput = {
  locale: string;
  namespaces: readonly MessageNamespace[];
};

/** Resolves `locale` and picks the requested surface's messages for `NextIntlClientProvider`. */
export function pickSurfaceMessages({
  locale,
  namespaces,
}: PickSurfaceMessagesInput): Partial<Messages> {
  return pickMessages({ locale: resolveLocale({ value: locale }), namespaces });
}
