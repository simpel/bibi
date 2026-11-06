"use client";

import { templateNameKey } from "@bibi/core/pipeline-setup-localize";
import { useTranslations } from "next-intl";

type TemplateLabelInput = { group: "statuses" | "states"; name: string };

/** A template status or state name in the user's language, else its English name. */
export function useTemplateLabel() {
  const t = useTranslations("welcome.templates");
  return ({ group, name }: TemplateLabelInput): string => {
    const key = `${group}.${templateNameKey({ name })}` as Parameters<typeof t>[0];
    return t.has(key) ? t(key) : name;
  };
}
