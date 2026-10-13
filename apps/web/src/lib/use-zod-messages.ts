"use client";

import { useTranslations } from "next-intl";
import { zodMessageMap } from "./zod-error-map";

/** Zod parse options with localized messages: `zodResolver(schema, useZodMessages())`. */
export function useZodMessages() {
  const t = useTranslations("errors");
  return { error: zodMessageMap({ translate: (key) => t(key) }) };
}
