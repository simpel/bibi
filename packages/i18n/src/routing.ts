import { defineRouting } from "next-intl/routing";

export const LOCALES = ["sv", "en"] as const;
export const DEFAULT_LOCALE = "sv" as const;

export type Locale = (typeof LOCALES)[number];

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
});

type ResolveLocaleInput = { value: string | undefined };

/** Return `value` when it is a supported locale, otherwise the default locale. */
export function resolveLocale({ value }: ResolveLocaleInput): Locale {
  return LOCALES.find((locale) => locale === value) ?? DEFAULT_LOCALE;
}
