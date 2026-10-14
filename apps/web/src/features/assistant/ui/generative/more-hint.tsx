"use client";

import { useTranslations } from "next-intl";

export type MoreHintProps = { nextCursor: string | null };

/** Footer of a paged result: more rows exist than the tool returned. */
export function MoreHint({ nextCursor }: MoreHintProps) {
  const t = useTranslations("assistant.ui");
  if (!nextCursor) return null;
  return <p className="border-t px-4 py-2 text-xs text-muted-foreground">{t("more")}</p>;
}
