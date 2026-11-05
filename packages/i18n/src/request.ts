import { getRequestConfig } from "next-intl/server";
import { getCatalog } from "./catalog";
import { resolveLocale } from "./routing";

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
    const timeZone = await loadTimeZone();
    return { locale, timeZone, messages: getCatalog({ locale }) };
  });
}
