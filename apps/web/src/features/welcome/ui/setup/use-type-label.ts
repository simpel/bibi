"use client";

import { useTranslations } from "next-intl";

/** A preset type's name in the user's language (`welcome.types.<key>`), else its English name. */
export function useTypeLabel() {
  const t = useTranslations("welcome.types");
  return ({ key, name }: { key: string; name: string }): string =>
    t.has(key as Parameters<typeof t>[0]) ? t(key as Parameters<typeof t>[0]) : name;
}
