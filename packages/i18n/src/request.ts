import { getRequestConfig } from "next-intl/server";
import { resolveLocale } from "./routing";
import type { Messages } from "./types";

type LoadMessagesInput = { locale: string };

async function loadMessages({ locale }: LoadMessagesInput): Promise<Messages> {
  const loaded = await import(`../messages/${locale}.json`);
  return loaded.default as Messages;
}

export type CreateRequestConfigInput = {
  /**
   * The zone every date and time of the request renders in: the app resolves the organization's
   * zone (ADR 0064), so the result never depends on the host's or the browser's zone.
   */
  loadTimeZone: () => Promise<string>;
};

/** Request config factory: `export default createRequestConfig({ loadTimeZone })` in the app. */
export function createRequestConfig({ loadTimeZone }: CreateRequestConfigInput) {
  return getRequestConfig(async ({ requestLocale }) => {
    const requested = await requestLocale;
    const locale = resolveLocale({ value: requested });
    const [timeZone, messages] = await Promise.all([loadTimeZone(), loadMessages({ locale })]);
    return { locale, timeZone, messages };
  });
}
