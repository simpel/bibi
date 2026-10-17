import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "./routing";
import { DEFAULT_TIME_ZONE } from "./time-zone";
import type { Messages } from "./types";

type LoadMessagesInput = { locale: string };

async function loadMessages({ locale }: LoadMessagesInput): Promise<Messages> {
  const loaded = await import(`../messages/${locale}.json`);
  return loaded.default as Messages;
}

/** Request config factory: `export default createRequestConfig()` in `i18n/request.ts` of the app. */
export function createRequestConfig() {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = resolveLocale({ value: requested });
    return { locale, timeZone: DEFAULT_TIME_ZONE, messages: await loadMessages({ locale }) };
  });
}
