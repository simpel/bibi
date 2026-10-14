import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "./routing";
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
    return { locale, messages: await loadMessages({ locale }) };
  });
}
