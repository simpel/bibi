import adminEn from "../messages/en/admin.json";
import assistantEn from "../messages/en/assistant.json";
import authEn from "../messages/en/auth.json";
import catalogEn from "../messages/en/catalog.json";
import commonEn from "../messages/en/common.json";
import docsEn from "../messages/en/docs.json";
import financeEn from "../messages/en/finance.json";
import onboardingEn from "../messages/en/onboarding.json";
import operationsEn from "../messages/en/operations.json";
import ordersEn from "../messages/en/orders.json";
import supportEn from "../messages/en/support.json";
import adminSv from "../messages/sv/admin.json";
import assistantSv from "../messages/sv/assistant.json";
import authSv from "../messages/sv/auth.json";
import catalogSv from "../messages/sv/catalog.json";
import commonSv from "../messages/sv/common.json";
import docsSv from "../messages/sv/docs.json";
import financeSv from "../messages/sv/finance.json";
import onboardingSv from "../messages/sv/onboarding.json";
import operationsSv from "../messages/sv/operations.json";
import ordersSv from "../messages/sv/orders.json";
import supportSv from "../messages/sv/support.json";
import type { MessageTree } from "./check-messages";
import type { Locale } from "./routing";

export const SV_BUNDLES: Record<string, MessageTree> = {
  common: commonSv,
  auth: authSv,
  onboarding: onboardingSv,
  catalog: catalogSv,
  orders: ordersSv,
  operations: operationsSv,
  finance: financeSv,
  assistant: assistantSv,
  admin: adminSv,
  docs: docsSv,
  support: supportSv,
};

export const EN_BUNDLES: Record<string, MessageTree> = {
  common: commonEn,
  auth: authEn,
  onboarding: onboardingEn,
  catalog: catalogEn,
  orders: ordersEn,
  operations: operationsEn,
  finance: financeEn,
  assistant: assistantEn,
  admin: adminEn,
  docs: docsEn,
  support: supportEn,
};

/** Full Swedish message catalog (`sv` is the source of truth for message types). */
export const svMessages = {
  ...commonSv,
  ...authSv,
  ...onboardingSv,
  ...catalogSv,
  ...ordersSv,
  ...operationsSv,
  ...financeSv,
  ...assistantSv,
  ...adminSv,
  ...docsSv,
  ...supportSv,
};

/** Full English message catalog (`en` must match `sv` key-for-key). */
export const enMessages = {
  ...commonEn,
  ...authEn,
  ...onboardingEn,
  ...catalogEn,
  ...ordersEn,
  ...operationsEn,
  ...financeEn,
  ...assistantEn,
  ...adminEn,
  ...docsEn,
  ...supportEn,
};

export type Messages = typeof svMessages;
export type MessageNamespace = keyof Messages;

export type GetCatalogInput = { locale: Locale };

/** Returns the pre-merged message catalog for `locale`. */
export function getCatalog({ locale }: GetCatalogInput): Messages {
  return (locale === "en" ? enMessages : svMessages) as Messages;
}

export type PickMessagesInput = {
  locale: Locale;
  namespaces: readonly MessageNamespace[];
};

/** Picks only the requested top-level namespaces from the locale's message catalog. */
export function pickMessages({ locale, namespaces }: PickMessagesInput): Partial<Messages> {
  const catalog = getCatalog({ locale });
  return Object.fromEntries(namespaces.map((ns) => [ns, catalog[ns]])) as Partial<Messages>;
}
