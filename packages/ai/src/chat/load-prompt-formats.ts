import {
  type DisplayFormats,
  execute,
  FALLBACK_TIME_ZONE,
  getOrganizationProfile,
  getUserSettings,
} from "@bibi/core";
import type { PromptFormats } from "../prompt/formats-section";
import type { UserContext } from "../server/resolve-user";

const DEFAULTS: DisplayFormats = {
  ...{ dateFormat: null, clockFormat: null },
  ...{ numberFormat: null, currencyDisplay: null },
};

export type LoadPromptFormatsInput = { user: UserContext; locale: string };

/**
 * The signed-in user's formats and the organization's zone for the system prompt, read as the
 * user. A caller who may not read the organization profile gets the fallback zone; tool results
 * still carry each record's own `timeZone`.
 */
export async function loadPromptFormats({
  user,
  locale,
}: LoadPromptFormatsInput): Promise<PromptFormats> {
  const [settings, profile] = await Promise.all([
    execute({ operation: getUserSettings, input: {}, context: user }),
    execute({ operation: getOrganizationProfile, input: {}, context: user }),
  ]);
  const formats = settings.ok
    ? {
        ...{ dateFormat: settings.value.dateFormat, clockFormat: settings.value.clockFormat },
        ...{
          numberFormat: settings.value.numberFormat,
          currencyDisplay: settings.value.currencyDisplay,
        },
      }
    : DEFAULTS;
  const timeZone = profile.ok ? profile.value.timeZone : FALLBACK_TIME_ZONE;
  return { locale, timeZone, formats };
}
